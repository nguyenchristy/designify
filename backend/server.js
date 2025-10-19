import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
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

// Add route to serve room analysis JSON
app.get('/api/room-analysis', (req, res) => {
  const filePath = path.join(__dirname, 'output-room-analysis.json');
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

// app.post('/update-location', async (req, res) => {
//   try {
//     const { imagePath, objects } = req.body;
//     if (!imagePath || !objects) {
//       return res.status(400).json({ error: 'Missing imagePath or objects' });
//     }

//     const prompt = `
//       You are given a room layout and new object coordinates. 
//       Validate and refine them for spatial coherence — avoid overlap and unrealistic placement.
//       Return the updated JSON in this format:
//       {
//         "objects": [...],
//         "style": "<same style or adjusted if needed>",
//         "colorPalette": ["#HEX", ...]
//       }
//     `;

//     const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });

//     const response = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: [
//         { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
//         { text: prompt },
//         { text: JSON.stringify({ objects }) }
//       ]
//     });

//     let resultText = response.candidates[0].content.parts[0].text;
//     resultText = resultText.replace(/```json\s*|```/g, '').trim();

//     const updatedLayout = JSON.parse(resultText);

//     fs.writeFileSync('updated-output-room-analysis.json', JSON.stringify(updatedLayout, null, 2));

//     res.json(updatedLayout);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to update room layout' });
//   }
// });

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
    for (const updatedObj of objects) {
      const index = updatedData.objects.findIndex(o => o.name === updatedObj.name);
      if (index !== -1) {
        // Merge new coordinates (x, y, etc.)
        updatedData.objects[index] = { ...updatedData.objects[index], ...updatedObj };
      } else {
        // If it's new, add it
        updatedData.objects.push(updatedObj);
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


app.post('/render-room', async (req, res) => {
  try {
    const { layout } = req.body;
    if (!layout) {
      return res.status(400).json({ error: 'Missing layout JSON' });
    }

    const prompt = `
      Render a photorealistic image of a bedroom based on this JSON layout:
      ${JSON.stringify(layout, null, 2)}
      Make sure to follow the positions (x, y, width, height) and style/colorPalette closely.
      The result should visually represent the described room layout.
    `;

    const response = await ai.models.generateImage({
      model: 'gemini-2.0-pro-vision',
      prompt,
      size: '1024x1024'
    });

    const imageBase64 = response.data[0].b64_json;
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    const outputPath = path.join(__dirname, 'images', 'updated-room.jpg');
    fs.writeFileSync(outputPath, imageBuffer);

    res.json({ imagePath: `images/updated-room.jpg` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to render updated room', details: err.message });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});