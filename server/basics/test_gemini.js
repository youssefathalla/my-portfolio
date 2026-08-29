import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

// Initialize chat with thinking & streaming
const chat = ai.chats.create({
  model: "gemini-3.5-flash-lite",
  config: {
    temperature: 0.7,
    maxOutputTokens: 1000,
  },
});

console.log("--- Turn 1: Streaming a longer story (Watch words type out!) ---");
process.stdout.write("Gemini: ");

const stream1 = await chat.sendMessageStream({
  message:
    "Hi! My favorite color is orange. Write a 3-paragraph sci-fi story about a rover exploring an orange alien planet.",
});

for await (const chunk of stream1) {
  process.stdout.write(chunk.text);
}

console.log("\n\n--- Turn 2: Follow-up question (Streaming & Memory) ---");
process.stdout.write("Gemini: ");

const stream2 = await chat.sendMessageStream({
  message: "What was my favorite color again?",
});

for await (const chunk of stream2) {
  process.stdout.write(chunk.text);
}

console.log("\n");

// To access specific elements in chat history
const history = chat.getHistory();
for (const message of history) {
  const fullText = message.parts.map((p) => p.text || "").join("");
  if (fullText.trim()) {
    console.log(`[${message.role.toUpperCase()}]:\n${fullText}\n`);
  }
}
