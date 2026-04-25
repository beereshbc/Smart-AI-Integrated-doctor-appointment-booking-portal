"""
Flask API for AI Doctor Recommendation System
Creates a lightweight REST API endpoint for doctor specialization recommendations.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from recommendation_model import get_recommendation_model
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model instance (lazy loaded)
model = None
model_loading = False
model_loaded = False


def load_model():
    """Load the recommendation model on first request."""
    global model, model_loading, model_loaded
    if model is None:
        if not model_loading:
            model_loading = True
            logger.info("Loading recommendation model...")
            try:
                model = get_recommendation_model()
                model_loaded = True
                logger.info("✅ Model loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load model: {str(e)}")
                model_loading = False
                raise
        else:
            # Wait for model to load
            import time
            timeout = 300  # 5 minutes timeout
            start = time.time()
            while not model_loaded and (time.time() - start) < timeout:
                time.sleep(0.5)
    return model


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy', 
        'service': 'ai-recommendation-service',
        'model_loaded': model_loaded,
        'model_loading': model_loading
    }), 200


@app.route('/api/status', methods=['GET'])
def status():
    """Get the current status of the AI service and model loading."""
    return jsonify({
        'service': 'ai-recommendation-service',
        'running': True,
        'model_loaded': model_loaded,
        'model_loading': model_loading,
        'message': 'Model is being loaded on first request...' if model_loading and not model_loaded else 'Ready for recommendations'
    }), 200


@app.route('/api/recommend-doctor', methods=['POST'])
def recommend_doctor():
    """
    Recommend specializations based on user symptoms.
    
    Request body:
    {
        "symptoms": "fever, cough, cold"
    }
    
    Response:
    {
        "success": true,
        "recommendations": [
            {"specialization": "General Physician", "confidence": 0.87},
            {"specialization": "Pulmonologist", "confidence": 0.72}
        ]
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate input
        if not data or 'symptoms' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: symptoms'
            }), 400
        
        symptoms = data.get('symptoms', '').strip()
        
        if not symptoms:
            return jsonify({
                'success': False,
                'error': 'Symptoms field cannot be empty'
            }), 400
        
        # Get number of recommendations (default: 3)
        top_k = min(data.get('top_k', 3), 10)  # Max 10 recommendations
        
        # Load model and get recommendations
        model = load_model()
        recommendations = model.recommend(symptoms, top_k=top_k)
        
        logger.info(f"Generated recommendations for symptoms: {symptoms[:50]}...")
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'input_symptoms': symptoms
        }), 200
    
    except Exception as e:
        logger.error(f"Error in recommendation endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@app.route('/api/recommend-doctor-detailed', methods=['POST', 'OPTIONS'])
def recommend_doctor_detailed():
    """
    Recommend specializations with detailed explanations.
    Includes matched symptoms for better understanding.
    
    Request body:
    {
        "symptoms": "fever, cough, cold"
    }
    
    Response:
    {
        "success": true,
        "recommendations": [
            {
                "specialization": "General Physician",
                "confidence": 0.87,
                "matched_symptoms": ["fever", "cold", "cough"]
            }
        ]
    }
    """
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        logger.info(f"Received recommendation request")
        data = request.get_json()
        logger.info(f"Request data: {data}")
        
        if not data or 'symptoms' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: symptoms'
            }), 400
        
        symptoms = data.get('symptoms', '').strip()
        
        if not symptoms:
            return jsonify({
                'success': False,
                'error': 'Symptoms field cannot be empty'
            }), 400
        
        top_k = min(data.get('top_k', 3), 10)
        
        logger.info(f"Loading model for symptoms: {symptoms[:50]}...")
        model = load_model()
        logger.info(f"Model loaded, generating recommendations...")
        recommendations = model.recommend_with_explanation(symptoms, top_k=top_k)
        logger.info(f"Generated {len(recommendations)} recommendations")
        
        logger.info(f"Generated detailed recommendations for symptoms: {symptoms[:50]}...")
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'input_symptoms': symptoms
        }), 200
    
    except Exception as e:
        logger.error(f"Error in detailed recommendation endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@app.route('/api/specializations', methods=['GET'])
def get_specializations():
    """Get list of all available specializations."""
    try:
        model = load_model()
        specializations = [
            spec['specialization'] 
            for spec in model.specializations_data
        ]
        
        return jsonify({
            'success': True,
            'specializations': sorted(specializations)
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching specializations: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@app.route('/api/test-recommendation', methods=['GET'])
def test_recommendation():
    """
    Test endpoint with sample symptoms for demonstration.
    Useful for quick testing and debugging.
    """
    try:
        model = load_model()
        
        # Test with sample symptoms
        sample_symptoms = "chest pain, breathlessness, rapid heartbeat"
        recommendations = model.recommend(sample_symptoms, top_k=3)
        
        return jsonify({
            'success': True,
            'message': 'Test recommendation successful',
            'input_symptoms': sample_symptoms,
            'recommendations': recommendations
        }), 200
    
    except Exception as e:
        logger.error(f"Error in test endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


if __name__ == '__main__':
    # Run Flask app in development mode
    # For production, use gunicorn: gunicorn -w 4 -b 0.0.0.0:5000 app.py
    print("Starting AI Doctor Recommendation Service...")
    print("Available endpoints:")
    print("  POST /api/recommend-doctor - Get top 3 doctor recommendations")
    print("  POST /api/recommend-doctor-detailed - Get recommendations with explanations")
    print("  GET /api/specializations - List all specializations")
    print("  GET /api/test-recommendation - Test with sample data")
    print("  GET /health - Health check")
    print("\nServer running on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
