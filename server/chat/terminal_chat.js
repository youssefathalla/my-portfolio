import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ai = new GoogleGenAI({});

// Initialize chat session with memory
const chat = ai.chats.create({
  model: "gemini-3.5-flash-lite",
  config: {
    systemInstruction: "You are a friendly, helpful AI assistant. Answer clearly and concisely.",
    temperature: 0.7,
  },
});

const rl = readline.createInterface({ input, output });

console.log("\n==========================================");
console.log("  🤖 Gemini Terminal Chat (Interactive)   ");
console.log("  Model: gemini-3.5-flash-lite             ");
console.log("  Type 'exit' or 'quit' to end session    ");
console.log("==========================================\n");

while (true) {
  const userInput = await rl.question("\x1b[36mYou > \x1b[0m");

  if (!userInput.trim()) continue;

  if (userInput.trim().toLowerCase() === "exit" || userInput.trim().toLowerCase() === "quit") {
    console.log("\n👋 Exiting chat. Goodbye!\n");
    break;
  }

  process.stdout.write("\x1b[32mGemini > \x1b[0m");

  try {
    const responseStream = await chat.sendMessageStream({
      message: userInput,
    });

    for await (const chunk of responseStream) {
      process.stdout.write(chunk.text);
    }
    console.log("\n");
  } catch (error) {
    console.error("\n\x1b[31m[Error]:\x1b[0m", error.message || error);
    console.log("\n");
  }
}

rl.close();
