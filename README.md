# AI Weather Analyzer

MVP weather dashboard with a React/Vite frontend and FastAPI backend.

## Local Development

Install frontend dependencies:

```bash
npm install
```

Create frontend env:

```bash
cp .env.example .env
```

Install backend dependencies:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Run backend:

```bash
cd backend
.venv/bin/uvicorn main:app --reload
```

Run frontend:

```bash
npm run dev
```

Useful URLs:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/health
- Swagger: http://localhost:8000/docs
- Example API: http://localhost:8000/api/weather/Moscow

## Environment

Frontend:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Backend:

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

For production, set `VITE_API_BASE_URL` to the deployed backend `/api` URL and `CORS_ORIGINS` to the deployed frontend origin.

## Production Build

Frontend:

```bash
npm run build
```

Backend start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

If the platform does not provide `$PORT`, use `8000`.

## MVP Features

- Dashboard city search
- FastAPI mock weather endpoint
- AI forecast dashboard
- Forecast source comparison page
- Sidebar navigation with collapsed state
- Deployment-ready env configuration
