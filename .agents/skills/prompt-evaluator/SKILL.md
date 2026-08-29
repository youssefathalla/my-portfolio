---
name: prompt-evaluator
description: Automatically generates synthetic test datasets, runs prompt evaluations, grades responses using LLM-as-a-judge (1-10 scale), and generates visual HTML benchmark reports. Use whenever the user asks to evaluate, test, benchmark, or score a prompt or LLM feature.
---

# Prompt Evaluator Skill

This skill provides a systematic framework for evaluating, benchmarking, and scoring LLM prompts against realistic test datasets.

## Core Capabilities

1. **Synthetic Dataset Generation**: Brainstorms $N$ unique test scenarios (edge cases, typical inputs, noisy inputs) and generates detailed inputs + measurable solution criteria.
2. **Execution**: Runs the target prompt function across all test cases.
3. **LLM-as-a-Judge**: Evaluates candidate answers on a rigorous 1–10 scale based on mandatory requirements vs. secondary criteria.
4. **Visual Dashboard Reporting**: Generates a self-contained, styled HTML report (`output.html`) displaying summary KPI boxes (Total Cases, Average Score, Pass Rate ≥ 70%), color-coded score tags, and detailed reasoning.

## How to Use

### 1. Reusable Class Architecture

Import `PromptEvaluator` from `./src/evals/PromptEvaluator.js`:

```javascript
import { PromptEvaluator } from "./src/evals/PromptEvaluator.js";

const evaluator = new PromptEvaluator({
  model: "gemini-3.5-flash-lite", // or gemini-3.7-flash
  maxConcurrent: 3,
});
```

### 2. Workflow Example

```javascript
// Step A: Generate Synthetic Dataset
await evaluator.generateDataset({
  taskDescription: "Extract all action items, assignees, and deadlines from meeting transcripts.",
  promptInputsSpec: {
    transcript: "Raw conversation text with multiple speakers",
  },
  numCases: 5,
  outputFile: "dataset.json",
});

// Step B: Define Candidate Prompt
async function runPrompt(inputs) {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: `Extract action items from:\n${inputs.transcript}`,
  });
  return response.text;
}

// Step C: Run Evaluation & Generate HTML Report
await evaluator.runEvaluation({
  runPromptFunction: runPrompt,
  datasetFile: "dataset.json",
  extraCriteria: "Must not hallucinate tasks not discussed in the transcript.",
  jsonOutputFile: "results.json",
  htmlOutputFile: "report.html",
});
```

## Grading Scale Guide (1–10)

- **1–3 (Failing)**: Fails one or more **MANDATORY** requirements.
- **4–6 (Deficient)**: Meets mandatory requirements but has noticeable deficiencies.
- **7–8 (Good / Passing)**: Meets all mandatory requirements and most secondary criteria.
- **9–10 (Excellent)**: Flawlessly satisfies all criteria without hallucinations or omissions.
