"""
AI DOCTOR RECOMMENDATION SYSTEM - ARCHITECTURE DIAGRAMS
=======================================================
"""

# =========================================================
# 1. SYSTEM ARCHITECTURE OVERVIEW
# =========================================================

                           ┌─────────────────────────┐
                           │  User's Web Browser     │
                           │  (Patient Portal)       │
                           │  http://localhost:5173  │
                           └────────────┬────────────┘
                                        │
                                        │ HTTP Request
                                        │ POST /api/recommend-doctor
                                        │ { symptoms: "..." }
                                        ▼
                    ┌───────────────────────────────────┐
                    │  React Component                  │
                    │  AIRecommendation.jsx             │
                    │  - Beautiful UI                   │
                    │  - Input validation               │
                    │  - Error handling                 │
                    │  - Loading states                 │
                    └────────────┬────────────────────┬─┘
                                 │                    │
                ┌────────────────┘                    └──────────────┐
                │                                                     │
                │ Axios HTTP Call (CORS enabled)                     │
                │ to Python Service on port 5000                     │
                │                                                     │
                ▼                                                      ▼
  ┌──────────────────────────────────┐        OR       ┌──────────────────────┐
  │  Option A: Direct Connection     │                 │  Option B: via Node  │
  │  POST http://localhost:5000      │                 │  POST http://500     │
  │  /api/recommend-doctor-detailed  │                 │  localhost:4000      │
  │                                  │                 │  /api/recommendation │
  └────────────┬─────────────────────┘                 └──────────┬───────────┘
               │                                                   │
               │                                                   │
               ▼                                                   ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │              Flask Python API Server (port 5000)                    │
  │  ┌──────────────────────────────────────────────────────────────┐  │
  │  │  Endpoints:                                                  │  │
  │  │  1. POST /api/recommend-doctor (simple)                     │  │
  │  │  2. POST /api/recommend-doctor-detailed (with explanations) │  │
  │  │  3. GET /api/specializations (list all)                     │  │
  │  │  4. GET /api/test-recommendation (test with sample data)    │  │
  │  │  5. GET /health (service health check)                      │  │
  │  └──────────────────────────────────────────────────────────────┘  │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │ Route to appropriate handler
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │         DoctorRecommendationModel (recommendation_model.py)         │
  │  ┌──────────────────────────────────────────────────────────────┐  │
  │  │ _load_dataset()                                              │  │
  │  │   └─ Load from dataset.json (10 specializations)             │  │
  │  │                                                               │  │
  │  │ _generate_embeddings()                                        │  │
  │  │   └─ Pre-compute vectors for all specializations              │  │
  │  │                                                               │  │
  │  │ recommend(symptoms_text, top_k=3)                             │  │
  │  │   └─ Main recommendation function                             │  │
  │  │                                                               │  │
  │  │ recommend_with_explanation(symptoms_text, top_k=3)            │  │
  │  │   └─ Recommendations with matched symptoms                    │  │
  │  └──────────────────────────────────────────────────────────────┘  │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │ Process symptoms
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │              Sentence Transformers (Pre-trained NLP Model)          │
  │                                                                      │
  │  Model: all-MiniLM-L6-v2 (33MB, lightweight)                       │
  │  Input:  Free text (e.g., "fever, cough, cold")                    │
  │  Output: 384-dimensional dense vector (embedding)                   │
  │                                                                      │
  │  This vector captures semantic meaning of the text                  │
  │  Similar symptoms produce similar vectors                           │
  │  Different specialization symptom sets also have vectors            │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │ Compare vectors
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │        Scikit-learn: Cosine Similarity Calculation                  │
  │                                                                      │
  │  For each specialization:                                           │
  │    similarity = cosine_similarity(                                  │
  │                   user_symptoms_vector,                             │
  │                   specialization_symptoms_vector                    │
  │                 )                                                   │
  │                                                                      │
  │  Returns: Float between 0 (completely different) to 1 (identical)   │
  │  Sort by similarity: highest to lowest                              │
  │  Return: Top 3 specializations with confidence scores               │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │ Formatted JSON response
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  JSON Response (back through same path)                             │
  │  {                                                                  │
  │    "success": true,                                                │
  │    "recommendations": [                                             │
  │      {                                                              │
  │        "specialization": "Cardiologist",                            │
  │        "confidence": 0.87,                                          │
  │        "matched_symptoms": ["chest pain", "breathlessness"]         │
  │      },                                                             │
  │      {                                                              │
  │        "specialization": "Pulmonologist",                           │
  │        "confidence": 0.72,                                          │
  │        "matched_symptoms": ["breathlessness"]                       │
  │      },                                                             │
  │      ...                                                            │
  │    ]                                                                │
  │  }                                                                  │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │ HTTP Response
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  React Component (AIRecommendation.jsx)                             │
  │  - Receives JSON response                                           │
  │  - Validates data                                                   │
  │  - Renders recommendations with:                                    │
  │    • Specialization names                                           │
  │    • Confidence bars                                                │
  │    • Matched symptoms as tags                                       │
  │    • Call-to-action buttons                                         │
  └────────────┬─────────────────────────────────────────────────────────┘
               │
               │ Display to user
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  User Sees Beautiful UI with Recommendations                        │
  │  ✓ Cardiologist (87% confidence)                                    │
  │  ✓ Pulmonologist (72% confidence)                                   │
  │  ✓ General Physician (65% confidence)                               │
  │                                                                      │
  │  User can click to schedule appointment with recommended doctor     │
  └─────────────────────────────────────────────────────────────────────┘


# =========================================================
# 2. DATA FLOW DIAGRAM
# =========================================================

Input                Processing              Matching            Output
─────                ──────────              ────────            ──────

"fever,              Tokenize:               Generate            Cardiologist
cough,      ──►      ["fever","cough"]  ──►  Embedding  ──►      87%
cold"                                        Vector
                     Sentence
                     Transformers            384D Vector         Pulmonologist
                     Encoder                 [0.23, 0.45,        72%
                                            -0.12, ...]
                                                    │
                                                    │
                                                    ├─► Cosine Similarity
                                                    │   with
                                                    │   Cardiologist symptoms vector
                                                    │   = 0.87
                                                    │
                                                    ├─► Cosine Similarity
                                                    │   with
                                                    │   Pulmonologist symptoms vector
                                                    │   = 0.72
                                                    │
                                                    └─► Cosine Similarity with
                                                        General Physician = 0.65


# =========================================================
# 3. MODULE DEPENDENCY DIAGRAM
# =========================================================

                    ┌─────────────────────━━━━━━━━━┐
                    │   Frontend (React)           │
                    │   AIRecommendation.jsx       │
                    │   (Browser - port 5173)      │
                    └──────────────┬────────────────┘
                                   │
                                   │ HTTP (Axios)
                                   │
                    ┌──────────────▼────────────────┐
                    │   Flask API Server           │
                    │   app.py                     │
                    │   (Python - port 5000)       │
                    │                              │
                    │   ┌────────────────────────┐ │
                    │   │ Routes & Handlers      │ │
                    │   │ ┌────────────────────┐ │ │
                    │   │ │ POST /recommend   │ │ │
                    │   │ ├────────────────────┤ │ │
                    │   │ │ POST /detailed    │ │ │
                    │   │ ├────────────────────┤ │ │
                    │   │ │ GET /specializations│ │
                    │   │ └────────────────────┘ │ │
                    │   └────────────┬───────────┘ │
                    │                │            │
                    │     ┌──────────▼──────────┐ │
                    │     │   ML Model Class    │ │
                    │     │recommendation_     │ │
                    │     │model.py             │ │
                    │     │                    │ │
                    │     └──────────┬──────────┘ │
                    │                │            │
                    │    ┌───────────▼──────────┐ │
                    │    │  Dependencies:       │ │
                    │    │  ┌────────────────┐ │ │
                    │    │  │ Sentence-      │ │ │
                    │    │  │ Transformers   │ │ │
                    │    │  └────────────────┘ │ │
                    │    │  ┌────────────────┐ │ │
                    │    │  │ scikit-learn   │ │ │
                    │    │  │ (cosine sim)   │ │ │
                    │    │  └────────────────┘ │ │
                    │    │  ┌────────────────┐ │ │
                    │    │  │ torch/pytorch  │ │ │
                    │    │  └────────────────┘ │ │
                    │    └────────────┬────────┘ │
                    │                │           │
                    │    ┌───────────▼────────┐ │
                    │    │  Dataset          │ │
                    │    │  dataset.json     │ │
                    │    │  (10 specs,       │ │
                    │    │  140+ symptoms)   │ │
                    │    └───────────────────┘ │
                    └─────────────────────────────┘
                                  │
                       ┌──────────┴──────────┐
                       │ Optional:           │
                       │ Node.js Backend     │
                       │ for proxying        │
                       └─────────────────────┘


# =========================================================
# 4. NLP PROCESS FLOW
# =========================================================

User Input Text
    │
    ▼
"fever, cough, cold"
    │
    ▼
┌─────────────────────────────┐
│ Sentence Transformers       │
│ (Pre-trained Model)         │
│                             │
│ 1. Tokenization             │
│    Break into words/tokens  │
│                             │
│ 2. Encoding                 │
│    Convert to embeddings    │
│    (384-dimensional vector) │
│                             │
│ Output Vector:              │
│ [0.234, -0.456, 0.123, ...] │
│    384 dimensions total     │
└─────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ Specialization Vectors       │         │ Specialization Vectors       │
│ (Pre-computed)               │         │ (Pre-computed)               │
│                              │         │                              │
│ Cardiologist:                │         │ Pulmonologist:               │
│ "chest pain, heart           │  ┌─────►| "cough, shortness of        │
│  palpitations, breathless..."│  │      │ breath, wheezing..."         │
│ [0.145, 0.267, -0.089, ...] │  │      │ [0.167, 0.234, 0.045, ...]  │
│      384 dimensions          │  │      │      384 dimensions          │
└──────────────────────────────┘  │      └──────────────────────────────┘
    │                              │
    │ Cosine Similarity            │ Cosine Similarity
    │ Calculation                  │ Calculation
    │                              │
    ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│ similarity(user,     │      │ similarity(user,     │
│ cardiologist)        │      │ pulmonologist)       │
│                      │      │                      │
│ cos(θ) = (A·B)/(|A||B|│      │ cos(θ) = (A·B)/(|A||B|)│
│ = 0.87               │      │ = 0.72               │
│ (87% confidence)     │      │ (72% confidence)     │
└──────────────────────┘      └──────────────────────┘

         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
                ┌────────────────────┐
                │ Rank Results       │
                │ 1. Cardiologist 87%│
                │ 2. Pulmonologist 72│
                │ 3. Gen Physician 65│
                └────────────────────┘


# =========================================================
# 5. FILE STRUCTURE & DEPENDENCIES
# =========================================================

Smart-AI-Integrated-Doctor-Appointment-Portal/
│
├── frontend/                          React Frontend App
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIRecommendation.jsx   ◄─── Uses Axios ──┐
│   │   │   ├── Navbar.jsx             ◄─── Display      │
│   │   │   ├── Header.jsx             ◄─── Results      │
│   │   │   └── ...                                      │
│   │   ├── App.jsx                                       │
│   │   ├── main.jsx                                      │
│   │   └── index.css                                     │
│   ├── package.json                                      │
│   └── vite.config.js                                    │
│                                                         │
├── backend/                           Main Backend       │
│   ├── ai/                     ◄───── AI Python Service  │
│   │   ├── app.py             ◄───── Flask server ──────┤
│   │   ├── recommendation_     ◄───── ML model ─────────┤
│   │   │  model.py            ◄───── (Sentence      ────┤
│   │   ├── dataset.json       ◄───── Transformers,  ────┤
│   │   ├── __init__.py        ◄───── scikit-learn)  ────┤
│   │   ├── requirements.txt   ◄───── Dependencies    ────┤
│   │   ├── .env.example                               │
│   │   └── README.md                                    │
│   │                                                    │
│   ├── routes/                ◄───── Express Routes ─┐  │
│   │   ├── userRoute.js       ◄── Can proxy to ──────┼──┤
│   │   ├── adminRouter.js     ◄── Python service ────┤
│   │   └── doctorRouter.js    ◄── (optional)     ────┤
│   │                                                  │
│   ├── controllers/           ◄───── Business Logic ─┤
│   ├── models/                ◄───── Database Models ─┤
│   ├── middlewares/           ◄───── Auth & CORS      │
│   ├── config/                ◄───── Configuration    │
│   ├── package.json           ◄───── Node.js deps ────┤
│   ├── server.js              ◄───── Express App ─────┤
│   └── .env                   ◄───── Configuration    │
│                                                      │
├── admin/                     ◄───── Admin Panel      │
│   ├── src/                                           │
│   ├── package.json                                    │
│   └── vite.config.js                                  │
│                                                      │
├── README.md                  ◄───── Updated with AI  │
├── AI_QUICKSTART.md           ◄───── Quick setup      │
├── INTEGRATION_GUIDE.md       ◄───── Integration docs │
├── IMPLEMENTATION_SUMMARY.md  ◄───── Complete summary │
├── setup.sh                   ◄───── Linux/Mac setup  │
└── setup.bat                  ◄───── Windows setup    │


# =========================================================
# 6. REQUEST/RESPONSE LIFECYCLE
# =========================================================

┌─ CLIENT SIDE ──────────────────────────────────────┐
│                                                    │
│  User enters: "chest pain, breathlessness"         │
│           │                                        │
│           ▼                                        │
│  AIRecommendation.jsx                              │
│  validates input                                   │
│  shows loading spinner                             │
│           │                                        │
│           ▼                                        │
│  Axios POST request:                               │
│  URL: http://localhost:5000/api/recommend-doctor-  │
│       detailed                                     │
│  Data: { symptoms: "chest pain, breathlessness" }  │
│           │                                        │
└───────────┼────────────────────────────────────────┘
            │
            │ HTTP over network
            │
┌───────────▼────────────────────────────────────────┐
│ - SERVER SIDE -                                    │
│                                                    │
│  Flask app.py receives POST request                │
│           │                                        │
│           ▼                                        │
│  @app.route('/api/recommend-doctor-detailed')      │
│  Handler function:                                 │
│  - Extracts symptoms from request                  │
│  - Validates (not empty, not too long)             │
│  - Creates symptoms list: ["chest pain",           │
│                            "breathlessness"]       │
│           │                                        │
│           ▼                                        │
│  Calls load_model()                                │
│  If first request:                                 │
│    - Initializes Sentence Transformers             │
│    - Loads dataset.json                            │
│    - Pre-computes all specialization vectors       │
│  Otherwise:                                        │
│    - Uses cached model instance                    │
│           │                                        │
│           ▼                                        │
│  model.recommend_with_explanation(                 │
│    symptoms="chest pain, breathlessness",          │
│    top_k=3                                         │
│  )                                                 │
│           │                                        │
│           ▼                                        │
│  recommendation_model.py:                          │
│  1. Encode user symptoms with Sentence             │
│     Transformers:                                  │
│     Input: "chest pain, breathlessness"            │
│     Output: 384D vector                            │
│                                                    │
│  2. For each specialization:                       │
│     - Get pre-computed specialization vector       │
│     - Calculate cosine similarity                  │
│     - Store result                                 │
│                                                    │
│  3. Sort by similarity score (descending)          │
│                                                    │
│  4. Get top 3:                                     │
│     [                                              │
│      { specialization: "Cardiologist", conf: 0.87},│
│      { specialization: "Pulmonologist", conf: 0.72│
│      { specialization: "Gen. Physician", conf: 0.6│
│     ]                                              │
│           │                                        │
│           ▼                                        │
│  Find matched symptoms (bonus info):               │
│  - Compare user symptoms with specialization       │
│  - Return overlapping symptoms as matched_symptoms │
│           │                                        │
│           ▼                                        │
│  Flask handler formats JSON response:              │
│  {                                                 │
│    "success": true,                                │
│    "recommendations": [...],                       │
│    "input_symptoms": "chest pain, breathlessness"  │
│  }                                                 │
│           │                                        │
│           ▼                                        │
│  Send HTTP 200 response with JSON body             │
│           │                                        │
└───────────┼────────────────────────────────────────┘
            │
            │ HTTP response with JSON
            │
┌───────────▼────────────────────────────────────────┐
│ - CLIENT SIDE -                                    │
│                                                    │
│  React component receives response                 │
│           │                                        │
│           ▼                                        │
│  Parse JSON:                                       │
│  response.data.recommendations = [...]             │
│           │                                        │
│           ▼                                        │
│  Hide loading spinner                              │
│  Update state with recommendations                 │
│           │                                        │
│           ▼                                        │
│  Re-render component with:                         │
│  - Specialization cards                            │
│  - Confidence bars                                 │
│  - Matched symptoms                                │
│  - Schedule appointment buttons                    │
│           │                                        │
│           ▼                                        │
│  User Sees:                                        │
│  🥇 Cardiologist (87%)                             │
│     Matched: chest pain, breathlessness            │
│     [Schedule Appointment]                         │
│                                                    │
│  🥈 Pulmonologist (72%)                            │
│     Matched: breathlessness                        │
│     [Schedule Appointment]                         │
│                                                    │
│  🥉 General Physician (65%)                        │
│     Matched: breathlessness                        │
│     [Schedule Appointment]                         │
│                                                    │
└────────────────────────────────────────────────────┘


# =========================================================
# 7. DEPLOYMENT ARCHITECTURE
# =========================================================

┌─────────────────────────────────────────────────────────┐
│                   USER'S COMPUTER                       │
│                   or Server                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Terminal 1: Python AI Service                  │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ $ cd backend/ai                            │ │   │
│  │  │ $ source venv/bin/activate                 │ │   │
│  │  │ $ python app.py                            │ │   │
│  │  │ Running on http://localhost:5000           │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│              Port 5000 (Flask)                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Terminal 2: Node.js Backend                    │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ $ cd backend                               │ │   │
│  │  │ $ npm start                                │ │   │
│  │  │ Running on http://localhost:4000           │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│              Port 4000 (Express)                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Terminal 3: React Frontend                     │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ $ cd frontend                              │ │   │
│  │  │ $ npm run dev                              │ │   │
│  │  │ Running on http://localhost:5173           │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│              Port 5173 (Vite)                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Terminal 4: Admin Panel                        │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │ $ cd admin                                 │ │   │
│  │  │ $ npm run dev                              │ │   │
│  │  │ Running on http://localhost:5174           │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│              Port 5174 (Vite)                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  MongoDB (local or cloud)                       │   │
│  │  Connection: mongodb://localhost:27017          │   │
│  └─────────────────────────────────────────────────┘   │
│              Port 27017                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘

Communication Flow:
User Browser (5173) ◄──► Express Backend (4000) ◄──► Python AI (5000)
     │                           │
     │                           └──► MongoDB (27017)
     │
     └──► Direct to Python AI (5000) [Optional]

═════════════════════════════════════════════════════════════════════

This architecture ensures:
✅ Separation of concerns
✅ Easy debugging (each service independent)
✅ Easy scaling (run multiple instances)
✅ Easy maintenance (modular)
✅ Production-ready
✅ Fully documented
"""
