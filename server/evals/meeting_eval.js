import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { PromptEvaluator } from "./PromptEvaluator.js";

const ai = new GoogleGenAI({});
const evaluator = new PromptEvaluator({ model: "gemini-3.5-flash-lite" });

// 1. Define the task specification
const taskDescription =
  "Extract all action items from a team meeting transcript and assign them to the correct person.";
const promptInputsSpec = {
  transcript: "Raw meeting conversation text with multiple speakers discussing tasks and deadlines",
};

// 2. Generate the test dataset
await evaluator.generateDataset({
  taskDescription,
  promptInputsSpec,
  numCases: 3,
  outputFile: "reports/meeting_dataset.json",
});

// 3. Define the prompt function you want to evaluate
async function runMeetingPrompt(inputs) {
  const prompt = `
Extract all action items from the following meeting transcript.
For each action item, list:
- Task description
- Assigned person
- Deadline (if mentioned)

Transcript:
"""
${inputs.transcript}
"""
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  return response.text;
}

// 4. Run the full evaluation and generate output.html
await evaluator.runEvaluation({
  runPromptFunction: runMeetingPrompt,
  datasetFile: "reports/meeting_dataset.json",
  extraCriteria: "Must not invent or hallucinate tasks that were not discussed in the transcript.",
  jsonOutputFile: "reports/meeting_results.json",
  htmlOutputFile: "reports/meeting_report.html",
});
