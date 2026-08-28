import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { PromptEvaluator } from "./PromptEvaluator.js";

const ai = new GoogleGenAI({});
const evaluator = new PromptEvaluator({ model: "gemini-3.5-flash-lite" });

console.log("==================================================");
console.log("  🧪 LIVE EVALUATION TEST: Support Ticket Agent  ");
console.log("==================================================\n");

// 1. Define the task
const taskDescription = "Analyze a customer support message, determine customer sentiment (positive/neutral/negative), identify if they are asking for a refund, and extract their order ID.";
const promptInputsSpec = {
  customer_message: "Customer inquiry or complaint text sent to support",
};

// 2. Generate 3 realistic test scenarios
console.log("--- 1. Generating Test Dataset ---");
await evaluator.generateDataset({
  taskDescription,
  promptInputsSpec,
  numCases: 3,
  outputFile: "reports/support_dataset.json",
});

// 3. Define the Prompt we want to evaluate
async function runSupportPrompt(inputs) {
  const prompt = `
You are a customer support analyzer.
Analyze the following message and output:
- Sentiment: [Positive | Neutral | Negative]
- Refund Requested: [Yes | No]
- Order ID: [Order number or "None"]
- Summary: One sentence summary of the issue.

Customer Message:
"""
${inputs.customer_message}
"""
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.1,
    },
  });

  return response.text;
}

// 4. Run the evaluation and build the HTML report
console.log("--- 2. Running Evaluation & LLM-as-a-Judge ---");
await evaluator.runEvaluation({
  runPromptFunction: runSupportPrompt,
  datasetFile: "reports/support_dataset.json",
  extraCriteria: "Must accurately detect Order IDs (e.g. #12345 or ORD-99) and not miss refund requests.",
  jsonOutputFile: "reports/support_results.json",
  htmlOutputFile: "reports/support_report.html",
});
