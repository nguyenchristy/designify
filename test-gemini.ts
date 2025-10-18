import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  // Load a sample image (e.g., "room.jpg")
  const image = fs.readFileSync("./room.jpg").toString("base64");

  // You can tweak this prompt later to fit your app
  const prompt = `
    Analyze this room and describe an ideal minimalist redesign.
    Return JSON with positions, furniture, and style notes.
  `;

  const result = await genAI.generateContent([
    { inlineData: { mimeType: "image/jpeg", data: image } },
    { text: prompt }
  ]);

  console.log(result.response.text());
}

run();
