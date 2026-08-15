const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function loadCert(id) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
}

function saveCert(id, data) {
  fs.writeFileSync(path.join(dataDir, `${id}.json`), JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${id}.json: ${data.questions.length} questions, ${data.cards.length} cards`);
}

// -------------------------------------------------------------
// CCDV-F (Developer): 30 Questions + 12 Cards
// -------------------------------------------------------------
const ccdvNewCards = [
  { id: "ccdvc-thinking-budget", f: "What is the requirement for budget_tokens in Extended Thinking?", b: "budget_tokens must be >= 1024 tokens, and max_tokens must be strictly greater than budget_tokens." },
  { id: "ccdvc-thinking-sig", f: "How must thinking blocks be handled in multi-turn conversation history?", b: "They contain an encrypted signature and must be passed back unaltered in assistant turns." },
  { id: "ccdvc-comp-use-beta", f: "What beta header is required for Anthropic Computer Use tools?", b: "anthropic-beta: computer-use-2024-10-22" },
  { id: "ccdvc-comp-use-tools", f: "What are the 3 built-in Computer Use tools?", b: "computer_20241022 (screen/mouse/keyboard), bash_20241022 (shell), text_editor_20241022 (file editing)." },
  { id: "ccdvc-pdf-document", f: "How are native PDF files passed to the Messages API?", b: "As a document content block: {type: 'document', source: {type: 'base64', media_type: 'application/pdf', data: '...'}}." },
  { id: "ccdvc-mcp-transports", f: "What are the two standard MCP transport layers?", b: "1. stdio (standard input/output for local child processes)\n2. SSE (Server-Sent Events over HTTP for remote servers)." },
  { id: "ccdvc-mcp-roots", f: "What is the purpose of roots/list in MCP?", b: "Allows the client to inform the server about workspace root directories it is authorized to access." },
  { id: "ccdvc-mcp-sampling", f: "What is MCP Client Sampling (sampling/createMessage)?", b: "Allows an MCP server to request an LLM completion from the host client with user consent." },
  { id: "ccdvc-cache-invalidation", f: "What causes a Prompt Cache invalidation?", b: "Any modification to tokens preceding the cache breakpoint invalidates the cache for that and all downstream blocks." },
  { id: "ccdvc-batch-size-limit", f: "What is the maximum number of requests allowed in a single Batches API file?", b: "10,000 requests per batch file with a 24-hour processing window." },
  { id: "ccdvc-ratelimit-reset", f: "Which response header specifies the exact timestamp when token rate limits reset?", b: "anthropic-ratelimit-tokens-reset (formatted as an ISO 8601 UTC timestamp)." },
  { id: "ccdvc-stop-pause-turn", f: "What does stop_reason: 'pause_turn' indicate?", b: "A server-side long-running execution paused and requires the client to resend state to continue." }
];

const ccdvNewQuestions = [
  {
    id: "ccdvq-71", d: 4,
    q: "A developer configures an API request with `thinking: {type: 'enabled', budget_tokens: 4096}` and `max_tokens: 4096`. What happens?",
    opts: [
      "The API rejects the request with HTTP 400 because max_tokens must be strictly greater than budget_tokens",
      "The API automatically allocates 8192 tokens",
      "The request executes normally with 0 tokens left for output",
      "Thinking mode is automatically disabled"
    ],
    a: 0,
    why: [
      "Correct. Anthropic API requires max_tokens > budget_tokens; the remaining difference is the token budget for the final text response.",
      "The API does not silently alter parameter values.",
      "Equal values are rejected before execution.",
      "Thinking mode will not silently disable itself upon configuration error."
    ]
  },
  {
    id: "ccdvq-72", d: 4,
    q: "In a multi-turn conversation with Extended Thinking enabled, how should the application format the assistant's previous turn in the `messages` array?",
    opts: [
      "Include both the `thinking` block (with its signature) and the `text` content block unaltered",
      "Delete the `thinking` block and keep only the `text` block to save tokens",
      "Convert the `thinking` block into a `user` role message",
      "Re-encrypt the signature using a local private key"
    ],
    a: 0,
    why: [
      "Correct. The thinking block carries a cryptographic signature from Anthropic and must be passed back intact to preserve reasoning continuity.",
      "Stripping thinking blocks breaks conversation reasoning continuity on subsequent turns.",
      "Thinking blocks belong exclusively in assistant turns.",
      "Signatures are verified by Anthropic's servers and cannot be re-signed locally."
    ]
  },
  {
    id: "ccdvq-73", d: 2,
    q: "When implementing Computer Use with `computer_20241022`, what is the best practice for screenshot resolution handling?",
    opts: [
      "Scale screenshots to standard resolutions (e.g., 1024×768 or 1280×800) to optimize token cost and latency",
      "Send raw 4K uncompressed BMP images",
      "Crop screenshots to 10×10 pixel squares",
      "Convert screenshots into ASCII text before sending"
    ],
    a: 0,
    why: [
      "Correct. Scaling to standard aspect ratios (like 1024×768 XGA) dramatically reduces token consumption while retaining sharp UI element readability.",
      "4K screenshots consume excessive vision tokens and spike API latency without improving coordinate accuracy.",
      "10×10 crops destroy visual context needed for desktop navigation.",
      "ASCII conversion destroys graphical UI layout information."
    ]
  },
  {
    id: "ccdvq-74", d: 3,
    q: "Which JSON-RPC 2.0 message method is sent by an MCP client to discover available server-side read-only data assets?",
    opts: [
      "resources/list",
      "tools/list",
      "prompts/list",
      "roots/list"
    ],
    a: 0,
    why: [
      "Correct. `resources/list` queries the server for its catalog of read-only resources (files, schemas, logs).",
      "`tools/list` returns callable functions that perform actions.",
      "`prompts/list` returns reusable prompt templates.",
      "`roots/list` is sent by the server to query client workspace roots."
    ]
  },
  {
    id: "ccdvq-75", d: 3,
    q: "What is the role of `isError: true` in an MCP `tools/call` response payload?",
    opts: [
      "It informs the model that the tool execution failed (e.g. file not found), allowing the model to handle the error gracefully",
      "It terminates the MCP connection immediately",
      "It triggers an HTTP 500 internal server error on the host",
      "It deletes the tool from the server"
    ],
    a: 0,
    why: [
      "Correct. `isError: true` signals tool-level execution failure within the protocol, prompting the model to explain the error or retry with different parameters.",
      "Protocol connections remain active after tool errors.",
      "It does not crash the host HTTP server.",
      "Tool definitions remain registered and available."
    ]
  },
  {
    id: "ccdvq-76", d: 0,
    q: "A developer is sending a native PDF document to the Messages API. Which content block structure is valid?",
    opts: [
      "`{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } }`",
      "`{ type: 'file', path: 'C:/docs/report.pdf' }`",
      "`{ type: 'pdf_raw', binary: buffer }`",
      "`{ type: 'text', text: '<pdf>' + rawBytes + '</pdf>' }`"
    ],
    a: 0,
    why: [
      "Correct. Native PDFs must be structured as a `document` content block with `type: 'base64'` and `media_type: 'application/pdf'`.",
      "Local filesystem paths cannot be directly read across HTTP API boundaries.",
      "`pdf_raw` is not a valid API content block type.",
      "Raw binary bytes cannot be embedded directly in UTF-8 text blocks."
    ]
  },
  {
    id: "ccdvq-77", d: 1,
    q: "How many cache breakpoints (`cache_control: {type: 'ephemeral'}`) can be defined in a single Anthropic Messages API request?",
    opts: [
      "Up to 4 cache breakpoints",
      "Exactly 1 cache breakpoint",
      "Unlimited cache breakpoints",
      "Up to 100 cache breakpoints"
    ],
    a: 0,
    why: [
      "Correct. Anthropic allows setting up to 4 explicit cache breakpoints per request (e.g. system prompt, tool definitions, reference document, and conversation turn).",
      "The limit is 4, not 1.",
      "Breakpoints are strictly capped at 4 per request.",
      "100 exceeds the architectural limit."
    ]
  },
  {
    id: "ccdvq-78", d: 1,
    q: "What is the cache minimum token requirement when using Prompt Caching on Claude 3.5 Haiku?",
    opts: [
      "2,048 tokens",
      "1,024 tokens",
      "512 tokens",
      "100 tokens"
    ],
    a: 0,
    why: [
      "Correct. Claude 3.5 Haiku requires at least 2,048 tokens for a cache block to be created (compared to 1,024 tokens for Sonnet/Opus).",
      "1,024 tokens is the minimum for Sonnet and Opus, not Haiku.",
      "512 tokens is below the minimum threshold for all models.",
      "100 tokens will be processed without caching."
    ]
  },
  {
    id: "ccdvq-79", d: 2,
    q: "When defining a custom tool in `tools: [...]`, what happens if the developer sets `tool_choice: {type: 'any'}`?",
    opts: [
      "The model is forced to call at least one of the provided tools rather than generating plain text",
      "The model selects any random model tier",
      "The model chooses whether to execute bash or python",
      "The API throws an invalid parameter exception"
    ],
    a: 0,
    why: [
      "Correct. `tool_choice: {type: 'any'}` guarantees the model will respond with a `tool_use` block from the available tool list.",
      "Model tiers are specified via the `model` request key.",
      "Programming languages are governed by tool definitions, not tool_choice.",
      "`any` is a valid, documented `tool_choice` parameter value."
    ]
  },
  {
    id: "ccdvq-80", d: 2,
    q: "How should an application handle `stop_reason: 'tool_use'`?",
    opts: [
      "Execute the requested tool locally and append a `tool_result` content block to the messages history before calling the API again",
      "Throw a runtime exception because the model encountered an error",
      "Immediately display the tool arguments directly to the end user as the final answer",
      "Retry the identical prompt with temperature=0"
    ],
    a: 0,
    why: [
      "Correct. `tool_use` is standard control flow indicating the model requires external tool execution; the application must execute the tool and provide the result.",
      "It is normal tool execution flow, not an application error.",
      "Raw tool call arguments are internal execution requests, not user-facing replies.",
      "Retrying without returning the tool result causes infinite tool loops."
    ]
  },
  {
    id: "ccdvq-81", d: 6,
    q: "When an API request receives HTTP 429 Rate Limit, which response header should be parsed to determine the exact sleep duration?",
    opts: [
      "`anthropic-ratelimit-tokens-reset` or `retry-after`",
      "`x-server-uptime`",
      "`content-length`",
      "`set-cookie`"
    ],
    a: 0,
    why: [
      "Correct. `anthropic-ratelimit-tokens-reset` and `retry-after` convey the precise reset window for rate limit replenishment.",
      "Server uptime does not indicate rate limit reset schedules.",
      "Content-length indicates payload byte size.",
      "Cookies do not manage rate limit windows."
    ]
  },
  {
    id: "ccdvq-82", d: 6,
    q: "Why is 'Full Jitter' combined with Exponential Backoff when retrying failed API requests?",
    opts: [
      "It randomizes retry intervals to prevent synchronized thundering herd spikes on the API gateway",
      "It encrypts the payload with random bytes",
      "It increases the token generation speed on subsequent retries",
      "It forces the request to switch to a different cloud region"
    ],
    a: 0,
    why: [
      "Correct. Jitter breaks synchronization across distributed clients, smoothing load spikes during recovery.",
      "Jitter alters timing delays, not payload encryption.",
      "Jitter has no impact on model inference speed.",
      "Region switching is handled by DNS / routing, not client jitter."
    ]
  },
  {
    id: "ccdvq-83", d: 0,
    q: "In the Messages API, where must the `system` prompt be placed?",
    opts: [
      "In the top-level `system` parameter of the request object",
      "As a message with `role: 'system'` inside the `messages` array",
      "Appended to the end of the user prompt inside `<system>` tags",
      "In the HTTP request headers"
    ],
    a: 0,
    why: [
      "Correct. Anthropic's Messages API specifies system prompts in the top-level `system` parameter, keeping the `messages` array strictly for `user` and `assistant` turns.",
      "Passing `role: 'system'` inside `messages` returns an HTTP 400 validation error.",
      "Embedding in user text is weaker than dedicated top-level parameterization.",
      "System prompts belong in the JSON request body, not HTTP headers."
    ]
  },
  {
    id: "ccdvq-84", d: 5,
    q: "When implementing semantic search over a 50,000-page document store, what is the standard role of embeddings vs Claude?",
    opts: [
      "Vector embeddings retrieve top-K relevant chunks; Claude synthesizes and reasons over the retrieved context",
      "Embeddings generate the final user answer; Claude only counts tokens",
      "Embeddings are used only for image classification",
      "Claude converts the entire 50,000-page database into a single binary file"
    ],
    a: 0,
    why: [
      "Correct. Two-stage RAG uses fast vector embeddings for retrieval and Claude for high-reasoning synthesis over retrieved context.",
      "Embeddings produce numerical vectors, not natural language answers.",
      "Embeddings are widely used for text semantic retrieval.",
      "Loading 50,000 pages at once exceeds standard context windows and is cost-inefficient."
    ]
  },
  {
    id: "ccdvq-85", d: 3,
    q: "In MCP, what is the difference between a Tool and a Resource?",
    opts: [
      "Tools perform active side-effect operations (e.g. write file, run SQL); Resources are passive, read-only data references (e.g. URI content)",
      "Tools are always free; Resources cost $1 per read",
      "Tools only run in Python; Resources only run in C++",
      "There is no difference; they are interchangeable aliases"
    ],
    a: 0,
    why: [
      "Correct. Tools represent executable actions with potential side-effects, while Resources provide read-only context attachments.",
      "MCP protocol pricing is independent of tool/resource designations.",
      "MCP is language-agnostic across JSON-RPC.",
      "Tools and Resources have distinct protocol methods (`tools/call` vs `resources/read`)."
    ]
  },
  {
    id: "ccdvq-86", d: 1,
    q: "What is the effect of setting `temperature: 0.0` on Claude 3.5 Sonnet?",
    opts: [
      "The model uses greedy decoding for maximum determinism and consistency across runs",
      "The model refuses all requests",
      "The model generates completely random words",
      "The model switches to Claude 3.5 Haiku"
    ],
    a: 0,
    why: [
      "Correct. Temperature 0.0 selects the highest-probability token at each step (greedy decoding), optimizing reproducibility.",
      "Temperature 0.0 is a standard, valid setting.",
      "Random sampling occurs at high temperature, not zero.",
      "Temperature settings do not switch model architectures."
    ]
  },
  {
    id: "ccdvq-87", d: 2,
    q: "A developer wants to guarantee that Claude returns JSON adhering strictly to a JSON Schema for tool calls. Which property should be configured?",
    opts: [
      "Define `input_schema` with required properties and standard JSON schema types in the tool definition",
      "Add 'Please try your best' in the description",
      "Set `temperature: 1.0`",
      "Send the prompt through a Base64 filter"
    ],
    a: 0,
    why: [
      "Correct. Defining standard JSON Schema in `input_schema` ensures the tool engine enforces field names, data types, and required properties.",
      "Vague descriptions do not enforce schema adherence.",
      "Temperature 1.0 increases variance, making schema violations more likely.",
      "Base64 filtering does not structure JSON schemas."
    ]
  },
  {
    id: "ccdvq-88", d: 4,
    q: "Why is Extended Thinking particularly valuable for complex competitive programming and mathematical proofs?",
    opts: [
      "It allows Claude to verify logic, test edge cases, and backtrack before writing code tokens",
      "It automatically compiles the code on an external GPU",
      "It translates Python into Assembly language",
      "It disables all safety filters"
    ],
    a: 0,
    why: [
      "Correct. Extended Thinking provides dedicated reasoning tokens for exploratory search, hypothesis verification, and error correction.",
      "Thinking mode is internal autoregressive reasoning, not external compilation.",
      "It does not perform Assembly translation unless requested.",
      "Safety filters remain fully active during thinking generation."
    ]
  },
  {
    id: "ccdvq-89", d: 6,
    q: "When streaming responses using `client.messages.stream(...)`, what is the primary benefit to end-user experience?",
    opts: [
      "Significantly reduced perceived latency (Time-to-First-Token) as tokens appear in real time",
      "50% discount on total token pricing",
      "Automatic recovery from network disconnections without client code",
      "Higher maximum output token limit"
    ],
    a: 0,
    why: [
      "Correct. Streaming sends SSE chunks incrementally, giving users immediate visual feedback as words generate.",
      "Streaming tokens are billed at the exact same rate as non-streaming calls.",
      "Client code must handle connection retries for broken streams.",
      "Output limits are identical for streaming and buffered calls."
    ]
  },
  {
    id: "ccdvq-90", d: 0,
    q: "What is the Batches API turnaround SLA for processing batch workloads?",
    opts: [
      "Results are returned within 24 hours with a 50% discount on input and output tokens",
      "Results are returned in exactly 5 seconds",
      "Results take 30 days to process",
      "Results are only processed on weekends"
    ],
    a: 0,
    why: [
      "Correct. Anthropic's Batches API processes async requests within 24 hours at a 50% discount across all token classes.",
      "Batches are asynchronous bulk queues, not real-time 5-second calls.",
      "The SLA is 24 hours, not 30 days.",
      "Batch queues process continuously 24/7."
    ]
  },
  {
    id: "ccdvq-91", d: 3,
    q: "In an MCP server implementation, what method is called when the client requests to execute a parameterized prompt template?",
    opts: [
      "prompts/get",
      "prompts/list",
      "tools/call",
      "resources/subscribe"
    ],
    a: 0,
    why: [
      "Correct. `prompts/get` retrieves the rendered messages and arguments for a specific prompt template.",
      "`prompts/list` lists available prompt names and parameter schemas.",
      "`tools/call` executes function actions.",
      "`resources/subscribe` monitors resource URI changes."
    ]
  },
  {
    id: "ccdvq-92", d: 2,
    q: "When returning a `tool_result` to Claude, how must the message role and structure be formatted?",
    opts: [
      "`role: 'user'` with content array containing `{ type: 'tool_result', tool_use_id: '...', content: '...' }`",
      "`role: 'tool'` with plain text string",
      "`role: 'system'` with JSON object",
      "`role: 'assistant'` with error code"
    ],
    a: 0,
    why: [
      "Correct. In the Anthropic API, tool results are returned in a `user` turn containing a `tool_result` block matching the corresponding `tool_use_id`.",
      "Anthropic Messages API does not use `role: 'tool'`.",
      "System turns cannot contain tool results.",
      "Assistant turns represent model outputs, not application tool responses."
    ]
  },
  {
    id: "ccdvq-93", d: 4,
    q: "If an application sets `budget_tokens: 1000` on an Extended Thinking request, what error will be returned?",
    opts: [
      "HTTP 400 Bad Request because budget_tokens must be at least 1,024 tokens",
      "HTTP 429 Rate Limit Exceeded",
      "HTTP 500 Internal Server Error",
      "No error; 1000 tokens is valid"
    ],
    a: 0,
    why: [
      "Correct. The minimum allowed `budget_tokens` for Extended Thinking is 1,024 tokens.",
      "It is a parameter validation error (400), not a rate limit (429).",
      "It is client-side configuration validation, not a server crash (500).",
      "1,000 is below the 1,024 token minimum."
    ]
  },
  {
    id: "ccdvq-94", d: 1,
    q: "Why does modifying a variable at the very start of a prompt invalidate all downstream prompt cache blocks?",
    opts: [
      "Prompt Caching is an exact prefix-matching tree; any early token delta invalidates all subsequent cache keys",
      "The server restarts whenever a prompt changes",
      "Prompt cache blocks only last for 1 millisecond",
      "Cache blocks are tied to the client IP address"
    ],
    a: 0,
    why: [
      "Correct. Prompt caching matches exact token prefix hashes from the start of the prompt; changing token 1 invalidates the hash for all downstream tokens.",
      "Cache invalidation is a deterministic hash lookup, not a server restart.",
      "The cache TTL is 5 minutes, refreshed on hit.",
      "Caches are content-hash addressed, not IP bound."
    ]
  },
  {
    id: "ccdvq-95", d: 5,
    q: "When chunking code files for RAG, why is AST (Abstract Syntax Tree) chunking superior to fixed-character chunking?",
    opts: [
      "It splits code cleanly along function and class boundaries, preserving complete syntactic and semantic units",
      "It encrypts the code to prevent plagiarism",
      "It reduces code size by 90%",
      "It converts JavaScript into Rust"
    ],
    a: 0,
    why: [
      "Correct. AST chunking respects programming language syntax, preventing functions from being sliced in half across chunk boundaries.",
      "AST chunking is for code structural splitting, not encryption.",
      "Chunking organizes text; it does not compress source code.",
      "It preserves source code structure without language translation."
    ]
  },
  {
    id: "ccdvq-96", d: 0,
    q: "What is the maximum context window size for Claude 3.5 Sonnet?",
    opts: [
      "200,000 tokens",
      "4,096 tokens",
      "8,192 tokens",
      "1,000,000 tokens"
    ],
    a: 0,
    why: [
      "Correct. Claude 3.5 Sonnet supports a 200,000-token context window (approx. 150,000 words or 500+ pages of text).",
      "4,096 tokens is the default max output token limit on earlier tiers.",
      "8,192 tokens is the extended output token cap for Claude 3.5 Sonnet.",
      "1,000,000 tokens exceeds the standard 200k context window."
    ]
  },
  {
    id: "ccdvq-97", d: 2,
    q: "In an agentic loop, what condition must terminate the autonomous tool-calling cycle?",
    opts: [
      "The model returns `stop_reason: 'end_turn'` (or hits a maximum iteration safety ceiling)",
      "The user closes their browser tab",
      "The computer battery reaches 50%",
      "The hard drive runs a defragmentation check"
    ],
    a: 0,
    why: [
      "Correct. Loops must terminate when the model finishes naturally (`end_turn`) or when hitting an explicit loop iteration safeguard to prevent runaway spend.",
      "Server loops continue running unless tied to client disconnect signals.",
      "Hardware battery state is irrelevant to API loop control flow.",
      "OS maintenance tasks do not govern agent control flow."
    ]
  },
  {
    id: "ccdvq-98", d: 3,
    q: "What transport protocol should be selected when building an MCP server intended to run as a local CLI sub-process?",
    opts: [
      "Standard Input/Output (stdio)",
      "Server-Sent Events (SSE) over HTTPS",
      "Bluetooth Low Energy",
      "FTP"
    ],
    a: 0,
    why: [
      "Correct. `stdio` is the standard, high-performance transport for local child processes managed by desktop clients (e.g. Claude Desktop / Antigravity).",
      "SSE over HTTPS is for remote, network-hosted MCP servers.",
      "Bluetooth is not an MCP transport protocol.",
      "FTP is a legacy file transfer protocol, not a JSON-RPC transport."
    ]
  },
  {
    id: "ccdvq-99", d: 6,
    q: "What is the recommended client behavior when an API call fails with HTTP 529 (Overloaded)?",
    opts: [
      "Apply exponential backoff with jitter and retry up to 3-5 times before falling back",
      "Immediately crash the application and alert the CEO",
      "Spam 50 simultaneous retry requests",
      "Delete the API key and create a new account"
    ],
    a: 0,
    why: [
      "Correct. HTTP 529 indicates temporary capacity saturation; backoff with jitter gives the cluster time to recover while gracefully managing retries.",
      "Crashing the application creates poor resilience.",
      "Spamming retries exacerbates server congestion.",
      "API keys have no relation to cluster load capacity."
    ]
  },
  {
    id: "ccdvq-100", d: 1,
    q: "When structuring complex inputs with multiple files in a prompt, which formatting standard provides optimal clarity for Claude?",
    opts: [
      "Wrap each file in `<file name='filepath'>content</file>` XML tags with clear document index headers",
      "Paste all files together as one continuous paragraph with no spaces",
      "Convert all files into emoji icons",
      "Upload only the file size in bytes"
    ],
    a: 0,
    why: [
      "Correct. Using XML tags with attribute metadata (`<file name='...'>`) provides clear structural separation for multi-file prompt contexts.",
      "Unstructured continuous text creates token bleeding and destroys file boundaries.",
      "Emojis destroy code and text semantics.",
      "File byte sizes contain zero document content."
    ]
  }
];

const ccdvData = loadCert('ccdv');
ccdvData.cards.push(...ccdvNewCards);
ccdvData.questions.push(...ccdvNewQuestions);
saveCert('ccdv', ccdvData);

console.log('Successfully expanded CCDV-F to 100 questions and 25 cards');
