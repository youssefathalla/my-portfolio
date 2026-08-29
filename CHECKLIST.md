# 📋 Coursera: Building with the API — Master Learning Guide & Source of Truth

This repository is your permanent **Source of Truth** and reference guide for building production AI applications with Node.js and the modern `@google/genai` SDK.

---

## 🏛️ Module 1: Getting Started with the API (Completed ✅)

### 1.1 SDK Installation & Client Initialization

> **Why:** Sets up the official, unified Google GenAI client (`@google/genai`) reading your `GEMINI_API_KEY` from `.env`.

```javascript
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({}); // Automatically picks up process.env.GEMINI_API_KEY
```

---

### 1.2 Stateless Text Generation (`generateContent`)

> **Why:** Best for single, one-off questions where conversation history is not needed.

```javascript
const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: "Explain gravity in one sentence.",
});
console.log(response.text);
```

---

### 1.3 Multi-Turn Chat & Memory (`ai.chats.create`)

> **Why:** Automatically stores message history so the model remembers earlier conversation turns.

```javascript
const chat = ai.chats.create({ model: "gemini-3.5-flash-lite" });

// Turn 1
await chat.sendMessage({ message: "My name is Youssef." });

// Turn 2 (Remembers Turn 1)
const res = await chat.sendMessage({ message: "What is my name?" });
console.log(res.text); // "Your name is Youssef!"
```

---

### 1.4 Real-Time Streaming (`sendMessageStream`)

> **Why:** Eliminates waiting latency by printing tokens/words chunk-by-chunk in real time.

```javascript
const stream = await chat.sendMessageStream({ message: "Write a poem about space." });

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

---

### 1.5 Inspecting Conversation History (`chat.getHistory`)

> **Why:** View all previous turns and parts exchanged between `user` and `model`.

```javascript
const history = await chat.getHistory();

for (const msg of history) {
  const text = msg.parts.map((p) => p.text || "").join("");
  console.log(`[${msg.role.toUpperCase()}]: ${text}`);
}
```

---

### 1.6 System Instructions & Personas (`systemInstruction`)

> **Why:** Define the persona, behavioral rules, and constraints before conversations start.

```javascript
const chat = ai.chats.create({
  model: "gemini-3.5-flash-lite",
  config: {
    systemInstruction: "You are a strict math tutor. Only reply with the final numerical answer.",
  },
});
```

---

### 1.7 Temperature & Max Output Tokens (`temperature`, `maxOutputTokens`)

> **Why:** `temperature: 0.0` for deterministic code/math logic; `0.7+` for creative writing. `maxOutputTokens` prevents runaway costs.

```javascript
const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: "Brainstorm 3 project names for a fitness app.",
  config: {
    temperature: 0.8, // Higher randomness for brainstorming
    maxOutputTokens: 150, // Capped length
  },
});
```

---

### 1.8 Stop Sequences (`stopSequences`)

> **Why:** Cuts off generation immediately when a specific string is hit (e.g. stopping after 1 paragraph, stopping SQL at `;`, or cutting numbered lists).

```javascript
const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: "Write a story with multiple paragraphs.",
  config: {
    stopSequences: ["\n\n"], // Cuts off generation as soon as paragraph 1 finishes!
  },
});
```

---

### 1.9 Reasoning & Thinking Mode (`thinkingConfig`)

> **Why:** Enables visible step-by-step thinking for complex math, coding, and logical tasks.

```javascript
const chat = ai.chats.create({
  model: "gemini-3.5-flash-lite",
  config: {
    thinkingConfig: {
      includeThoughts: true,
      thinkingLevel: "low", // "minimal" | "low" | "medium"
    },
  },
});
```

---

### 1.10 Sampling Thresholds (`topK` & `topP`)

> **Why:** `topK` restricts the choice pool to the top $K$ most likely words. `topP` (nucleus sampling) restricts to the top cumulative $P\%$ probability pool.

```javascript
const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: "Suggest 3 creative names for a science podcast.",
  config: {
    temperature: 0.7,
    topK: 40, // Only consider top 40 candidate words
    topP: 0.95, // Filter down to top 95% cumulative probability pool
  },
});
```

---

## 🏛️ Module 2: Prompt Engineering & Evaluation (Completed ✅)

### 2.1 Being Clear & Direct

> **Golden Rule:** Say exactly what you want upfront without fluff or ambiguous phrasing.

```javascript
// ❌ Ambiguous: "Can you maybe talk about JavaScript?"
// ✅ Clear & Direct: "Explain the difference between let, const, and var in JavaScript. Use 3 bullet points."
```

---

### 2.2 Being Specific (Guidelines vs. Step-by-Step Instructions)

> **Why:** Vague prompts yield mediocre answers (~5/10). Adding **Guidelines** sets hard output boundaries, while **Step-by-Step Instructions** force the AI to brainstorm and outline _before_ writing, yielding cohesive, high-scoring answers (9-10/10).

```javascript
// Technique A: Output Guidelines (Guardrails)
const promptWithGuidelines = `
Write a short story about a pilot discovering a space anomaly.

Guidelines:
1. Keep the story under 500 words.
2. Include a clear action where the pilot makes a high-stakes decision.
3. Include at least one supporting crew member with dialogue.
`;

// Technique B: Step-by-Step Procedural Prompt (Chain-of-Thought)
const promptWithSteps = `
Write a short story about a pilot discovering a space anomaly.

Follow these steps:
1. Brainstorm 3 anomaly types that create severe scientific danger.
2. Pick the most dramatic anomaly.
3. Outline the pivotal decision point for the pilot.
4. Brainstorm 2 crew members with contrasting viewpoints.
5. Write the final story (under 500 words) using your outline.
`;
```

---

### 2.3 Structure with XML Tags

> **Why:** Prevents ambiguity, stops prompt injection, and creates clear semantic boundaries so the model knows where instructions, reference docs, and inputs start and end.

```javascript
const prompt = `
Debug the code in <my_code> using the reference documentation in <docs>.

<my_code>
from datavortex import Pipeline, DataSource

def process_data(input_file, output_file):
    pipeline = Pipeline()
    source = DataSource.from_csv(input_file)
</my_code>

<docs>
# Creating a data source from data vortex:
csv_source = DataSource.from_csv("data.csv")
pipeline.add_source(csv_source)
</docs>

<instructions>
1. Identify the missing pipeline connection.
2. Output the corrected code inside <code> tags.
</instructions>
`;

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: prompt,
});
```

---

### 2.4 Providing Examples (One-Shot & Multi-Shot Prompting)

> **Why ("Show, Don't Just Tell"):**
>
> - **One-Shot**: Provide a single input/output example to lock in formatting.
> - **Multi-Shot (Few-Shot)**: Provide 2–5 examples to capture complex corner cases (e.g. sarcasm, domain slang).
> - **Best Practice**: Always combine examples with XML tags (`<sample_input>` and `<ideal_output>`) for clean structure!

```javascript
const prompt = `
Generate a customized daily meal plan based on the user's health profile.

Here is an example of a sample input with an ideal response:
<sample_input>
height: 170
weight: 70
goal: Maintain fitness and improve cholesterol levels
restrictions: High cholesterol
</sample_input>
<ideal_output>
Breakfast: Steel-cut oats with chia seeds, walnuts, and blueberries.
Lunch: Grilled wild salmon with quinoa and steamed broccoli.
Dinner: Lentil vegetable stew with brown rice and leafy green salad.
Snacks: Sliced apple with almond butter, raw almonds.
</ideal_output>
This is an ideal output because it strictly avoids saturated fats for the high cholesterol restriction, meets the 70kg maintenance calorie profile, and avoids unrequested medical advice.

Now generate the meal plan for this profile:
<user_profile>
${userProfile}
</user_profile>
`;
```

---

### 2.5 Automated Evals & LLM-as-a-Judge (Completed ✅)

> **The School Exam Analogy:**
>
> 1. 📝 **The Teacher (AI):** Brainstorms scenarios & synthesizes test datasets.
> 2. 👨‍🎓 **The Student (Your Bot):** Answers the questions _(the prompt you are testing)_.
> 3. ⚖️ **The Grader (Judge AI):** Rigorously grades output (1–10) and generates an interactive HTML dashboard.

```javascript
import { PromptEvaluator } from "./src/evals/PromptEvaluator.js";
const evaluator = new PromptEvaluator({ model: "gemini-3.5-flash-lite" });

// 1. Generate Synthetic Dataset
await evaluator.generateDataset({
  taskDescription: "Analyze customer support ticket and extract order ID + refund request.",
  promptInputsSpec: { customer_message: "Support message text" },
  numCases: 3,
  outputFile: "reports/support_dataset.json",
});

// 2. Define Candidate Prompt Function
async function runSupportPrompt(inputs) {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: `Analyze: ${inputs.customer_message}`,
  });
  return response.text;
}

// 3. Run Evaluation & Generate Visual HTML Dashboard
await evaluator.runEvaluation({
  runPromptFunction: runSupportPrompt,
  datasetFile: "reports/support_dataset.json",
  extraCriteria: "Must accurately detect Order IDs and refund requests.",
  jsonOutputFile: "reports/support_results.json",
  htmlOutputFile: "reports/support_report.html",
});
```

**Commands:**

- `npm run eval:support` ➡️ Support ticket evaluation benchmark.
- `npm run eval:meeting` ➡️ Meeting action items evaluation benchmark.
- `npm run eval:opt` ➡️ Side-by-side prompt optimization benchmark (Vague vs Guided).

---

## 🏛️ Module 3: Features & Tool Use (Structured Outputs & Tools)

### 3.1 Structured Outputs & JSON Mode (`responseSchema`)

> **Why:** Forces Gemini at the neural-engine level to output 100% valid, clean JSON without any markdown fences (` ```json `), chatty filler, or invalid syntax. Directly parseable with `JSON.parse()`.

```javascript
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: "List 3 programming languages and their release year.",
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          year: { type: "INTEGER" },
        },
        required: ["name", "year"],
      },
    },
  },
});

// Pure JSON returned - zero regex or string cleaning needed!
const data = JSON.parse(response.text);
console.log(data);
// Output:
// [
//   { name: "Python", year: 1991 },
//   { name: "JavaScript", year: 1995 },
//   { name: "Java", year: 1995 }
// ]
```

### 3.2 Custom Function Calling (Tool Use)

> **Why:** Gives the AI "hands" to fetch real-time data, query SQL databases, call APIs, or execute computations.
>
> **The 3-Step Loop:**
>
> 1. **Declare Schema**: Tell Gemini what functions exist and their parameters.
> 2. **Model Calls**: Gemini returns a structured `functionCalls` array (can call multiple tools in parallel!).
> 3. **Execute & Feed Back**: Run your local JS function and send `functionResponse` back to the model for the final answer.

```javascript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});

// 1. Tool Declaration (Schema)
const stockPriceTool = {
  name: "getStockPrice",
  description: "Retrieves the real-time stock price and change for a given ticker symbol.",
  parameters: {
    type: "OBJECT",
    properties: {
      ticker: { type: "STRING", description: "Stock ticker symbol (e.g. AAPL, GOOGL)" },
    },
    required: ["ticker"],
  },
};

// 2. Send prompt with available tools
const res1 = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: "What is the stock price of Google (GOOGL) and Apple (AAPL)?",
  config: { tools: [{ functionDeclarations: [stockPriceTool] }] },
});

// 3. Execute local functions for each requested call
const toolResponseParts = [];
for (const call of res1.functionCalls) {
  const data = myRealStockFunction(call.args.ticker); // { price: 185.20, change: "+2.1%" }
  toolResponseParts.push({
    functionResponse: { name: call.name, response: data },
  });
}

// 4. Feed results back to Gemini for the final natural language answer
const finalRes = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: [
    { role: "user", parts: [{ text: "What is the stock price of GOOGL and AAPL?" }] },
    res1.candidates[0].content, // Model's tool request
    { role: "user", parts: toolResponseParts }, // Our tool output
  ],
  config: { tools: [{ functionDeclarations: [stockPriceTool] }] },
});

console.log(finalRes.text);
// "Google (GOOGL) is $185.20 (+2.1%) and Apple (AAPL) is $232.50 (+1.4%)."
```

**Command:**

- `npm run tool:intro` ➡️ Runs the live stock price tool calling demo.

---

### 3.3 Google Search Grounding (Upcoming ⏳)

> **Why:** `tools: [{ googleSearch: {} }]` to give Gemini real-time internet search capability.

### 3.4 Code Execution (Upcoming ⏳)

> **Why:** `tools: [{ codeExecution: {} }]` letting Gemini write and execute Python code in a secure sandbox.

---

## 🏛️ Module 4: Model Context Protocol (MCP) (Upcoming ⏳)

- [ ] Understanding MCP architecture (Clients, Servers, Hosts).
- [ ] Building custom MCP servers for local tools, file systems, and databases.

---

## 🏛️ Module 5: Retrieval Augmented Generation (RAG) (Upcoming ⏳)

- [ ] Vector embeddings with `ai.models.embedContent()`.
- [ ] Semantic search & context injection over custom documents.

---

## 🏛️ Module 6: Code & Computer Use (Upcoming ⏳)

- [ ] Sandboxed execution, tool chaining, and automated debugging.

---

## 🏛️ Module 7: Agentic Workflows (Upcoming ⏳)

- [ ] Multi-agent orchestration, Router patterns, and Evaluator-Optimizer feedback loops.
