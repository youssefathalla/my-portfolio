import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { BaseCardComponent } from '@shared/ui/cards/base-card/base-card.component';
import { LoaderComponent } from '@shared/ui/loader/loader.component';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface ToolExecution {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

interface EvalResult {
  test_case: {
    id: number;
    scenario: string;
    prompt_inputs: Record<string, unknown>;
    solution_criteria: string[];
  };
  output: string;
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  status: 'passed' | 'failed';
}

interface EvalSummary {
  totalTests: number;
  avgScore: string;
  passedCount: number;
  failedCount: number;
  passRate: string;
  allWeaknesses?: string[];
  allStrengths?: string[];
  recommendations?: string[];
}

interface InputEntry {
  key: string;
  value: string;
}

const DEFAULT_PROMPTS = {
  support: `Analyze the customer support message in <ticket>.

<ticket>
{{customer_message}}
</ticket>

<instructions>
Follow these strict rules:
1. Sentiment: Classify as "Positive", "Negative", or "Neutral / Mixed". Be alert for sarcasm (e.g., using positive words like "fantastic" to express frustration).
2. Refund Request: Answer "Yes" or "No" (include store credit requests as "Yes").
3. Order ID: Extract the exact Order ID associated with the issue. If multiple order numbers are mentioned, isolate only the one needing assistance.
4. Multilingual: If the message is in Spanish or another language, analyze the meaning accurately and respond in English.
5. Strict Output: Output ONLY the 3 lines below with no extra fields, summaries, or introductions.
</instructions>

Here is an ideal example:
<sample_input>
Order #1234 arrived broken, while #5678 is fine. Fantastic job shipping a shattered vase! Can I get my money back?
</sample_input>
<ideal_output>
Sentiment: Negative
Refund Requested: Yes
Order ID: #1234
</ideal_output>

Output format:
Sentiment: [Positive | Negative | Neutral / Mixed]
Refund Requested: [Yes | No]
Order ID: [Extracted ID or None]`,

  meeting: `Extract all action items from the meeting transcript in <transcript>.

<transcript>
{{meeting_transcript}}
</transcript>

<instructions>
Follow these guidelines:
1. Action Item: Clearly state the actionable task.
2. Owner: Assign the responsible person.
3. Deadline: Include the exact deadline if mentioned, or "None" if unspecified.
4. Output format: List only the extracted items cleanly.
</instructions>

Output format:
• Task: [Action item description] | Owner: [Name] | Deadline: [Date/Time or None]`,
};

@Component({
  selector: 'app-gemini-ai-tab',
  templateUrl: './gemini-ai-tab.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    SharedIconModule,
    BaseCardComponent,
    LoaderComponent,
  ],
})
export class GeminiAiTabComponent {
  private readonly sanitizer = inject(DomSanitizer);

  // Active Section ('evals' | 'chat' | 'tools')
  protected readonly activeSection = signal<'evals' | 'chat' | 'tools'>('evals');
  protected readonly showRawOutput = signal<boolean>(false);

  // --- 1. CHAT SIGNALS ---
  protected readonly prompt = signal<string>('');
  protected readonly isStreaming = signal<boolean>(false);
  protected readonly currentStreamingText = signal<string>('');
  protected readonly messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your Gemini AI assistant. Ask me questions, test prompt templates, or explore tool calling.',
    },
  ]);

  // --- 2. TOOL CALLING SIGNALS ---
  protected readonly toolPrompt = signal<string>(
    'What is the current stock price of Apple (AAPL) and Google (GOOGL)?',
  );
  protected readonly isToolRunning = signal<boolean>(false);
  protected readonly toolExecutions = signal<ToolExecution[]>([]);
  protected readonly toolFinalAnswer = signal<string>('');

  // --- 3. EVALUATION BENCHMARK SIGNALS ---
  protected readonly selectedPreset = signal<'support' | 'meeting'>('support');
  protected readonly customPromptTemplate = signal<string>(DEFAULT_PROMPTS.support);
  protected readonly isEvalRunning = signal<boolean>(false);
  protected readonly evalFilter = signal<'all' | 'passed' | 'failed'>('all');
  protected readonly evalSearchQuery = signal<string>('');
  protected readonly evalSummary = signal<EvalSummary | null>(null);
  protected readonly evalResults = signal<EvalResult[]>([]);

  // Computed Filtered Results for Eval Dashboard
  protected readonly filteredEvalResults = computed(() => {
    const results = this.evalResults();
    const filter = this.evalFilter();
    const query = this.evalSearchQuery().toLowerCase().trim();

    return results.filter((item) => {
      const matchesFilter = filter === 'all' ? true : item.status === filter;

      const matchesSearch =
        !query ||
        item.test_case.scenario.toLowerCase().includes(query) ||
        item.output.toLowerCase().includes(query) ||
        item.reasoning.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  });

  /**
   * Helper to check if score is >= threshold
   */
  protected isHighScore(score: string): boolean {
    return parseFloat(score || '0') >= 9.5;
  }

  /**
   * Helper to get score badge label
   */
  protected getScoreBadge(score: string): string {
    const num = parseFloat(score || '0');
    return num >= 9 ? '🏆 Production Grade' : '🟡 Needs Optimization';
  }

  /**
   * Change Benchmark Preset and load its default editable prompt template
   */
  setPreset(preset: 'support' | 'meeting'): void {
    this.selectedPreset.set(preset);
    this.customPromptTemplate.set(DEFAULT_PROMPTS[preset]);
  }

  /**
   * Helper: Insert XML tag snippet into current prompt template
   */
  insertSnippet(type: 'xml' | 'fewshot' | 'cot'): void {
    const current = this.customPromptTemplate();
    if (type === 'xml') {
      this.customPromptTemplate.set(
        `${current}\n\n<instructions>\n- Output only the final structured analysis.\n</instructions>`,
      );
    } else if (type === 'fewshot') {
      this.customPromptTemplate.set(
        `${current}\n\nHere is an ideal example response:\n<sample_input>Order #123 is broken</sample_input>\n<ideal_output>Sentiment: Negative\nRefund Requested: Yes\nOrder ID: #123</ideal_output>`,
      );
    } else if (type === 'cot') {
      this.customPromptTemplate.set(
        `${current}\n\nThink step-by-step:\n1. First read the entire text.\n2. Extract key entities.\n3. Format the final output.`,
      );
    }
  }

  /**
   * Apply Golden 10/10 Prompt to Editor
   */
  applyGoldenPrompt(): void {
    this.customPromptTemplate.set(DEFAULT_PROMPTS[this.selectedPreset()]);
  }

  /**
   * 📡 Send Message with Live SSE Streaming
   */
  async sendMessage(): Promise<void> {
    const userText = this.prompt().trim();
    if (!userText || this.isStreaming()) return;

    this.messages.update((msgs) => [...msgs, { role: 'user', text: userText }]);
    this.prompt.set('');
    this.isStreaming.set(true);
    this.currentStreamingText.set('');

    try {
      const response = await fetch('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: this.messages().slice(0, -1),
        }),
      });

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                this.currentStreamingText.set(accumulatedText);
              }
            } catch {
              // Ignore partial or non-JSON SSE chunks during streaming
            }
          }
        }
      }

      if (accumulatedText) {
        this.messages.update((msgs) => [...msgs, { role: 'assistant', text: accumulatedText }]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      this.messages.update((msgs) => [
        ...msgs,
        {
          role: 'assistant',
          text: `⚠️ Error: Could not connect to Gemini backend (${errorMessage}).`,
        },
      ]);
    } finally {
      this.isStreaming.set(false);
      this.currentStreamingText.set('');
    }
  }

  /**
   * 🛠️ Test Function Calling / Tools
   */
  async executeToolCall(): Promise<void> {
    const text = this.toolPrompt().trim();
    if (!text || this.isToolRunning()) return;

    this.isToolRunning.set(true);
    this.toolExecutions.set([]);
    this.toolFinalAnswer.set('');

    try {
      const response = await fetch('http://localhost:3000/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      const data = (await response.json()) as {
        calls?: ToolExecution[];
        answer?: string;
        error?: string;
      };
      if (data.calls) this.toolExecutions.set(data.calls);
      if (data.answer) this.toolFinalAnswer.set(data.answer);
      if (data.error) this.toolFinalAnswer.set(`⚠️ Error: ${data.error}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      this.toolFinalAnswer.set(`⚠️ Error: ${msg}`);
    } finally {
      this.isToolRunning.set(false);
    }
  }

  /**
   * 📊 Run Evaluation Benchmark with User's Custom Prompt Template
   */
  async runEvaluation(): Promise<void> {
    if (this.isEvalRunning()) return;

    this.isEvalRunning.set(true);
    this.evalSummary.set(null);
    this.evalResults.set([]);

    try {
      const response = await fetch('http://localhost:3000/api/evals/run-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: this.selectedPreset(),
          customPromptTemplate: this.customPromptTemplate(),
        }),
      });

      const data = (await response.json()) as {
        summary?: EvalSummary;
        results?: EvalResult[];
        error?: string;
      };
      if (data.summary && data.results) {
        this.evalSummary.set(data.summary);
        this.evalResults.set(data.results);
      }
    } catch (err: unknown) {
      console.error('Eval error:', err);
    } finally {
      this.isEvalRunning.set(false);
    }
  }

  /**
   * Format basic Markdown to clean HTML
   */
  protected formatMarkdown(raw: string): SafeHtml {
    if (!raw) return '';

    let formatted = raw
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers (### Header)
      .replace(/^###\s+(.*$)/gim, '<div class="font-title-sm font-bold text-primary mt-3 mb-1">$1</div>')
      .replace(/^##\s+(.*$)/gim, '<div class="font-title-md font-bold text-primary mt-3 mb-1 pb-1 border-b border-outline-variant/40">$1</div>')
      // Bold (**text**)
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-primary">$1</strong>')
      // Bullets (* item or - item or • item)
      .replace(/^[•*-]\s+(.*$)/gim, '<div class="flex items-start gap-2 my-1 text-xs leading-relaxed"><span class="text-primary font-bold">•</span><span class="text-on-surface">$1</span></div>')
      // Line breaks
      .replace(/\n/gim, '<br/>');

    // Clean up excessive <br/> after header and bullet divs
    formatted = formatted
      .replace(/<\/div><br\/>/gim, '</div>')
      .replace(/<br\/><div/gim, '<div');

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  /**
   * Format input values as key-value pairs
   */
  getInputEntries(inputs: Record<string, unknown>): InputEntry[] {
    return Object.entries(inputs || {}).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
  }
}
