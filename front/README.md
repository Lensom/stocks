# Olivia Frontend

## Run frontend and backend locally

Use two terminals: one for backend, one for frontend.

### 1) Start backend (`/back`)

```powershell
cd ../back
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend will be available at: [http://localhost:8000](http://localhost:8000)  
Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 2) Start frontend (`/front`)

In a new terminal:

```powershell
cd ../front
npm install
npm run dev
```

Frontend will be available at: [http://localhost:3000](http://localhost:3000)

## Useful commands (frontend)

```powershell
npm run dev    # start dev server
npm run build  # production build
npm run start  # run production build
npm run lint   # run linter
```
