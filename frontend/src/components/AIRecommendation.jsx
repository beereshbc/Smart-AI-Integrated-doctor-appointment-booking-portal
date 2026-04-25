import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Loader from './Loader'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AIRecommendation = () => {
  const [symptoms, setSymptoms] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [serviceStatus, setServiceStatus] = useState('checking')
  const [modelLoading, setModelLoading] = useState(false)

  // API endpoint - update based on your deployment
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Check service status on component mount
  useEffect(() => {
    checkServiceStatus()
    const statusInterval = setInterval(checkServiceStatus, 3000) // Check every 3 seconds
    return () => clearInterval(statusInterval)
  }, [])

  const checkServiceStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/status`, { timeout: 5000 })
      setServiceStatus('ready')
      setModelLoading(response.data.model_loading)
      if (!response.data.model_loaded) {
        setModelLoading(true)
      }
    } catch (err) {
      setServiceStatus('offline')
      setModelLoading(false)
    }
  }

  const handleGetRecommendations = async (e) => {
    e.preventDefault()
    
    if (!symptoms.trim()) {
      toast.error('Please enter your symptoms')
      return
    }

    if (serviceStatus === 'offline') {
      toast.error('AI service is not available. Please check if the backend is running.')
      return
    }

    setLoading(true)
    setError('')
    setSubmitted(false)

    try {
      const response = await axios.post(`${API_URL}/api/recommend-doctor-detailed`, {
        symptoms: symptoms.trim(),
        top_k: 3
      }, { timeout: 30000 })

      if (response.data.success) {
        setRecommendations(response.data.recommendations)
        setSubmitted(true)
        toast.success('Recommendations generated!')
      } else {
        setError(response.data.error || 'Failed to get recommendations')
        toast.error(response.data.error || 'Failed to get recommendations')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          'Failed to connect to AI service. Make sure the Python backend is running on port 5000.'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSymptoms('')
    setRecommendations([])
    setSubmitted(false)
    setError('')
  }

  // Helper function to get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981' // green
    if (confidence >= 0.6) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          🏥 AI Doctor Recommendation
        </h1>
        <p className="text-gray-600">
          Describe your symptoms and our AI will recommend the most suitable doctor specialization
        </p>
      </div>

      {/* Service Status Banner */}
      {serviceStatus === 'checking' && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded animate-pulse">
          <p className="font-semibold">🔄 Checking AI Service Status...</p>
          <p className="text-sm">Please wait while we initialize the service</p>
        </div>
      )}

      {serviceStatus === 'offline' && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-semibold">❌ AI Service Offline</p>
          <p className="text-sm">The AI recommendation service is not responding. Please ensure the Python backend is running: <code className="bg-red-50 px-2 py-1 rounded">cd backend/ai && python app.py</code></p>
        </div>
      )}

      {modelLoading && serviceStatus === 'ready' && (
        <div className="mb-6 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded">
          <p className="font-semibold flex items-center gap-2">
            <span className="animate-spin">⚙️</span> AI Model Loading (First Time Only)
          </p>
          <p className="text-sm">The AI model is being initialized. This may take 30-60 seconds on first use. Please be patient...</p>
        </div>
      )}

      {/* Symptoms Input Form */}
      <form onSubmit={handleGetRecommendations} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Symptoms
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Example: fever, cough, cold or chest pain, breathlessness"
            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
            rows="4"
            disabled={loading || serviceStatus === 'offline'}
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: You can comma-separate your symptoms for better results
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !symptoms.trim() || serviceStatus === 'offline'}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader /> : '🔍'}
            {loading ? 'Analyzing...' : 'Get Recommendations'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Recommendations Results */}
      {submitted && !error && recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Top Recommendations
          </h2>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md border-l-4 hover:shadow-lg transition"
                style={{ borderLeftColor: getConfidenceColor(rec.confidence) }}
              >
                {/* Rank Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                        #{index + 1}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800">
                        {rec.specialization}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-600">
                      Match Score
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {(rec.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${rec.confidence * 100}%`,
                        backgroundColor: getConfidenceColor(rec.confidence)
                      }}
                    />
                  </div>
                </div>

                {/* Matched Symptoms */}
                {rec.matched_symptoms && rec.matched_symptoms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Matched Symptoms:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rec.matched_symptoms.map((symptom, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <button className="mt-4 w-full bg-blue-50 text-blue-600 font-semibold py-2 px-4 rounded hover:bg-blue-100 transition">
                  Schedule Appointment with {rec.specialization}
                </button>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-xs text-gray-700">
              ⚠️ <strong>Disclaimer:</strong> This AI recommendation is for informational purposes only and should not replace professional medical advice. 
              Please consult with a qualified healthcare provider for proper diagnosis and treatment.
            </p>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {submitted && !error && recommendations.length === 0 && (
        <div className="text-center p-6 bg-gray-100 rounded-lg">
          <p className="text-gray-600">No recommendations found. Please try again with different symptoms.</p>
        </div>
      )}

      {/* Empty State */}
      {!submitted && !error && (
        <div className="text-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">
            👇 Enter your symptoms above and click "Get Recommendations" to get started!
          </p>
        </div>
      )}
    </div>
  )
}

export default AIRecommendation
