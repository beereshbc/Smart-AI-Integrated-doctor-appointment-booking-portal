import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import doctorModel from "../models/doctorModel.js";

export const chatWithAI = async (req, res) => {
  try {
    const { message, image } = req.body;

    // Validate that there is at least a message OR an image
    if ((!message || message.trim().length === 0) && !image) {
      return res.json({ success: false, reply: "Please describe your issue or upload an image." });
    }

    // Load available doctors for context
    const doctors = await doctorModel.find({ available: true }).select([
      "name",
      "speciality",
      "experience",
    ]);

    const doctorsList = doctors
      .map(
        (d, i) =>
          `${i + 1}. ${d.name} — ${d.speciality}, ${d.experience} experience`
      )
      .join("\n");

    // Load the system prompt
    // Ensure you have a valid path in your .env or constant
    const basePrompt = fs.readFileSync(process.env.PROMPT_PATH || "./prompts/doctorPrompt.txt", "utf8");

    // Prepare the text prompt. If message is empty (image only), provide a default context.
    const finalSystemPrompt = basePrompt
      .replace("${doctorsList}", doctorsList)
      .replace("${message}", message || "Analyze the attached medical image and provide insights.");

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-09-2025", 
    });

    // Construct the payload parts
    let promptParts = [
      { text: finalSystemPrompt }
    ];

    // If an image exists, format it for Gemini
    if (image) {
      // The frontend sends a Data URI: "data:image/jpeg;base64,/9j/4AAQ..."
      // We need to split it to get the raw base64 and the mimeType.
      try {
        const [mimeMetadata, base64Data] = image.split(",");
        // Extract mime type (e.g., "image/jpeg") from "data:image/jpeg;base64"
        const mimeType = mimeMetadata.match(/:(.*?);/)[1]; 

        promptParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      } catch (e) {
        console.error("Image parsing error", e);
      }
    }

    // Generate response
    const result = await model.generateContent(promptParts);
    const reply = result.response.text();

    res.json({ success: true, reply });

  } catch (error) {
    console.log("AI Error:", error.message);
    return res.json({
      success: false,
      reply: "Server error. Please try again later.",
    });
  }
};