# 🌿 TouchGrass AI

**Less scrolling. More growing.**

TouchGrass AI is an offline-first outdoor mission companion built with React, TypeScript, FastAPI, and optional local AI inference through Ollama.

It helps users turn their available time, interests, and energy level into simple outdoor activities, encouraging them to spend less time on screens and more time connecting with the world around them.

## ✨ Features

- **Personalized outdoor missions:** Generate short missions based on available time, interests, and energy level.
- **Optional local AI:** Use Ollama with Qwen2.5 1.5B to generate missions on your machine.
- **Rule-based fallback:** Built-in mission templates keep the core experience useful when the local AI service is unavailable.
- **Local mission history:** Save completed missions and outdoor minutes in browser `localStorage`.
- **Progressive Web App:** Cache frontend assets through a service worker after the initial successful load.
- **Offline support:** Access cached frontend assets and use available fallback functionality without an internet connection, subject to the backend and application state.
- **No account required:** Mission history is stored locally in the browser; no cloud database is required by this prototype.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| PWA | `vite-plugin-pwa` |
| Backend | Python, FastAPI |
| Local AI runtime | Ollama |
| Development model | Qwen2.5 1.5B (`qwen2.5:1.5b`) |
| Local storage | Browser `localStorage` |
| Backend testing | Pytest |

## 🏗️ Architecture

```text
TouchGrass AI
│
├── frontend/
│   ├── React + TypeScript
│   ├── Vite development/build tooling
│   ├── PWA service worker
│   └── Local mission history
│
└── backend/
    ├── FastAPI application
    ├── Mission request validation
    ├── Ollama integration
    ├── AI response validation
    └── Rule-based fallback missions
```

### Mission generation flow

1. The user selects an activity interest, duration, and energy level.
2. The frontend sends the preferences to the FastAPI backend.
3. The backend attempts to generate a mission using the configured Ollama model.
4. The backend returns a valid AI-generated mission or uses a fallback mission when necessary.
5. Completed mission data and outdoor minutes are stored in browser `localStorage`.

## 📋 Requirements

- Node.js 20 or later
- Python 3.10 or later
- npm
- Ollama (optional, required for local AI inference)
- A compatible model downloaded locally if using Ollama

Without Ollama, the application can use its built-in fallback missions.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/harishhardik/TouchGrassAi.git
cd TouchGrassAi
```

### 2. Set up the backend

Navigate to the backend directory:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

### 3. Configure local AI (optional)

Install [Ollama](https://ollama.com/) if you want to generate missions using a local language model.

Download the development model:

```powershell
ollama pull qwen2.5:1.5b
```

Set the model name before starting the backend.

**Windows PowerShell:**

```powershell
$env:OLLAMA_MODEL = "qwen2.5:1.5b"
```

Start the backend:

```bash
python -m uvicorn app:app --reload --port 8000
```

The API should now be available at:

- API base URL: `http://localhost:8000`
- Health check: `http://localhost:8000/api/health`

**Note:** The backend must be configured to use the same model tag that is installed in Ollama. If you use a different model, update `OLLAMA_MODEL` accordingly.

### 4. Set up the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

Keep the backend running while testing AI-backed mission generation.

## ⚙️ Configuration

The backend supports configuration through environment variables.

| Variable | Purpose |
|---|---|
| `OLLAMA_URL` | Ollama generation endpoint |
| `OLLAMA_MODEL` | Model tag used for mission generation |

For the default local Ollama setup, the generation endpoint is:

```text
http://localhost:11434/api/generate
```

The verified development model is:

```text
qwen2.5:1.5b
```

Check `backend/app.py` for the application's configured defaults before changing environment variables.

## 🔌 API

### `GET /api/health`

Checks backend health and reports the configured model and Ollama availability.

Example:

```bash
curl http://localhost:8000/api/health
```

The response includes fields such as:

```json
{
  "status": "ok",
  "model": "qwen2.5:1.5b",
  "ollama_configured": true,
  "ollama_available": true
}
```

The availability value reflects whether the backend can reach Ollama when the health check runs.

### `POST /api/missions`

Generates an outdoor mission from the user's preferences.

Example request:

```json
{
  "minutes": 20,
  "interest": "walking",
  "energy": "medium"
}
```

Example using curl:

```bash
curl -X POST http://localhost:8000/api/missions \
  -H "Content-Type: application/json" \
  -d "{\"minutes\":20,\"interest\":\"walking\",\"energy\":\"medium\"}"
```

The API validates incoming preferences and attempts local AI generation when configured. If generation fails or produces an invalid response, the backend can return a built-in fallback mission.

Refer to the backend implementation for the complete response schema and supported input values.

## 📴 Offline Behavior

TouchGrass AI supports several offline scenarios, but each has different requirements.

| Feature | Offline behavior |
|---|---|
| Frontend app shell | Can load offline after the service worker has cached the necessary assets |
| First visit | Requires an internet connection to load the app unless assets have been provided locally by another means |
| Local AI inference | Works without internet after Ollama and the required model have been installed and downloaded |
| Rule-based fallback | Does not require a hosted AI service |
| Mission history | Stored in browser `localStorage` and available in the same browser profile |
| Backend-dependent features | Require the backend to be reachable unless explicitly implemented in the frontend |

### How to test offline mode

1. Start the backend and frontend.
2. Open the app in your browser while online.
3. Wait for the service worker to install and cache the frontend assets.
4. Open browser DevTools and navigate to **Application → Service Workers**.
5. Enable the browser's offline network mode.
6. Reload the page and verify that the cached app shell loads.
7. Stop the backend and test the application's fallback behavior.
8. If testing local AI, disconnect the internet while keeping Ollama running and the model downloaded.

**Important:** An offline-capable frontend does not automatically make the backend available offline. Local AI inference also requires the Ollama service and model to be present on the machine.

## 🧪 Testing

The backend includes automated tests for:

- Health endpoint behavior
- Invalid mission requests
- Unsupported interests
- Successful Ollama responses
- Invalid AI-generated JSON and fallback behavior
- Ollama connection or HTTP errors

Run the backend tests from the repository root:

```bash
cd backend
python -m pytest -v
```

The development test suite passed **6 tests** in the verified development environment.

Build the frontend for production:

```bash
cd frontend
npm run build
```

The frontend production build completed successfully in the verified development environment.

Results can vary if dependencies or the implementation change. Run the commands above to verify the current checkout.

## 🔐 Privacy and Data

- Mission history is stored in browser `localStorage`.
- The prototype does not require an account or cloud database.
- Local inference can keep mission-generation requests on the user's machine.
- If the app is configured to use a remote service or additional integrations are introduced, data handling may differ.

Clearing browser site data may delete locally stored mission history.

## 🌍 Why Open Innovation Matters

TouchGrass AI explores how open-source software and local AI can support a useful everyday experience without requiring a paid hosted inference API.

Developers can:

- Inspect and improve the mission-generation logic.
- Experiment with compatible local language models.
- Add new outdoor activities and fallback templates.
- Adapt the experience for different communities and environments.
- Improve accessibility, offline behavior, and testing.

The application code and the AI model have separate licensing terms. Review the license of the exact model you download or redistribute before using it in another project.

## 🎥 Demo

**YouTube:** [Watch the TouchGrass AI demo](https://youtu.be/i8BnZB_kX8o)

**Source code:** [GitHub repository](https://github.com/harishhardik/TouchGrassAi)

## 🏆 Challenge

Built for the [Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).

## 🗺️ Future Improvements

- Weather-aware outdoor missions
- More activity categories and personalization
- Mission history and progress visualization
- Improved accessibility and mobile experience
- Additional local model configurations
- More comprehensive offline integration tests

## 📄 License

This project uses the MIT License. See [`LICENSE`](LICENSE) for the full license text.

The license for the application code does not automatically apply to third-party models, dependencies, or other bundled assets.

---

**TouchGrass AI — Less scrolling. More growing. 🌱**
