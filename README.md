<p align="center">
  <img src="assets/logo-full.svg" alt="ChalkCode logo" width="480">
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-E8C468">
  <img alt="No build step" src="https://img.shields.io/badge/build%20step-none-1F3A2E">
  <img alt="Made by" src="https://img.shields.io/badge/made%20by-Code%20with%20ABM-1F3A2E">
</p>

# ChalkCode

A tiny web app for students: type the topic you're stuck on, pick a programming language and a difficulty level, and get working, explained code back. No backend, no build step, no cost — it's a static site that calls the free Google Gemini API straight from your browser.

**Owner:** Abdullah Bin Masood — [Code with ABM](https://codewithabm.vercel.app/)

**Live idea:** "a function that reverses a linked list" + `C++` + `Beginner` → runnable code with line-by-line comments and a plain-language explanation.

## Why this exists

Most AI coding tools are either general-purpose chat assistants or locked to one language. ChalkCode is scoped for students specifically: pick any language you're learning, get code plus an explanation pitched at your level (beginner / intermediate / advanced).

## Run it locally

No install needed — it's plain HTML/CSS/JS.

1. Clone the repo:
   ```
   git clone https://github.com/<your-username>/chalk-code.git
   cd chalk-code
   ```
2. Open `index.html` in your browser (or run a tiny local server so `fetch` behaves well):
   ```
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`.
3. Click **API key** (top right) and paste in a free Gemini API key — see below.

## Get a free API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Sign in with a Google account and click **Create API key**. No card required.
3. Paste the key into ChalkCode's **API key** button. It's saved only in your browser's `localStorage` — it never touches any server of ours, and the repo never stores your key.

Free-tier requests are rate-limited (requests per minute/day) but cost nothing for a student project. If a request fails, check the error message — it usually means the key is missing/invalid or the free-tier limit was hit for the moment.

## Deploy it as a real website (free)

**GitHub Pages** (simplest):
1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, choose the `main` branch and `/ (root)` folder, then save.
4. Your site will be live at `https://<your-username>.github.io/chalk-code/` within a minute or two.

Since each visitor supplies their own free API key, hosting stays free no matter how many people use it.

## Project structure

```
chalk-code/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── assets/
│   ├── logo-mark.svg    # square icon (favicon, social)
│   └── logo-full.svg    # icon + wordmark (this README)
├── index.html            # page structure
├── style.css             # chalkboard + notebook visual theme
├── script.js              # calls the Gemini API, renders code + explanation
├── package.json           # project metadata (name, author, links)
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── README.md
└── LICENSE
```

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Customizing

- **Add a language:** add an `<option>` in `index.html`'s `#language` select, and an entry in the `EXTENSIONS` map in `script.js` if you want a specific file extension.
- **Change the model:** edit `GEMINI_MODEL` at the top of `script.js` (see [available models](https://ai.google.dev/gemini-api/docs/models)).
- **Swap in a different AI provider:** the whole integration is one `fetch` call in `generate()` inside `script.js` — point it at OpenAI's or Anthropic's API and adjust the request/response shape.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, put it on your resume.
