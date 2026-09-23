// Tried in order: if a model is busy or unavailable, the next one is used.
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];
const KEY_STORAGE = 'chalkcode_gemini_key';

const ATTEMPTS_PER_MODEL = 2;
const RETRY_DELAY_MS = 1500;
// Temporary problems worth retrying, plus 404 in case a fallback model isn't offered.
const RETRYABLE_STATUS = [404, 429, 500, 503];

const els = {
  topic: document.getElementById('topic'),
  language: document.getElementById('language'),
  customRow: document.getElementById('custom-lang-row'),
  customLanguage: document.getElementById('custom-language'),
  level: document.getElementById('level'),
  generateBtn: document.getElementById('generate-btn'),
  status: document.getElementById('board-status'),
  codeOutput: document.getElementById('code-output'),
  explanation: document.getElementById('explanation'),
  filename: document.getElementById('paper-filename'),
  copyBtn: document.getElementById('copy-btn'),
  keyBtn: document.getElementById('key-btn'),
  keyDialog: document.getElementById('key-dialog'),
  keyForm: document.getElementById('key-form'),
  keyInput: document.getElementById('key-input'),
  keyCancel: document.getElementById('key-cancel'),
};

const EXTENSIONS = {
  python: 'py', javascript: 'js', java: 'java', 'c++': 'cpp', c: 'c',
  'c#': 'cs', go: 'go', rust: 'rs', typescript: 'ts', php: 'php',
  ruby: 'rb', swift: 'swift', kotlin: 'kt', sql: 'sql', r: 'r',
};

function currentLanguage() {
  const selected = els.language.value;
  if (selected === 'Other (type below)') {
    return els.customLanguage.value.trim() || 'Text';
  }
  return selected;
}

function guessExtension(lang) {
  return EXTENSIONS[lang.toLowerCase()] || 'txt';
}

els.language.addEventListener('change', () => {
  els.customRow.hidden = els.language.value !== 'Other (type below)';
});

function getKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}

function openKeyDialog() {
  els.keyInput.value = getKey();
  els.keyDialog.showModal();
}

els.keyBtn.addEventListener('click', openKeyDialog);
els.keyCancel.addEventListener('click', () => els.keyDialog.close());

els.keyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = els.keyInput.value.trim();
  try {
    if (value) localStorage.setItem(KEY_STORAGE, value);
  } catch (err) {
    console.error('Could not save key locally', err);
  }
  els.keyDialog.close();
});

els.copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(els.codeOutput.textContent);
    els.copyBtn.textContent = 'Copied';
    setTimeout(() => (els.copyBtn.textContent = 'Copy'), 1500);
  } catch (err) {
    console.error('Clipboard failed', err);
  }
});

function buildPrompt(topic, language, level) {
  const levelNote = {
    beginner: 'Add a short comment above each meaningful line explaining what it does, as if teaching a first-year student.',
    intermediate: 'Add brief comments only where the logic isn\'t obvious.',
    advanced: 'Keep it concise and idiomatic; minimal comments.',
  }[level];

  return `You are helping a student write code.
Task: ${topic}
Language: ${language}
${levelNote}

Respond in exactly this format, with no extra text before or after:
CODE:
<the complete, runnable code, nothing else in this block>
EXPLANATION:
<3-6 sentences explaining how the code works, in plain language>`;
}

function parseResponse(text) {
  const codeMatch = text.match(/CODE:\s*([\s\S]*?)\s*EXPLANATION:/i);
  const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]*)/i);
  let code = codeMatch ? codeMatch[1] : text;
  // strip a fenced code block if the model added one anyway
  code = code.replace(/^```[a-zA-Z0-9]*\n?/, '').replace(/```\s*$/, '').trim();
  const explanation = explanationMatch ? explanationMatch[1].trim() : '';
  return { code, explanation };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Google's free tier sometimes answers "high demand" (503). Retrying, then
// falling back to another model, makes the app work through those spikes
// instead of showing an error on the first hiccup.
async function callGemini(key, prompt) {
  let lastError = new Error('No response from the model. Try again.');

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (response.ok) return response.json();

      const errBody = await response.json().catch(() => ({}));
      lastError = new Error(errBody?.error?.message || `Request failed (${response.status})`);

      // Errors like a bad key (400/403) won't fix themselves, so stop right away.
      if (!RETRYABLE_STATUS.includes(response.status)) throw lastError;
      await wait(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

async function generate() {
  const topic = els.topic.value.trim();
  const language = currentLanguage();
  const level = els.level.value;
  const key = getKey();

  if (!topic) {
    els.status.textContent = 'Describe what you want to build first.';
    return;
  }
  if (!key) {
    els.status.textContent = 'Add a free Gemini API key first (top right).';
    openKeyDialog();
    return;
  }

  els.generateBtn.disabled = true;
  els.copyBtn.disabled = true;
  els.status.textContent = 'Writing your code…';
  els.codeOutput.textContent = '';
  els.explanation.textContent = '';

  try {
    const data = await callGemini(key, buildPrompt(topic, language, level));
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    if (!text) throw new Error('No response from the model. Try again.');

    const { code, explanation } = parseResponse(text);
    els.codeOutput.textContent = code;
    els.explanation.textContent = explanation;
    els.filename.textContent = `answer.${guessExtension(language)}`;
    els.status.textContent = '';
    els.copyBtn.disabled = false;
  } catch (err) {
    console.error(err);
    els.status.textContent = `Something went wrong: ${err.message}`;
    els.codeOutput.textContent = 'No code generated — see the message above.';
  } finally {
    els.generateBtn.disabled = false;
  }
}

els.generateBtn.addEventListener('click', generate);