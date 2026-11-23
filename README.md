# JanSahayak AI

**An AI-Powered Government Scheme and Benefits Assistant Using Generative AI and Large Language Models**

MCA project · Domain: Generative AI, Large Language Models, NLP, Retrieval-Augmented Generation, Social Welfare

> **Disclaimer.** JanSahayak AI gives *informational assistance only*. It does not make official eligibility decisions. Always confirm details with the official government website or office.

---

## Table of contents
1. [Introduction and objectives](#1-introduction-and-objectives)
2. [Features](#2-features)
3. [Technology stack](#3-technology-stack)
4. [Folder structure](#4-folder-structure-explained)
5. [How the system works](#5-how-the-system-works)
6. [Installation (Windows + VS Code)](#6-installation-windows--vs-code)
7. [Running the application](#7-running-the-application)
8. [Uploading scheme documents](#8-uploading-scheme-documents)
9. [Testing](#9-testing)
10. [Honest status: what is tested and what is pending](#10-honest-status-what-is-tested-and-what-is-pending)
11. [Common errors and solutions](#11-common-errors-and-solutions)
12. [How to demonstrate the project in your review](#12-how-to-demonstrate-the-project-in-your-review)
13. [Twenty likely viva questions and answers](#13-twenty-likely-viva-questions-and-answers)
14. [About the scheme dataset](#14-about-the-scheme-dataset)

---

## 1. Introduction and objectives
Many citizens do not know which welfare schemes exist, whether they may qualify, which documents are needed or how to apply. Official information is reliable but long, formal and mostly in English. JanSahayak AI lets a citizen ask questions in **English, Hindi or Kannada** and get a simple explanation **written from official documents**, together with the **source and page** it came from.

Objectives
1. Build a web assistant for discovering and understanding government schemes.
2. Implement a RAG pipeline: PDF → text → chunks → embeddings → ChromaDB → retrieval → LLM answer.
3. Use a free, local LLM (Ollama + Llama 3.2). No paid API is needed.
4. Show sources with every answer, and say clearly when information is not available.
5. Provide personalised suggestions, scheme comparison, admin tools and feedback.
6. Apply sound security practice (hashed passwords, JWT, validation, safe uploads, prompt-injection mitigation).

## 2. Features
| Module | What it does |
|---|---|
| Registration / login | bcrypt-hashed passwords, JWT tokens, profile page |
| AI chatbot | RAG answers, sources with page numbers, chat history, “not available” replies, helpful / report buttons |
| Recommendations | Optional profile → schemes that *may* be relevant, each with a reason; never guarantees eligibility |
| Scheme explorer | Search, 9 category filters, detail pages with benefits, eligibility, documents, procedure, official website, source URL, last-verified date |
| Document RAG | Admin uploads PDF → extracted, sanitised, chunked, embedded, stored; semantic retrieval |
| Multilingual | English, Hindi, Kannada interface and answers |
| Comparison | 2–4 schemes side by side |
| Admin dashboard | Add / edit / delete schemes, upload / view / delete PDFs, review feedback |
| Feedback | Rate answers, report incorrect or outdated information |
| User dashboard | Totals, categories, recently added, recommended, recently viewed |

## 3. Technology stack
| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite, plain CSS | Fast to run, easy to read |
| Backend | Python, FastAPI | Automatic validation and API docs |
| Database | **SQLite** | No server to install, a single file, enough for a single-machine prototype. (MongoDB would be a reasonable choice if you scale up.) |
| LLM | Ollama + Llama 3.2 | Free, runs on your own computer, no data leaves it |
| Embeddings | Sentence Transformers (`paraphrase-multilingual-MiniLM-L12-v2`) | Understands meaning; multilingual |
| Vector DB | ChromaDB | Simple local vector store |
| PDF text | pypdf | Page-by-page extraction |
| Auth | bcrypt + PyJWT | Standard, secure approach |

## 4. Folder structure explained
```
JanSahayak_AI/
├── backend/                  Python server (FastAPI)
│   ├── main.py               Starts the app, creates tables, loads seed data, creates the admin
│   ├── config.py             Reads all settings from environment variables
│   ├── routes/               URL endpoints: auth, schemes, chat, feedback, dashboard, admin
│   ├── models/schemas.py     Input validation rules (Pydantic)
│   ├── services/             security (hashing/JWT), llm (Ollama), prompts, recommend, i18n
│   ├── rag/                  RAG pipeline: pdf_loader, sanitizer, chunker, embedder, vector_store, pipeline
│   ├── database/db.py        SQLite tables and seeding
│   ├── tests/                Automated tests (pytest)
│   └── requirements.txt      Python packages
├── frontend/                 React web app
│   ├── src/pages/            One file per page
│   ├── src/components/       Shared pieces (cards, banners)
│   ├── src/api.js            Calls the backend and attaches the login token
│   ├── src/i18n.js           Interface text in three languages
│   └── package.json          JavaScript packages
├── data/
│   ├── schemes.json          Starter scheme dataset (loaded on first start)
│   └── sample_documents/     Two sample PDFs for trying the upload feature
├── documentation/            Synopsis, reports, research paper (PDF) and diagrams/
├── screenshots/              Real screenshots of the running application
├── .env.example              Template for settings (copy it, never commit the real .env)
└── README.md
```

## 5. How the system works

### 5.1 Frontend ↔ backend
The React app runs in your browser at `http://localhost:5173`. When you click something, `src/api.js` sends an HTTP request such as `POST /api/chat` with your login token in the `Authorization` header. The Vite development server **forwards every `/api/...` request to the FastAPI backend on port 8000**, so the browser only ever talks to one address. FastAPI validates the data, does the work and returns JSON, which React displays.

### 5.2 Backend ↔ LLM
The backend never loads the language model itself. Ollama runs as a separate program on your computer (port 11434). `services/llm.py` sends it the prompt as an HTTP request (`POST http://localhost:11434/api/chat`) and receives the generated text. If Ollama is not running, the chatbot does not crash: it shows the retrieved source passages and a clear message.

### 5.3 How RAG works here
*Problem:* an LLM alone may invent benefit amounts or eligibility rules. *Idea:* first **look up** the facts in trusted documents, then ask the LLM to **explain only those facts**.

**Indexing (done once per document, by the admin)**
1. Admin uploads a PDF → file checks (extension, `%PDF-` signature, size).
2. `pdf_loader` extracts text page by page (page numbers are kept).
3. `sanitizer` removes control characters and neutralises phrases like “ignore previous instructions” (prompt-injection mitigation).
4. `chunker` splits text into ~180-word pieces with 40-word overlap.
5. `embedder` turns each chunk into a vector (a list of 384 numbers capturing meaning).
6. `vector_store` saves vectors + metadata (document, page) in ChromaDB.
The structured schemes from `schemes.json` are indexed the same way, so the chatbot works even before you upload any PDF.

**Answering (every question)**
1. The question is turned into a vector with the same model.
2. ChromaDB returns the nearest chunks (semantic search, cosine similarity).
3. Chunks below `MIN_SIMILARITY` are dropped. If nothing is left, the system replies “not found in the knowledge base” **without calling the LLM** (so it cannot hallucinate).
4. Otherwise `prompts.py` builds the prompt: strict rules + the chunks inside `<context>` tags + the question + the answer language.
5. Ollama writes the answer. If it replies `INSUFFICIENT_INFORMATION`, we show the “not found” message.
6. The answer is returned with the sources (document name, page, link).

## 6. Installation (Windows + VS Code)
All commands are for the VS Code terminal (**Terminal → New Terminal**, PowerShell). Linux/macOS notes are given where they differ.

### 6.1 Install the software
| Software | Download | Check |
|---|---|---|
| Python 3.10 – 3.12 | python.org (tick **“Add Python to PATH”**) | `python --version` |
| Node.js LTS | nodejs.org | `node --version` and `npm --version` |
| Git (optional) | git-scm.com | `git --version` |
| Ollama | ollama.com/download | `ollama --version` |
| VS Code | code.visualstudio.com | — |

### 6.2 Open the project
```powershell
cd path\to\JanSahayak_AI
code .
```

### 6.3 Environment configuration
```powershell
copy .env.example backend\.env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```
Open `backend\.env` and set:
* `SECRET_KEY=` → paste the long random text printed above
* `ADMIN_EMAIL=` and `ADMIN_PASSWORD=` → your own admin login (the admin account is created automatically when the backend starts; a real email domain such as `you@gmail.com` is required)

### 6.4 Python environment and backend installation
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```
* If PowerShell says *“running scripts is disabled”*: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then activate again.
* Linux/macOS: `python3 -m venv venv && source venv/bin/activate`.
* The install is large (PyTorch is downloaded for Sentence Transformers). Allow several minutes.

### 6.5 Ollama and the LLM model
Install Ollama, then in a **new** terminal:
```powershell
ollama pull llama3.2
ollama run llama3.2 "Say hello"
```
The first command downloads the model (a few GB). If the second works, the LLM is ready. Ollama normally keeps running in the background after installation.

### 6.6 Frontend installation
```powershell
cd frontend
npm install
```

### 6.7 Database setup
There is nothing to do. On first start the backend creates `data/jansahayak.db`, loads the starter schemes from `data/schemes.json`, creates the admin from `.env`, and indexes the schemes into ChromaDB. **On the very first start the embedding model (several hundred MB) is downloaded from the internet** — wait until it finishes.

## 7. Running the application
You need **two terminals** (plus Ollama running).

**Terminal 1 – backend**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```
Check `http://localhost:8000/api/health` → `{"status":"ok"}`. Interactive API docs: `http://localhost:8000/docs`.

**Terminal 2 – frontend**
```powershell
cd frontend
npm run dev
```
Open `http://localhost:5173`.

Use: register a normal user from the site; log in with the `ADMIN_EMAIL` account for the admin dashboard.

## 8. Uploading scheme documents
1. Log in as admin → **Admin → Documents (RAG)**.
2. Choose a text-based PDF (max 10 MB). Try `data/sample_documents/Sample_PM-KISAN_Summary_Note.pdf` first.
3. Paste the official source URL of the document (recommended) and click **Upload and index**.
4. You see pages, chunks and how many instruction-like phrases were neutralised.
5. Ask a question in the chatbot; the answer lists the PDF name and page.
Scanned (image-only) PDFs are rejected because OCR is not included in this version.
**Use official documents** (e.g. guidelines downloaded from the scheme’s government website). The two sample PDFs are *test notes written from the dataset, not official documents.*

## 9. Testing
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```
The automated tests use an offline fallback embedder and a mocked LLM, so they run without Ollama or internet. They check *our code* (auth, validation, retrieval plumbing, uploads, refusals), **not** the quality of the real model. Manual tests are listed in the final report.

## 10. Honest status: what is tested and what is pending
* **Done and run:** 49 automated backend tests (auth, schemes, recommendations, comparison, feedback, admin CRUD, PDF upload validation, chunking, sanitiser, retrieval, chatbot behaviour with a mocked LLM); the React app was built and exercised end-to-end in a browser; screenshots in `screenshots/` are from that run.
* **Pending on your computer** (could not be run in the build environment because it had no Ollama and no internet access to download the embedding model):
  1. Real answers from Llama 3.2 through Ollama.
  2. Retrieval quality with the real Sentence Transformers model (the tests use a simple stand-in).
  3. Hindi and Kannada answer quality. Llama 3.2 officially supports Hindi but, to our knowledge, not Kannada, and the multilingual embedding model likewise does not, to our knowledge, list Kannada among its training languages — so Kannada questions may retrieve poorly as well. Check the model pages and evaluate honestly.
  4. Evaluation on your own question set (see the research paper’s evaluation plan).
  5. Review of the Hindi/Kannada interface text by a fluent speaker.
Fill the “Actual result / Status” columns for these in the final report only after you run them.

## 11. Common errors and solutions
| Error | Cause | Fix |
|---|---|---|
| `SECRET_KEY is missing or too short` | `.env` not created | Do step 6.3; the file must be `backend\.env` |
| `'uvicorn' is not recognized` | venv not active | Run `.\venv\Scripts\Activate.ps1` |
| `ModuleNotFoundError` | packages not installed | Activate venv, then `pip install -r requirements.txt` |
| Frontend: “Cannot reach the server” | backend not running | Start Terminal 1; check port 8000 |
| Chat says “language model is not running” | Ollama stopped or model missing | Start Ollama; run `ollama pull llama3.2`; check `OLLAMA_MODEL` in `.env` |
| First start is very slow | embedding model downloading | Wait; needs internet once |
| `Port 8000 already in use` | another program | Use `--port 8001` and set `VITE_BACKEND_URL=http://localhost:8001` before `npm run dev` |
| Upload says “No extractable text” | scanned PDF | Use a text-based PDF |
| Chat always says “not found” | `MIN_SIMILARITY` too high, or no documents | Lower it (e.g. 0.25) in `.env`; restart backend |
| Admin menu missing | logged in as normal user | Log in with `ADMIN_EMAIL` account |
| Registration says invalid email | email-validator rejects fake domains | Use a normal domain such as `gmail.com` |
| Changing embedding model breaks search | old vectors have other dimensions | Delete `data\chroma` folder and restart |

## 12. How to demonstrate the project in your review
1. **Show the problem** (1 min): open an official portal; explain that information is long, formal and mostly English.
2. **Landing page and architecture** (2 min): show the architecture diagram in `documentation/diagrams`.
3. **Register and fill profile** (1 min), then **Recommendations** (shows reasons + disclaimer).
4. **Explorer and detail page** (2 min): categories, search, “Last verified”, source URL, verification note.
5. **Chatbot** (4 min): ask “What documents are required for PM-KISAN?”; point out the sources. Switch to Hindi. Ask something not in the data (e.g. a scheme you did not add) to show the **“not found”** behaviour.
6. **Admin → upload PDF** (3 min): upload a sample PDF, show pages/chunks, then ask a question whose answer is on page 2 and show the page reference.
7. **Security point** (1 min): upload a PDF containing “ignore previous instructions”; show the “neutralised” count.
8. **Comparison and feedback** (2 min).
9. **Tests** (1 min): run `pytest -v`.
10. Be ready to say what is **not** done (see section 10) — honesty scores well.

## 13. Twenty likely viva questions and answers
1. **What is Generative AI?** AI that creates new content (text, images, code) instead of only classifying data. Here, an LLM generates plain-language answers.
2. **What is an LLM?** A neural network (Transformer) with billions of parameters trained to predict the next token; it can follow instructions. We use Llama 3.2 through Ollama.
3. **What is RAG and why did you use it?** Retrieval-Augmented Generation: retrieve relevant text first, then let the LLM answer from it. It reduces hallucination, allows updating knowledge without retraining, and lets us show sources.
4. **What is an embedding?** A vector of numbers representing the meaning of text; similar meanings give nearby vectors.
5. **What is a vector database?** A database built for storing vectors and finding the nearest ones quickly. We use ChromaDB.
6. **What is semantic search? How is it different from keyword search?** It matches meaning, so “money for farmers” can find “income support”; keyword search needs the same words.
7. **Why chunk documents and why overlap?** A vector for a whole document blurs many topics; small chunks are precise. Overlap stops facts at boundaries from being cut.
8. **How do you prevent hallucination?** Strict prompt (use only context; say INSUFFICIENT_INFORMATION otherwise), similarity threshold (no LLM call when nothing relevant), low temperature, visible sources, and user reporting. It reduces but does not eliminate the risk.
9. **What is prompt engineering? Show an example.** Designing instructions for the model. See `services/prompts.py`: rules, delimited context, question, language.
10. **What is prompt injection and how did you handle it?** Hidden instructions in a document that try to control the model. We sanitise text on upload, wrap context in delimiters and tell the model to treat it as data. It is a mitigation, not a guarantee.
11. **Why Ollama / a local model?** Free, private, works offline. Trade-off: smaller models are weaker than large hosted ones, especially for Kannada.
12. **Why SQLite and not MongoDB?** Zero setup, one file, relational data (users, schemes, feedback) fits tables. MongoDB suits larger, flexible-schema or distributed deployments.
13. **How is authentication implemented?** Passwords are hashed with bcrypt (salted). On login the server issues a signed JWT with an expiry; the client sends it in the `Authorization` header; protected routes verify it. Admin routes also check the role in the database.
14. **How do you secure file uploads?** Only `.pdf`, `%PDF-` signature check, 10 MB limit, random stored file name (no path traversal), admin only, text sanitised, corrupt files rejected and cleaned up.
15. **How does multilingual support work?** The selected language is inserted into the prompt and interface labels are translated. The embedding model is multilingual. Limitation: answer quality depends on the LLM; Kannada may be weak.
16. **How are recommendations produced?** Rule-based matching of optional profile fields against structured scheme fields, with a plain-language reason. It never states eligibility.
17. **How do you ensure the data is genuine?** Records were compiled from official pages; each has a source URL, last-verified date and a verification status/notes. Anything not confirmed is stated as such. MGNREGA example: sources indicate it was replaced by the VB-G RAM G Act, so that record is marked low-confidence.
18. **What are the limitations?** Small curated dataset; information can become outdated; local model limits; RAG can still misread; no OCR; informational only.
19. **How did you test and what is still pending?** 49 pytest tests (mocked LLM), manual browser run. Pending: real-LLM answers, real-embedding retrieval quality, Hindi/Kannada evaluation, evaluation question set.
20. **What future work do you propose?** Voice input, more languages, OCR for scanned PDFs, hybrid keyword + semantic search with re-ranking, automatic change detection of official pages, user studies.

## 14. About the scheme dataset
`data/schemes.json` holds 7 starter schemes compiled from official government web pages read on the *last verified* date. Every record shows its `source_url`, `last_verified`, a `verification_status` (`partially_verified` or `low_confidence`) and `verification_notes` explaining what could and could not be confirmed. Fields that sources did not state (for example some document lists and subsidy amounts) say so rather than guessing. Entrepreneurship and Senior Citizens categories currently have no schemes: add verified ones through the admin dashboard.
**Before you submit, re-check each record on its official website** — scheme rules, amounts and deadlines change.
