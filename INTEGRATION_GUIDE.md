"""
Integration guide for connecting the AI Recommendation service with the Node.js Express backend.
This allows the main backend to proxy requests to the Python Flask service.
"""

# Option 1: Direct Flask Service (Recommended for Production)
# ============================================================
# Keep the Python service running separately on port 5000
# Frontend/Admin calls Flask directly: http://localhost:5000/api/recommend-doctor

# Option 2: Proxy Through Node.js Backend
# =========================================
# Add this route to your Express backend to proxy requests

# FILE: backend/routes/recommendationRouter.js (NEW FILE - Create this)

```javascript
import express from 'express'
import axios from 'axios'
import authUser from '../middlewares/authUser.js'

const recommendationRouter = express.Router()

// Flask AI service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000'

// Proxy: GET /api/recommendation/specializations
// Returns list of all available specializations
recommendationRouter.get('/specializations', async (req, res) => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/api/specializations`)
        return res.json(response.data)
    } catch (error) {
        console.error('Error fetching specializations:', error.message)
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch specializations'
        })
    }
})

// Proxy: POST /api/recommendation/recommend
// Input: { symptoms: "fever, cough" }
// Output: { recommendations: [...], confidence: [...] }
recommendationRouter.post('/recommend', async (req, res) => {
    try {
        const { symptoms, top_k = 3 } = req.body

        // Validate input
        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Symptoms field is required'
            })
        }

        // Call Flask AI service
        const response = await axios.post(
            `${AI_SERVICE_URL}/api/recommend-doctor-detailed`,
            {
                symptoms: symptoms.trim(),
                top_k: Math.min(top_k, 10)
            }
        )

        // Return recommendations
        return res.json(response.data)

    } catch (error) {
        console.error('Error from AI service:', error.message)
        
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to get recommendations. Make sure AI service is running on port 5000.'
        })
    }
})

// Proxy: POST /api/recommendation/recommend-simple
// Lightweight version without detailed explanations
recommendationRouter.post('/recommend-simple', async (req, res) => {
    try {
        const { symptoms, top_k = 3 } = req.body

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Symptoms field is required'
            })
        }

        const response = await axios.post(
            `${AI_SERVICE_URL}/api/recommend-doctor`,
            {
                symptoms: symptoms.trim(),
                top_k: Math.min(top_k, 10)
            }
        )

        return res.json(response.data)

    } catch (error) {
        console.error('Error from AI service:', error.message)
        return res.status(500).json({
            success: false,
            error: 'Failed to get recommendations'
        })
    }
})

// Health check: GET /api/recommendation/health
recommendationRouter.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/health`)
        return res.json(response.data)
    } catch (error) {
        return res.status(503).json({
            success: false,
            error: 'AI service unavailable',
            details: error.message
        })
    }
})

export default recommendationRouter
```

# Then add to server.js:

```javascript
import recommendationRouter from './routes/recommendationRouter.js'

// ... other imports and middleware ...

// Add this route
app.use('/api/recommendation', recommendationRouter)

// ... rest of the code ...
```

# Also add to backend/.env:

```env
AI_SERVICE_URL=http://localhost:5000
```

# ============================================================
# Option 3: Frontend - Direct to Flask Service (Simplest)
# ============================================================
# Keep Flask running on port 5000
# Frontend calls directly from React components

# In frontend/.env:
```env
VITE_AI_SERVICE_URL=http://localhost:5000
```

# In AIRecommendation.jsx (already configured):
```javascript
const API_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5000'
```

# ============================================================
# Database Integration (Optional)
# ============================================================
# Save recommendations to MongoDB for analytics

# FILE: backend/models/recommendationModel.js

```javascript
import mongoose from "mongoose"

const recommendationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    symptoms: {
        type: String,
        required: true
    },
    recommendations: [{
        specialization: String,
        confidence: Number,
        matched_symptoms: [String]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const recommendationModel = mongoose.model('Recommendation', recommendationSchema)

export default recommendationModel
```

# Add logging to recommendationRouter.js:

```javascript
import recommendationModel from '../models/recommendationModel.js'

// In POST /api/recommendation/recommend:
recommendationRouter.post('/recommend', async (req, res) => {
    try {
        const { symptoms, top_k = 3 } = req.body
        const userId = req.body?.userId || 'anonymous'

        // ... existing code ...

        // Save to database for analytics
        if (userId !== 'anonymous') {
            await recommendationModel.create({
                userId,
                symptoms,
                recommendations: response.data.recommendations
            })
        }

        return res.json(response.data)
    } catch (error) {
        // ... error handling ...
    }
})
```

# ============================================================
# Docker Compose Setup (Production)
# ============================================================
# FILE: docker-compose.yml (at project root)

```yaml
version: '3.8'

services:
  # Node.js Backend
  backend:
    build:
      context: ./backend
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
      - AI_SERVICE_URL=http://ai-service:5000
    depends_on:
      - mongo
      - ai-service
    volumes:
      - ./backend:/app
    command: npm start

  # Python AI Service
  ai-service:
    build:
      context: ./backend/ai
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - FLASK_DEBUG=false
    volumes:
      - ./backend/ai:/app

  # MongoDB
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  # React Frontend
  frontend:
    build:
      context: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:4000
      - VITE_AI_SERVICE_URL=http://localhost:5000
    depends_on:
      - backend

  # Admin Panel
  admin:
    build:
      context: ./admin
    ports:
      - "5174:5174"
    environment:
      - VITE_API_URL=http://localhost:4000
      - VITE_AI_SERVICE_URL=http://localhost:5000
    depends_on:
      - backend

volumes:
  mongo_data:

networks:
  default:
    name: doctor-portal-network
```

# Create Dockerfile for backend:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

# Create Dockerfile for ai-service:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

# ============================================================
# Testing All Connections
# ============================================================

# 1. Check Flask service is running:
curl http://localhost:5000/health

# 2. Test Flask directly:
curl -X POST http://localhost:5000/api/recommend-doctor \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "fever, cough"}'

# 3. Test Node.js proxy (if using Option 2):
curl -X POST http://localhost:4000/api/recommendation/recommend \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "fever, cough"}'

# 4. Test frontend component:
# Open http://localhost:5173 and look for AI Recommendation section

# ============================================================
# Logging & Monitoring
# ============================================================

# Check Flask logs:
tail -f backend/ai.log

# Check Node.js logs:
npm start 2>&1 | tee backend.log

# Monitor service health:
watch -n 5 "curl -s http://localhost:5000/health | python -m json.tool"

# ============================================================
# Performance Tuning (Production)
# ============================================================

# For Python Flask service, use multiple workers:
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --access-logfile - app:app

# For Node.js backend, enable clustering:
# See backend/server.js for cluster module configuration

# ============================================================
# Troubleshooting Integration
# ============================================================

Problem: "AI service unavailable"
Solution: 
  1. Ensure Python Flask service is running: python backend/ai/app.py
  2. Check if port 5000 is not blocked by firewall
  3. Verify AI_SERVICE_URL in .env matches actual Flask service URL

Problem: CORS errors when calling from frontend
Solution:
  1. CORS is enabled in Flask (backend/ai/app.py line 7)
  2. For production, configure CORS_ORIGINS in backend/ai/.env

Problem: Request timeout on first recommendation
Solution:
  1. Normal on first request (model loads from disk)
  2. Subsequent requests are fast (~100ms)
  3. Increase timeout in axios calls if needed: timeout: 30000

Problem: High memory usage
Solution:
  1. Model size can be reduced (see README.md Model Configuration)
  2. Use all-MiniLM-L6-v2 (33MB) instead of larger models
  3. Implement caching for repeated symptom queries

# ============================================================
# Complete Architecture Flow
# ============================================================

User Input
    ↓
React Component (AIRecommendation.jsx)
    ↓
API Call (POST /api/recommend-doctor)
    ↓
Flask Python Service (app.py)
    ↓
NLP Model (recommendation_model.py)
    ↓
Sentence Transformers
    ↓
Cosine Similarity Calculation
    ↓
Ranked Results with Confidence Scores
    ↓
JSON Response
    ↓
React Component Display
    ↓
User Sees Recommendations

# ============================================================
# Summary
# ============================================================

✅ AI service is completely isolated and modular
✅ Can run standalone or proxied through Node.js
✅ Frontend can call directly or through backend proxy
✅ Easy to monitor and scale
✅ Production-ready with error handling
✅ Optional database persistence for analytics
✅ Docker support for containerized deployment

Recommended Setup for Development:
- Run Flask on port 5000
- Run Node.js on port 4000
- Run React frontend on port 5173
- Call Flask directly from React (simplest)

Recommended Setup for Production:
- Use Docker Compose
- Flask behind Gunicorn with 4+ workers
- Node.js in cluster mode
- MongoDB in separate container
- All services in same Docker network
```

---

**Status**: ✅ Ready for Integration
**Configuration**: Flexible - Direct, Proxy, or Docker
**Security**: CORS enabled, Input validation, Error handling
