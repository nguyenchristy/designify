import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from "@google/genai";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// ai route
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Enable CORS
app.use(cors());

// Enable JSON parsing
app.use(express.json());

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'images'));
  },
  filename: function (req, file, cb) {
    // Keep original filename but make it unique with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Handle file upload 
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the path relative to the images directory
    const relativePath = path.relative(
      path.join(__dirname, 'images'),
      req.file.path
    );

    res.json({ 
      message: 'File uploaded successfully',
      path: `images/${relativePath}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// Serve uploaded files statically
app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/api/room-analysis', (req, res) => {
  const filePath = req.query.updated === 'true'
    ? path.join(__dirname, 'updated-output-room-analysis.json')
    : path.join(__dirname, 'output-room-analysis.json');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Room analysis not found' });
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to load room analysis' });
    }
  });
});


// post request for analyzing the room for assets, returns json
app.post('/analyze-room', upload.single('image'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const imageData = fs.readFileSync(filePath);
    const base64Image = imageData.toString('base64');

    const prompt = `
      Analyze this room image and describe its layout.
      Return a JSON object with this structure (no markdown, no backticks, no explanations):
      {
        "objects": [
          {"name": "bed", "x": 0.2, "y": 0.5, "width": 1.2, "height": 2.0},
          {"name": "desk", "x": 0.7, "y": 0.3, "width": 1.0, "height": 0.8}
        ],
        "style": "modern" | "cozy" | "minimalist",
        "colorPalette": ["#HEX", "#HEX", ...]
      }

      Guidelines:
      - Detect and list all visible furniture or decorative items. For example: a bed, desk, chair, lamp, rug. 
      - Differentiate multiple instances of the same object by appending a number (e.g., "chair 1", "chair 2").
      - Do not include furniture that people would not normally move such as walls, windows, AC units, floor, nor curtains as objects.
      - Ensure numerical values are floats between 0 and 1.
      - Choose exactly one style.
      - Include exactly 5 dominant colors as hex codes (no color names or explanations).
      - Do not include explanations — only valid JSON.
    `;


    // call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { mimeType: req.file.mimetype, data: base64Image } },
        { text: prompt }
      ],
    });

    let resultText = response.candidates[0].content.parts[0].text;
    resultText = resultText.replace(/```json\s*|```/g, '').trim();

    // Parse JSON
    let json;
    try {
      json = JSON.parse(resultText);
    } catch (err) {
      return res.status(500).json({ error: 'Gemini returned invalid JSON', raw: resultText });
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Write the analysis result to a fixed JSON file
    const jsonOutputPath = path.join(__dirname, 'output-room-analysis.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(json, null, 2), 'utf-8');

    // Return JSON to frontend
    res.json(json);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// updates location after user chooses where
app.post('/update-location', async (req, res) => {
  try {
    console.log("🟢 Received update-location request:", req.body);

    const { imagePath, objects } = req.body;
    if (!imagePath || !objects) {
      return res.status(400).json({ error: 'Missing imagePath or objects' });
    }

    const originalPath = path.join(__dirname, 'output-room-analysis.json');
    if (!fs.existsSync(originalPath)) {
      return res.status(400).json({ error: 'Original room analysis not found' });
    }

    // Load the existing JSON
    const originalData = JSON.parse(fs.readFileSync(originalPath, 'utf-8'));

    // Make a deep copy to modify
    const updatedData = structuredClone(originalData);

    // Update only the objects provided
    // for (const updatedObj of objects) {
    //   const index = updatedData.objects.findIndex(o => o.name === updatedObj.name);
    //   if (index !== -1) {
    //     // Merge new coordinates (x, y, etc.)
    //     updatedData.objects[index] = { ...updatedData.objects[index], ...updatedObj };
    //   } else {
    //     // If it's new, add it
    //     updatedData.objects.push(updatedObj);
    //   }
    // }
    // Merge updates while keeping all original objects
    const updatedNames = objects.map(o => o.name);
    updatedData.objects = updatedData.objects.map(obj => {
      const match = objects.find(o => o.name === obj.name);
      return match ? { ...obj, ...match } : obj;
    });

    // Add any brand-new objects
    for (const obj of objects) {
      if (!updatedData.objects.some(o => o.name === obj.name)) {
        updatedData.objects.push(obj);
      }
    }


    // Write the updated layout to a new file
    const updatedPath = path.join(__dirname, 'updated-output-room-analysis.json');
    fs.writeFileSync(updatedPath, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log("✅ Updated layout saved at:", updatedPath);

    // Optionally use this new JSON as the basis for next steps (like regenerating the image)
    res.json(updatedData);

  } catch (err) {
    console.error("🔥 Error in /update-location:", err);
    res.status(500).json({ error: 'Failed to update room layout' });
  }
});


// app.post("/render-room", async (req, res) => {
//   try {
//     const { layout } = req.body;
//     if (!layout) {
//       return res.status(400).json({ error: "Missing layout JSON" });
//     }

//     const { style, colorPalette, objects, imagePath } = layout;

//     // Read base image
//     const inputImagePath =
//       imagePath || path.join(__dirname, "images", "default-room.jpg");

//     if (!fs.existsSync(inputImagePath)) {
//       return res.status(400).json({ error: "Base room image not found" });
//     }

//     const imageData = fs.readFileSync(inputImagePath);
//     const base64Image = imageData.toString("base64");

//     // 🧠 Build prompt
//     const prompt = [
//       {
//         // text: `
//         //   You are a visual AI model. Update this ${style} room according to the new layout:
//         //   - Objects: ${objects.map((o) => `${o.name} at (x=${o.x}, y=${o.y})`).join(", ")}.
//         //   - Use color palette: ${colorPalette.join(", ")}.
//         //   Maintain photorealism and room structure.
//         // `,
//         text: `
//         Edit the provided image to reflect these specific layout changes:
//         - Move or reposition furniture according to the coordinates below.
//         - Add or remove objects as listed.
//         - Maintain the same room, perspective, and lighting.

//         Layout JSON:
//         ${JSON.stringify(objects, null, 2)}

//         The output must look like a realistic photo update of the original image — not a new scene.
//       `,

//       },
//       {
//         inlineData: {
//           mimeType: "image/jpeg",
//           data: base64Image,
//         },
//       },
//     ];

//     // 🪄 Generate image
//     const result = await ai.models.generateContent({
//       model: "gemini-2.5-flash-image",
//       contents: prompt,
//     });

//     // 🖼️ Save image
//     const parts = result.candidates[0].content.parts;
//     let outputFile;
//     for (const part of parts) {
//       if (part.inlineData) {
//         const buffer = Buffer.from(part.inlineData.data, "base64");
//         outputFile = path.join(__dirname, "images", "updated-room.jpg");
//         fs.writeFileSync(outputFile, buffer);
//         console.log("🖼️ Updated image saved:", outputFile);
//       }
//     }

//     if (!outputFile) {
//       return res.status(500).json({ error: "No image data received from Gemini" });
//     }

//     res.json({ imagePath: `images/updated-room.jpg` });
//   } catch (err) {
//     console.error("🚨 Failed to render updated room:", err);
//     res.status(500).json({ error: "Failed to render updated room", details: err.message });
//   }
// });

app.post("/render-room", async (req, res) => {
  try {
    console.log("🖼️ Generating new room image with Imagen...");

    const { layout } = req.body;
    if (!layout) {
      return res.status(400).json({ error: "Missing layout JSON" });
    }

    const { style, colorPalette, objects, imagePath } = layout;

    // ✅ Load base image (optional)
    const inputImagePath = imagePath
      ? path.join(__dirname, imagePath)
      : path.join(__dirname, "images", "default-room.jpg");

    if (!fs.existsSync(inputImagePath)) {
      return res.status(400).json({ error: "Base image not found" });
    }

    const baseImage = fs.readFileSync(inputImagePath);
    const base64Image = baseImage.toString("base64");

    // ✅ Build descriptive prompt
    const prompt = `
      Generate a realistic ${style} bedroom image.
      Reflect these layout updates:
      ${objects.map(o => `- ${o.name} at (x=${o.x}, y=${o.y})`).join("\n")}
      Use this color palette: ${colorPalette.join(", ")}.
      Keep the same lighting, camera angle, and room structure as the input image.
      Only adjust the object positions — do not redesign the entire room.
    `;

    // ✅ Call Imagen
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });

    // ✅ Save the generated image
    const generatedImage = response.generatedImages?.[0];
    if (!generatedImage?.image?.imageBytes) {
      throw new Error("No image bytes returned from Imagen");
    }

    const buffer = Buffer.from(generatedImage.image.imageBytes, "base64");
    const outputPath = path.join(__dirname, "images", "updated-room.jpg");
    fs.writeFileSync(outputPath, buffer);
    console.log("✅ Saved updated room image:", outputPath);

    res.json({ imagePath: `images/updated-room.jpg` });
  } catch (err) {
    console.error("🚨 Imagen render failed:", err);
    res.status(500).json({
      error: "Failed to render updated room",
      details: err.message,
    });
  }
});




app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});