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
// 1. CCAO-F (Associate) Additions: 30 Questions + 13 Cards
// -------------------------------------------------------------
const ccaoNewCards = [
  { id: "ccaoc-vision-calc", f: "What is the token cost formula for images and PDF pages processed by Claude?", b: "Tokens = (Width × Height) / 750 (with dimensions scaled down if exceeding 1568px)." },
  { id: "ccaoc-asl-levels", f: "What are Anthropic AI Safety Levels (ASL-1 to ASL-4)?", b: "A risk framework where ASL-2 represents frontier models requiring automated classifiers, and ASL-3/4 require physical air-gapping and extreme containment." },
  { id: "ccaoc-temp-zero", f: "When should Temperature be set to 0.0?", b: "For factual data extraction, mathematical reasoning, code generation, and tasks requiring deterministic consistency." },
  { id: "ccaoc-zdr-policy", f: "What is an Enterprise Zero-Data-Retention (ZDR) agreement?", b: "A contractual guarantee that customer prompts and completions are never stored on disk beyond transit and never used for model training." },
  { id: "ccaoc-xml-delimiters", f: "Why are XML tags preferred over markdown headers for prompt sectioning?", b: "XML tags (&lt;context&gt;, &lt;instructions&gt;) unambiguously separate developer instructions from variable user/untrusted data." },
  { id: "ccaoc-few-shot", f: "What is the primary benefit of few-shot prompting?", b: "It teaches the target output structure, formatting edge cases, and stylistic nuances through concrete examples rather than abstract rules." },
  { id: "ccaoc-chain-of-thought", f: "How does Chain of Thought (CoT) prompting reduce reasoning errors?", b: "By allocating generation tokens for intermediate calculation steps before outputting the final answer, preventing premature conclusion errors." },
  { id: "ccaoc-hallucination-audit", f: "What is the only valid way to verify LLM factual claims for external publication?", b: "Independent human or ground-truth verification against primary source records." },
  { id: "ccaoc-escalation-criteria", f: "What is the valid criterion for escalating from Haiku to Sonnet or Opus?", b: "Documented reasoning or comprehension failures on task eval datasets, not prompt length or user seniority." },
  { id: "ccaoc-project-instructions", f: "Where should persistent project-wide conventions and schemas be placed in Claude Projects?", b: "In the Project Custom Instructions, keeping chat prompts focused on the immediate task." },
  { id: "ccaoc-refusal-remediation", f: "What is the appropriate response when Claude refuses a query on safety grounds?", b: "Analyze the prompt to remove policy-sensitive keywords or reframe the business goal legitimately; do not spam slight variations." },
  { id: "ccaoc-structured-json", f: "What is the best way to ensure Claude outputs valid, parseable JSON?", b: "Specify a JSON schema in prompt instructions or use structured output configuration, paired with a few-shot JSON example." },
  { id: "ccaoc-token-approx", f: "What is the rough rule of thumb for English word-to-token conversion?", b: "100 English words is approximately 130 tokens (or ~0.75 words per token)." }
];

const ccaoNewQuestions = [
  {
    id: "ccaoq-71", d: 0,
    q: "A team needs to extract data from 100,000 scanned single-page invoices per month. Budget is constrained. Which model tier and strategy is optimal?",
    opts: [
      "Process all invoices with Claude 3.5 Haiku using structured JSON extraction prompts",
      "Process all invoices with Claude 3.5 Opus with high temperature for maximum precision",
      "Manually re-type all invoices to avoid AI token billing",
      "Use Claude 3.5 Sonnet without any system prompt to minimize input tokens"
    ],
    a: 0,
    why: [
      "Correct. Haiku offers the lowest token cost and highest throughput, perfectly suited for high-volume structured document extraction.",
      "Opus is significantly more expensive and high temperature increases variability, which is counterproductive for structured extraction.",
      "Manual data entry is far slower and more costly than automated Haiku extraction.",
      "Omitting system instructions leads to inconsistent output formatting and higher failure rates."
    ]
  },
  {
    id: "ccaoq-72", d: 0,
    q: "An image with resolution 1500 × 1000 pixels is submitted to Claude for diagram analysis. Approximately how many tokens will this image consume?",
    opts: [
      "Approximately 2,000 tokens based on (1500 × 1000) / 750",
      "Exactly 50 tokens because all images have a flat fee",
      "Approximately 15,000 tokens (10 tokens per pixel row)",
      "0 tokens because images are processed out-of-band"
    ],
    a: 0,
    why: [
      "Correct. Anthropic calculates vision token usage via (Width × Height) / 750, yielding (1,500,000 / 750) = 2,000 tokens.",
      "Vision tokenization is area-dependent, not a flat 50 tokens.",
      "15,000 tokens significantly overestimates the standard 1/750 area formula.",
      "Images consume standard context window tokens billed under input tokens."
    ]
  },
  {
    id: "ccaoq-73", d: 1,
    q: "When prompting Claude to summarize medical research papers, which prompt structure best separates the source text from the task directives?",
    opts: [
      "Place instructions inside <instructions> and research text inside <document> tags",
      "Put the research paper in ALL CAPS at the beginning of the prompt",
      "Mix instructions throughout the document text in parentheses",
      "Append 'Please do this accurately' at the very end with no tags"
    ],
    a: 0,
    why: [
      "Correct. XML tags like <instructions> and <document> provide unambiguous boundaries that prevent instruction-data confusion.",
      "Capitalization does not establish structural boundaries and degrades readability.",
      "Interleaving instructions inside data causes parsing confusion and missed requirements.",
      "Generic polite phrasing without structural boundaries leaves section boundaries ambiguous."
    ]
  },
  {
    id: "ccaoq-74", d: 1,
    q: "What is the primary risk of using 'Role Prompting' (e.g., 'You are a Nobel-prize winning physicist') without providing reference materials?",
    opts: [
      "It styles tone and vocabulary but does not provide access to proprietary or ungrounded facts",
      "It triggers an automatic API rate limit penalty",
      "It causes the API to reject the request with HTTP 400",
      "It forces the model into an infinite reasoning loop"
    ],
    a: 0,
    why: [
      "Correct. Role prompting establishes perspective, tone, and formatting conventions, but cannot substitute for grounding data.",
      "Role prompting has no effect on rate limits.",
      "Role prompting is valid prompt syntax and does not return HTTP 400.",
      "Role prompting does not cause infinite generation loops."
    ]
  },
  {
    id: "ccaoq-75", d: 2,
    q: "An organization is deploying an internal customer support assistant that handles customer account inquiries. Which evaluation step is most critical prior to release?",
    opts: [
      "Testing against a representative benchmark of edge cases and adversarial prompt injections",
      "Running the prompt once and verifying it looks polite",
      "Ensuring the model temperature is set to 1.0",
      "Checking that the prompt is fewer than 50 words"
    ],
    a: 0,
    why: [
      "Correct. Rigorous evaluation against real-world edge cases and adversarial injection tests ensures system robustness before production deployment.",
      "A single sample run provides zero statistical confidence on edge-case behavior.",
      "Temperature 1.0 increases variance, making customer support answers less predictable.",
      "Arbitrary word length caps do not measure safety or functional accuracy."
    ]
  },
  {
    id: "ccaoq-76", d: 2,
    q: "What is the role of a 'Golden Dataset' in prompt engineering evaluation?",
    opts: [
      "A curated set of representative input prompts paired with human-validated ideal outputs",
      "A dataset containing only high-value financial transactions",
      "A collection of prompts that always cost more than $1 to run",
      "A marketing demo dataset that never fails"
    ],
    a: 0,
    why: [
      "Correct. A golden dataset serves as a fixed, reproducible regression suite to evaluate prompt revisions objectively.",
      "Golden datasets are for quality evaluation, not financial transaction filtering.",
      "Dataset cost has no bearing on golden evaluation sets.",
      "Evaluation suites must include hard edge cases, not just cherry-picked marketing examples."
    ]
  },
  {
    id: "ccaoq-77", d: 3,
    q: "Under Anthropic's Responsible Scaling Policy (RSP), what distinguishes ASL-2 from ASL-3?",
    opts: [
      "ASL-3 requires strict physical security, air-gapping, and containment due to catastrophic CBRN/cyber risk thresholds",
      "ASL-2 models are completely unregulated open-source weights",
      "ASL-3 only applies to models deployed on mobile phones",
      "ASL-2 models cannot be accessed via API"
    ],
    a: 0,
    why: [
      "Correct. ASL-3 triggers severe containment, secure hardware enclaves, and multi-party sign-offs when models demonstrate dangerous autonomous capabilities.",
      "ASL-2 covers frontier hosted models with extensive automated safety evaluations.",
      "ASL safety levels govern model capabilities, not client device form factors.",
      "ASL-2 models (like Claude 3.5) are standard API-accessible models."
    ]
  },
  {
    id: "ccaoq-78", d: 3,
    q: "An enterprise customer requires that their confidential legal briefs processed by Claude are never retained on disk by Anthropic. Which mechanism provides this guarantee?",
    opts: [
      "An Enterprise Zero-Data-Retention (ZDR) agreement",
      "Setting max_tokens=100",
      "Adding 'CONFIDENTIAL DO NOT STORE' to the prompt text",
      "Encoding the prompt in Base64 before sending"
    ],
    a: 0,
    why: [
      "Correct. An Enterprise ZDR agreement provides contractual and technical guarantees that data is processed strictly in-memory without persistent disk retention.",
      "max_tokens limits output length, not backend data retention policies.",
      "Prompt text instructions cannot alter vendor cloud infrastructure retention terms.",
      "Base64 encoding is decoded immediately upon API ingestion and does not affect storage policies."
    ]
  },
  {
    id: "ccaoq-79", d: 4,
    q: "When Claude returns a safety refusal for a request to analyze a cybersecurity firewall log containing IP attack patterns, what is the best corrective action?",
    opts: [
      "Reframe the prompt to clearly state the defensive, authorized security auditing context inside <context> tags",
      "Repeatedly retry the identical prompt with different punctuation",
      "Pretend to be an attacker to trick the model into answering",
      "Increase the temperature to 1.0 to bypass the classifier"
    ],
    a: 0,
    why: [
      "Correct. Explicitly establishing the authorized defensive context and benign purpose helps safety classifiers distinguish legitimate auditing from malicious intent.",
      "Blind retries of identical text will repeatedly hit the same safety classifier trigger.",
      "Jailbreak framing violates acceptable use policies and is actively blocked.",
      "Temperature has no effect on safety policy classification boundaries."
    ]
  },
  {
    id: "ccaoq-80", d: 4,
    q: "Why is human-in-the-loop (HITL) mandatory for high-stakes AI-generated regulatory compliance submissions?",
    opts: [
      "Because legal accountability remains solely with the submitting organization, and LLMs can hallucinate plausible errors",
      "Because AI models refuse to write words longer than 10 letters without human approval",
      "Because regulatory agencies automatically reject any document typed by an API",
      "Because API tokens expire after 24 hours unless approved by a human"
    ],
    a: 0,
    why: [
      "Correct. Organizations bear strict legal liability for regulatory filings; human expert review is required to catch subtle, authoritative-sounding hallucinations.",
      "Models have no word-length constraints based on human approval.",
      "Regulatory bodies judge document content and legal validity, not the authoring keystrokes.",
      "Token expiration has nothing to do with human review requirements."
    ]
  },
  {
    id: "ccaoq-81", d: 5,
    q: "In Claude Projects, what is the optimal use of Project Custom Instructions?",
    opts: [
      "Defining organization-wide coding standards, output formats, and domain glossaries applied to all chats in the project",
      "Storing individual temporary scratchpad notes that change every 5 minutes",
      "Entering credit card numbers for billing automation",
      "Writing a 50,000-word novel manuscript directly in the instructions box"
    ],
    a: 0,
    why: [
      "Correct. Project Custom Instructions inject persistent context and standards across all conversations within that project workspace.",
      "Rapidly changing temporary notes belong in individual chat messages, not persistent project instructions.",
      "Sensitive payment information should never be pasted into instruction boxes.",
      "Large documents should be uploaded as Project Knowledge Files, not pasted into instructions."
    ]
  },
  {
    id: "ccaoq-82", d: 5,
    q: "How do Claude Artifacts enhance user experience when generating standalone code or UI components?",
    opts: [
      "They render code, SVG, and web apps in a dedicated interactive side-by-side pane without cluttering the chat history",
      "They automatically deploy the code to AWS Lambda without user review",
      "They encrypt the chat history with blockchain verification",
      "They delete the code after 10 minutes to save disk space"
    ],
    a: 0,
    why: [
      "Correct. Artifacts provide a dedicated workspace pane for visual inspection, live rendering, and iterative editing of substantial standalone content.",
      "Artifacts do not perform autonomous cloud infrastructure deployments.",
      "Artifacts are a UI rendering feature, not blockchain encryption.",
      "Artifacts remain persisted in the project history unless deleted by the user."
    ]
  },
  {
    id: "ccaoq-83", d: 6,
    q: "When designing an automated sentiment classification prompt, why is providing 3 few-shot examples superior to a 5-paragraph textual explanation?",
    opts: [
      "Examples demonstrate edge cases, label casing, and output syntax concretely, eliminating ambiguity",
      "Few-shot examples bypass API billing charges",
      "Examples allow the model to skip reading the system prompt",
      "Examples increase model generation speed by 500%"
    ],
    a: 0,
    why: [
      "Correct. Few-shot examples anchor pattern recognition on exact output schemas and edge cases far more reliably than descriptive rules.",
      "Few-shot examples consume standard input tokens and are billed normally.",
      "The system prompt is always processed alongside examples.",
      "Examples do not change the underlying token generation speed."
    ]
  },
  {
    id: "ccaoq-84", d: 6,
    q: "A developer wants Claude to format dates strictly as YYYY-MM-DD. Which prompt instruction is most resilient against format drift?",
    opts: [
      "Specify `<format>Date must strictly match regex ^\\d{4}-\\d{2}-\\d{2}$ (e.g. 2026-08-15)</format>` with 2 worked examples",
      "Write 'Please give nice dates'",
      "Add 'Do not use slashes' once at the top of the prompt",
      "Ask the user to fix the dates manually afterwards"
    ],
    a: 0,
    why: [
      "Correct. Providing explicit schema constraints, regex patterns, and concrete worked examples eliminates formatting ambiguity.",
      "'Nice dates' is subjective and undefined.",
      "Negative constraints alone ('do not use slashes') are weaker than positive explicit format definitions.",
      "Relying on manual post-processing defeats the purpose of prompt-level formatting control."
    ]
  },
  {
    id: "ccaoq-85", d: 0,
    q: "What is the primary factor driving latency differences between Claude 3.5 Haiku and Claude 3.5 Sonnet?",
    opts: [
      "Model parameter scale and architecture depth resulting in faster per-token generation in Haiku",
      "Haiku servers being physically closer to all users",
      "Sonnet intentionally adding artificial 2-second sleep timers",
      "Haiku skipping safety and guardrail evaluations"
    ],
    a: 0,
    why: [
      "Correct. Haiku is a lighter-weight architecture optimized for ultra-low time-to-first-token (TTFT) and high tokens-per-second throughput.",
      "API traffic is routed across global data centers based on capacity, not model brand geography.",
      "Anthropic does not introduce artificial sleep timers on larger models.",
      "All Anthropic models undergo identical safety and alignment filtering."
    ]
  },
  {
    id: "ccaoq-86", d: 1,
    q: "Why should prompt instructions be placed AFTER context documents in long-context prompts ('Lost in the Middle' mitigation)?",
    opts: [
      "Placing instructions at the very end ensures the model's attention is freshest on the required task when generation begins",
      "The Anthropic API throws an error if documents are placed at the end",
      "Instructions at the end cost 50% fewer tokens",
      "Placing documents first makes the prompt cacheable"
    ],
    a: 0,
    why: [
      "Correct. Positioning the task instruction at the end of the context prevents attention fading over long reference documents.",
      "The API accepts any message content ordering, but prompt quality varies with attention curves.",
      "Token pricing is invariant to position within the request.",
      "Cacheability depends on cache_control breakpoints, not document ordering alone."
    ]
  },
  {
    id: "ccaoq-87", d: 2,
    q: "What is 'LLM-as-a-Judge' evaluation methodology?",
    opts: [
      "Using a high-capability model (e.g. Claude 3.5 Sonnet) with a strict grading rubric to evaluate outputs from another model or prompt version",
      "Replacing legal judges in real courtrooms with AI algorithms",
      "Running a prompt through an automated spell-checker",
      "Asking 10 different people to vote on Twitter"
    ],
    a: 0,
    why: [
      "Correct. LLM-as-a-judge leverages frontier models to automate scalable, rubric-based evaluation of complex generative outputs.",
      "It refers to software testing pipelines, not judicial legal systems.",
      "LLM evaluation assesses semantic reasoning, accuracy, and compliance, far beyond spell-checking.",
      "Social media polling is unstandardized and not automated evaluation."
    ]
  },
  {
    id: "ccaoq-88", d: 3,
    q: "Which of the following data types requires the highest scrutiny before passing into an external LLM prompt?",
    opts: [
      "Personally Identifiable Information (PII) such as Social Security Numbers and patient health records",
      "Publicly accessible corporate marketing blog posts",
      "Open-source software documentation",
      "Standard dictionary definitions"
    ],
    a: 0,
    why: [
      "Correct. Regulated data (PII, HIPAA PHI, PCI DSS) requires strict data privacy assessments, redaction, or enterprise BAA/ZDR agreements prior to processing.",
      "Public marketing materials carry minimal data confidentiality risk.",
      "Open-source documentation is public information.",
      "Dictionary definitions contain no private or sensitive data."
    ]
  },
  {
    id: "ccaoq-89", d: 4,
    q: "What is 'Prompt Injection' in LLM applications?",
    opts: [
      "An adversarial technique where untrusted input text overrides system instructions to hijack model behavior",
      "A technique for making prompts run 10x faster",
      "A database indexing optimization for vector databases",
      "A method for adding vitamins to computer chips"
    ],
    a: 0,
    why: [
      "Correct. Prompt injection occurs when malicious user or third-party data contains instructions designed to bypass developer guardrails.",
      "Prompt injection is a security vulnerability, not a speed optimization.",
      "Vector database indexing is unrelated to prompt injection attacks.",
      "This is a nonsense distractor."
    ]
  },
  {
    id: "ccaoq-90", d: 5,
    q: "What is the key advantage of using Markdown tables inside Claude prompt contexts for structured lookup data?",
    opts: [
      "Claude preserves column relationships and headers reliably across tabular rows",
      "Markdown tables bypass the context window token limit",
      "Tables automatically convert numbers into foreign currencies",
      "Tables trigger free batch processing discounts"
    ],
    a: 0,
    why: [
      "Correct. Markdown tables provide clear structural delimiters for relational data, improving tabular reasoning and extraction precision.",
      "Tables consume standard tokens within the context window.",
      "Tables do not perform automatic currency conversion unless instructed.",
      "Discounts require the Batches API, not markdown tables."
    ]
  },
  {
    id: "ccaoq-91", d: 6,
    q: "When generating code with Claude, why should you instruct the model to provide explanatory comments alongside the code?",
    opts: [
      "It allows developers to review the architectural intent and assumptions behind the implementation quickly",
      "It forces the compiler to execute the code faster",
      "It prevents the code from being audited by security scanners",
      "It reduces the output token billing by 25%"
    ],
    a: 0,
    why: [
      "Correct. Clear comments and docstrings document assumptions and facilitate human review and maintainability.",
      "Compilers ignore comments; they have no effect on binary execution speed.",
      "Comments do not block static security analyzers.",
      "Comments add output tokens and are billed normally."
    ]
  },
  {
    id: "ccaoq-92", d: 0,
    q: "If an application requires sub-second responses for interactive typing autocompletion, which model is the mandatory choice?",
    opts: [
      "Claude 3.5 Haiku",
      "Claude 3.5 Sonnet with 50 few-shot examples",
      "Claude 3.5 Opus with extended thinking enabled",
      "A multi-agent orchestrator system"
    ],
    a: 0,
    why: [
      "Correct. Haiku is purpose-built for low-latency, real-time interactive workflows.",
      "Sonnet with large prompts has higher time-to-first-token, unsuitable for instantaneous autocompletion.",
      "Opus with extended thinking introduces substantial reasoning latency, unsuitable for typing autocompletion.",
      "Multi-agent orchestrators introduce multi-hop network round trips, drastically increasing latency."
    ]
  },
  {
    id: "ccaoq-93", d: 1,
    q: "Why is 'Negative Prompting' (e.g. 'Do not mention competitors, do not be rude, do not use jargon') often less effective than 'Positive Specification'?",
    opts: [
      "Positive specification provides an explicit pattern to follow, whereas negative lists leave an infinite space of alternate undesirable behaviors",
      "The word 'not' causes an automatic syntax error in the API",
      "Claude is unable to understand negative grammar",
      "Negative words cost double the standard token rate"
    ],
    a: 0,
    why: [
      "Correct. Telling the model what TO do and providing concrete target structures constrains generation far more effectively than endless negative rules.",
      "The API processes standard natural language with no syntax errors for negative words.",
      "Claude understands negative phrasing, but positive constraints provide clearer guidance.",
      "All tokens are priced identically regardless of grammatical polarity."
    ]
  },
  {
    id: "ccaoq-94", d: 2,
    q: "When running automated prompt evaluations, what is 'Position Bias' in pairwise LLM comparison?",
    opts: [
      "The tendency of an LLM evaluator to prefer whichever candidate response is presented first (or second)",
      "The physical geographic location of the evaluation server",
      "The line number where the prompt was written in VS Code",
      "The font size of the text on screen"
    ],
    a: 0,
    why: [
      "Correct. LLM judges often exhibit slight preferences for Candidate A over Candidate B; mitigating this requires swapping positions and averaging scores.",
      "Server location does not define LLM evaluation position bias.",
      "IDE line numbers have no effect on API evaluation outputs.",
      "Font rendering is irrelevant to API token processing."
    ]
  },
  {
    id: "ccaoq-95", d: 3,
    q: "What is the primary risk of deploying a public customer service chatbot without output moderation filters?",
    opts: [
      "Adversarial users may trick the bot into uttering offensive, brand-damaging, or legally binding incorrect statements",
      "The bot will automatically delete the company's website",
      "The bot will consume all available global internet bandwidth",
      "The bot will refuse to talk to users who use mobile phones"
    ],
    a: 0,
    why: [
      "Correct. Public-facing bots require output guardrails to prevent brand damage, disinformation, and unauthorized commitments.",
      "Chatbots have no capability to delete hosting websites without explicit server tool permissions.",
      "Bandwidth consumption is capped by network infrastructure and rate limits.",
      "Chatbots do not discriminate based on client device."
    ]
  },
  {
    id: "ccaoq-96", d: 4,
    q: "In high-reliability extraction pipelines, what is 'Schema Validation'?",
    opts: [
      "Parsing the LLM's JSON output against a strict JSON Schema (e.g. Zod / Pydantic) to catch missing keys or invalid types before saving",
      "Asking the user if they like the color of the website",
      "Compressing the JSON string with Gzip",
      "Running a virus scan on the text file"
    ],
    a: 0,
    why: [
      "Correct. Validating outputs with strict schemas ensures corrupt or missing fields are detected immediately before entering production databases.",
      "UI color preferences have nothing to do with data schema validation.",
      "Gzip compression is transport encoding, not structural validation.",
      "Virus scanning does not validate JSON schema keys and data types."
    ]
  },
  {
    id: "ccaoq-97", d: 5,
    q: "How does providing a reasoning scratchpad (`<thinking>` or `<analysis>`) before generating final JSON improve output validity?",
    opts: [
      "It allows Claude to verify constraints and resolve calculations before committing to the strict JSON token sequence",
      "It reduces total token consumption by 50%",
      "It automatically converts English into SQL queries",
      "It bypasses the need for schema validation"
    ],
    a: 0,
    why: [
      "Correct. Generating intermediate reasoning first prevents premature token commitments and significantly reduces structural JSON syntax errors.",
      "Scratchpad tokens are billed as output tokens and increase total count.",
      "Scratchpads do not automatically convert text to SQL.",
      "Schema validation is still required to guarantee downstream integrity."
    ]
  },
  {
    id: "ccaoq-98", d: 6,
    q: "When designing prompts for multi-lingual translation, what instruction prevents the model from adding unnecessary conversational filler (e.g., 'Here is your translation:')?",
    opts: [
      "Instruct: 'Output ONLY the direct translation inside <translation> tags with no preamble, explanations, or commentary.'",
      "Write 'Please translate politely'",
      "Set temperature to 1.0",
      "Send the prompt 3 times in a loop"
    ],
    a: 0,
    why: [
      "Correct. Explicitly forbidding conversational preambles and enforcing dedicated container tags yields clean, directly parseable translations.",
      "Politeness requests often increase conversational filler rather than reducing it.",
      "High temperature increases stylistic variance and preambles.",
      "Looping requests wastes tokens without fixing prompt instructions."
    ]
  },
  {
    id: "ccaoq-99", d: 0,
    q: "Which Claude model is recommended as the balanced default choice for enterprise coding, complex analysis, and multi-step reasoning?",
    opts: [
      "Claude 3.5 Sonnet",
      "Claude 3.5 Haiku",
      "Claude 1.0 Legacy",
      "Claude Nano"
    ],
    a: 0,
    why: [
      "Correct. Claude 3.5 Sonnet is the flagship balanced model combining state-of-the-art intelligence with fast throughput and cost-effective pricing.",
      "Haiku is optimized for ultra-fast, high-volume lightweight tasks.",
      "Claude 1.0 is deprecated legacy infrastructure.",
      "Claude Nano does not exist in Anthropic's model family."
    ]
  },
  {
    id: "ccaoq-100", d: 1,
    q: "When summarizing multiple conflicting customer reviews, what prompting strategy yields the most balanced synthesis?",
    opts: [
      "Instruct Claude to categorize feedback into separate <positive_themes> and <critical_themes> with citing quote snippets before summarizing",
      "Instruct Claude to only read the 5-star reviews",
      "Ask Claude to pick whichever customer sounds friendliest",
      "Tell Claude to invent 10 additional happy customer reviews"
    ],
    a: 0,
    why: [
      "Correct. Forcing explicit extraction of both positive and critical themes with supporting evidence ensures balanced, objective synthesis.",
      "Ignoring critical reviews introduces severe selection bias.",
      "Subjective friendliness criteria prevents objective analysis.",
      "Fabricating fake reviews violates truthfulness and integrity."
    ]
  }
];

const ccaoData = loadCert('ccao');
ccaoData.cards.push(...ccaoNewCards);
ccaoData.questions.push(...ccaoNewQuestions);
saveCert('ccao', ccaoData);

console.log('Successfully expanded CCAO-F to 100 questions and 25 cards');
