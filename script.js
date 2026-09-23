const GEMINI_MODEL = 'gemini-2.5-flash';
const KEY_STORAGE = 'chalkcode_gemini_key';

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(topic, language, level) }] }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `Request failed (${response.status})`);
    }

    const data = await response.json();
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
