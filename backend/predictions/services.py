"""
Inference service abstraction.

Keep this contract stable:
- input: list[dict] rows
- output: list[dict] normalized inference results

Real ML model is now integrated using TensorFlow Lite.
"""

import sys
sys.path.append('/mnt/c/Users/Aicha/github/ProBioPredict')
from ml_engine.predict import predict_from_sequence


def run_inference(rows):
    """
    Public inference entrypoint used by views.
    Uses the real TFLite model for predictions.
    """
    results = []
    
    for item in rows:
        sequence = item["truncated_dna"].upper()
        
        # Le modèle attend 1000 pb exactement
        if len(sequence) < 1000:
            # Padder avec des 'A' si trop court
            sequence = sequence.ljust(1000, 'A')
        elif len(sequence) > 1000:
            # Tronquer si trop long
            sequence = sequence[:1000]
        
        # Prédiction avec votre modèle
        prediction = predict_from_sequence(sequence)
        
        # Convertir le résultat au format attendu par l'application
        predicted_class = 'probiotic' if prediction['result'] == 'PROBIOTIQUE' else 'non-probiotic'
        
        results.append({
            "sequence_id": item["sequence_id"],
            "predicted_class": predicted_class,
            "confidence": prediction['probability'],
            "raw_output": {
                "source": "tflite_model",
                "probability": prediction['probability'],
                "confidence": prediction['confidence']
            },
        })
    
    return results