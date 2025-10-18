import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import "dotenv/config";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Load a sample room image
  const imagePath = "./images/my-room.jpg";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  // asking for JSON
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
  - Detect and list all visible furniture or decorative items (like a bed, desk, chair, lamp, rug, curtain, chandelier, etc.).
  - Ensure numerical values are floats between 0 and 1.
  - Choose exactly one style.
  - Include exactly 5 dominant colors as hex codes (no color names or explanations).
  - Do not include explanations — only valid JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { inlineData: { mimeType: "image/jpeg", data: base64Image } },
      { text: prompt },
    ],
  });

  // saves JSON in output file
  let resultText = response.candidates[0].content.parts[0].text;
  resultText = resultText.replace(/```json\s*|```/g, "").trim();

  console.log("Gemini output:\n", resultText);

  try {
    const json = JSON.parse(resultText);
    fs.writeFileSync("output-room-analysis.json", JSON.stringify(json, null, 2));
    console.log("Success! Saved structured JSON as output-room-analysis.json");
  } catch (err) {
    console.error("Failed! Gemini did not return valid JSON. Output saved in output-room-analysis.txt");
    fs.writeFileSync("output-room-analysis.txt", resultText);
  }
}

main().catch(console.error);
