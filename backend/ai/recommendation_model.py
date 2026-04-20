"""
AI Doctor Recommendation Model
Uses TF-IDF for fast, offline semantic understanding of symptoms
and cosine similarity for ranking specializations.
"""

import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import os

class DoctorRecommendationModel:
    """
    Recommends suitable doctor specializations based on user symptoms
    using TF-IDF embeddings and cosine similarity.
    Fully offline - no model downloads needed.
    """
    
    def __init__(self, model_name='tfidf'):
        """
        Initialize the model with TF-IDF vectorizer (offline, no downloads).
        
        Args:
            model_name: Type of model ('tfidf' is the only option, kept for compatibility)
        """
        self.specializations_data = self._load_dataset()
        self.vectorizer = TfidfVectorizer(lowercase=True, stop_words='english')
        self.specialization_embeddings = self._generate_embeddings()
    
    def _load_dataset(self):
        """Load the symptom dataset from JSON file."""
        dataset_path = os.path.join(os.path.dirname(__file__), 'dataset.json')
        with open(dataset_path, 'r') as f:
            data = json.load(f)
        return data['specializations']
    
    def _generate_embeddings(self):
        """
        Pre-compute TF-IDF embeddings for all specialization symptom sets.
        This improves performance when handling multiple recommendations.
        """
        # Collect all symptom texts for vectorization
        symptom_texts = []
        for spec in self.specializations_data:
            symptoms_text = ' '.join(spec['symptoms'])
            symptom_texts.append(symptoms_text)
        
        # Fit vectorizer on all symptoms and transform
        embeddings_matrix = self.vectorizer.fit_transform(symptom_texts).toarray()
        
        # Store embeddings indexed by specialization name
        embeddings = {}
        for i, spec in enumerate(self.specializations_data):
            specialization = spec['specialization']
            embeddings[specialization] = embeddings_matrix[i]
        
        return embeddings
    
    def recommend(self, symptoms_text, top_k=3):
        """
        Recommend specializations based on user symptoms.
        
        Args:
            symptoms_text: User's symptoms as free text (e.g., "fever, cough, cold")
            top_k: Number of top recommendations to return
        
        Returns:
            List of recommendations with specialization and confidence score
        """
        # Transform user symptoms using the same vectorizer
        user_embedding = self.vectorizer.transform([symptoms_text]).toarray()[0]
        
        # Calculate cosine similarity with each specialization
        recommendations = []
        
        for spec in self.specializations_data:
            specialization = spec['specialization']
            spec_embedding = self.specialization_embeddings[specialization]
            
            # Compute cosine similarity (ranges from 0 to 1)
            similarity = cosine_similarity(
                [user_embedding], 
                [spec_embedding]
            )[0][0]
            
            recommendations.append({
                'specialization': specialization,
                'confidence': float(similarity)
            })
        
        # Sort by confidence score in descending order
        recommendations.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Return top_k recommendations
        return recommendations[:top_k]
    
    def recommend_with_explanation(self, symptoms_text, top_k=3):
        """
        Recommend specializations with explanation of matched symptoms.
        
        Args:
            symptoms_text: User's symptoms as free text
            top_k: Number of top recommendations to return
        
        Returns:
            List of recommendations with specialization, confidence, and matched symptoms
        """
        recommendations = self.recommend(symptoms_text, top_k)
        
        # Add matched symptoms for explanation
        user_symptoms = set(
            token.lower().strip() 
            for token in symptoms_text.split(',')
        )
        
        for rec in recommendations:
            specialization = rec['specialization']
            spec_data = next(
                (s for s in self.specializations_data 
                 if s['specialization'] == specialization),
                None
            )
            
            if spec_data:
                # Find overlapping symptoms
                matched = [
                    sym for sym in spec_data['symptoms']
                    if any(user_sym in sym.lower() 
                          for user_sym in user_symptoms)
                ]
                rec['matched_symptoms'] = matched[:3]  # Top 3 matched
        
        return recommendations


def get_recommendation_model():
    """Factory function to get or create the recommendation model."""
    global _model
    if '_model' not in globals():
        _model = DoctorRecommendationModel()
    return _model
