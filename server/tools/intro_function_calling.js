import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

console.log("==================================================");
console.log("  🛠️ MODULE 3: Introduction to Function Calling   ");
console.log("==================================================\n");

// 1. Define our real JavaScript function (e.g. database or live API)
function getStockPrice({ ticker }) {
  console.log(`📡 [Local Function Executed] Fetching stock price for: ${ticker}`);
  const mockDatabase = {
    AAPL: { price: 232.50, currency: "USD", change: "+1.4%" },
    GOOGL: { price: 185.20, currency: "USD", change: "+2.1%" },
    TSLA: { price: 214.80, currency: "USD", change: "-0.8%" },
  };
  return mockDatabase[ticker.toUpperCase()] || { error: "Ticker not found" };
}

// 2. Define the Tool Declaration (Schema) for Gemini
const stockPriceTool = {
  name: "getStockPrice",
  description: "Retrieves the real-time stock price and daily change for a given company stock ticker symbol.",
  parameters: {
    type: "OBJECT",
    properties: {
      ticker: {
        type: "STRING",
        description: "The stock ticker symbol (e.g. AAPL, GOOGL, TSLA)",
      },
    },
    required: ["ticker"],
  },
};

// 3. Step A: Send User Question + Tool Declaration to Gemini
const userPrompt = "Can you check the current stock price of Google (GOOGL) and Apple (AAPL)?";
console.log(`👤 User: "${userPrompt}"\n`);
console.log("⏳ Sending request to Gemini with getStockPrice tool...");

const response1 = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: userPrompt,
  config: {
    tools: [{ functionDeclarations: [stockPriceTool] }],
  },
});

// 4. Step B: Inspect the Model's Tool Calls
const functionCalls = response1.functionCalls;
console.log(`🤖 Model decided to call ${functionCalls.length} tool(s):`);
console.log(JSON.stringify(functionCalls, null, 2), "\n");

// 5. Step C: Execute the local functions for each call
const toolResponseParts = [];

for (const call of functionCalls) {
  let result;
  if (call.name === "getStockPrice") {
    result = getStockPrice(call.args);
  }

  toolResponseParts.push({
    functionResponse: {
      name: call.name,
      response: result,
    },
  });
}

// 6. Step D: Feed the Tool Results back to Gemini for the Final Answer
console.log("⏳ Sending tool results back to Gemini for final response...\n");

const finalResponse = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: [
    { role: "user", parts: [{ text: userPrompt }] },
    response1.candidates[0].content, // Model's tool call request
    { role: "user", parts: toolResponseParts }, // Our tool execution results
  ],
  config: {
    tools: [{ functionDeclarations: [stockPriceTool] }],
  },
});

console.log("==================================================");
console.log("🎉 FINAL GEMINI RESPONSE:");
console.log(finalResponse.text);
console.log("==================================================");
