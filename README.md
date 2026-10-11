# TouchGrass AI 🌱

An offline-first outdoor mission companion built with React + FastAPI and optional local open-weight AI via Ollama.

## What works in this prototype
- Generate short outdoor missions using a local Ollama model when available.
- Deterministic, rule-based fallback when Ollama is unavailable.
- Save completed missions and outdoor minutes in browser localStorage.
- PWA service-worker setup for caching the frontend shell after its first successful load.

## Architecture
- `frontend/`: React + Vite + TypeScript + `vite-plugin-pwa`
- `backend/`: FastAPI; calls Ollama at `http://localhost:11434/api/generate`
- Browser history is stored locally. No account or cloud database is required.

## Requirements
- Node.js 20+
- Python 3.10+
- Optional: Ollama installed with a compatible model pulled locally.

## Run the backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Optional local AI:
```bash
ollama pull llama3.2:3b
```
Then set `OLLAMA_MODEL=llama3.2:3b` before starting the backend. Model size and performance depend on your hardware. The app falls back to curated missions if Ollama is unavailable.

## Run the frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite. The backend should be available at `http://localhost:8000`.

## Offline behavior — be precise
- Once the frontend PWA has been loaded online and its service worker has cached assets, the app shell can load offline.
- Mission generation falls back to built-in templates if the backend or local model is unreachable.
- Completed mission history remains in browser localStorage.
- Ollama inference itself is offline only after the model has been downloaded to the machine.
- Test offline using browser DevTools → Application → Service Workers / Offline. Also test with the backend stopped.
- A first-ever visit cannot cache assets without a network connection.

## API
`POST /api/missions`
```json
{"minutes": 20, "interest": "walking", "energy": "medium"}
```

`GET /api/health`

## Submission checklist
- [ ] Add screenshots or a short demo video.
- [ ] Test a real outdoor mission and describe what happened.
- [ ] Record hardware, model name/tag, response time and whether inference ran locally.
- [ ] Verify offline behavior after initial install.
- [ ] Add a LICENSE that matches your intended open-source terms.
- [ ] Include model license/usage notes for the exact model you distribute or recommend.
- [ ] Replace placeholder repository and demo links in your DEV post.
- [ ] Do not claim full offline AI unless you have tested local inference with the model present.

## Why open innovation matters
The app can work without a paid hosted inference API. Developers can replace the local model, inspect the mission-generation prompt, contribute new mission templates, and adapt the experience for local outdoor activities. The fallback keeps the core activity useful even on low-resource devices.
