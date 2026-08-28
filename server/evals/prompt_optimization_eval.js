import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { PromptEvaluator } from "./PromptEvaluator.js";

const ai = new GoogleGenAI({});
const evaluator = new PromptEvaluator({ model: "gemini-3.5-flash-lite" });

console.log("==================================================");
console.log("  🔬 PROMPT OPTIMIZATION: Vague vs. Guided Prompt ");
console.log("==================================================\n");

// 1. Task Description
const taskDescription = "Write a compelling short story about a character discovering a hidden, high-stakes talent in a stressful situation.";
const promptInputsSpec = {
  character_concept: "A brief description of the character and their ordinary background",
};

// 2. Generate Dataset
console.log("--- 1. Generating Test Dataset ---");
await evaluator.generateDataset({
  taskDescription,
  promptInputsSpec,
  numCases: 2,
  outputFile: "reports/story_dataset.json",
});

// -------------------------------------------------------------
// Version A: Vague / Basic Prompt (No guidelines, No steps)
// -------------------------------------------------------------
async function promptVersionA(inputs) {
  const prompt = `Write a short story about this character discovering a talent: "${inputs.character_concept}"`;
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: { temperature: 0.7 },
  });
  return response.text;
}

// -------------------------------------------------------------
// Version B: Optimized Prompt (Output Guidelines + Step-by-Step)
// -------------------------------------------------------------
async function promptVersionB(inputs) {
  const prompt = `
Write a short story about a character discovering a hidden talent.

Character Background:
"${inputs.character_concept}"

Follow these steps:
1. Brainstorm 3 unexpected talents that would create high dramatic tension for this specific character.
2. Select the most compelling talent.
3. Outline a pivotal, tense scene where the talent is revealed out of necessity.
4. Write the final story using your outline.

Guidelines:
- Keep the final story under 400 words.
- Include at least one supporting character who witnesses the event.
- Show the physical reaction/cost of using this talent.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: { temperature: 0.7 },
  });
  return response.text;
}

// 3. Run Evaluations for both versions
console.log("\n--- 2. Evaluating Version A (Vague Prompt) ---");
await evaluator.runEvaluation({
  runPromptFunction: promptVersionA,
  datasetFile: "reports/story_dataset.json",
  extraCriteria: "Must include a vivid, high-stakes scene and a supporting character.",
  jsonOutputFile: "reports/story_results_A.json",
  htmlOutputFile: "reports/story_report_A.html",
});

console.log("\n--- 3. Evaluating Version B (Optimized with Steps & Guidelines) ---");
await evaluator.runEvaluation({
  runPromptFunction: promptVersionB,
  datasetFile: "reports/story_dataset.json",
  extraCriteria: "Must include a vivid, high-stakes scene and a supporting character.",
  jsonOutputFile: "reports/story_results_B.json",
  htmlOutputFile: "reports/story_report_B.html",
});
