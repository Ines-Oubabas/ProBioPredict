import tensorflow as tf
import numpy as np
import os
import pandas as pd
import io

# Charger le modèle TFLite
model_path = os.path.join(os.path.dirname(__file__), 'modele_ancien.tflite')
interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def one_hot_encode_sequence(sequence, max_len=1000):
    """Convertir une séquence ADN en encodage one-hot"""
    mapping = {'A': 0, 'T': 1, 'G': 2, 'C': 3}
    encoded = np.zeros((1, max_len, 4), dtype=np.float32)
    for i, base in enumerate(sequence[:max_len]):
        if base in mapping:
            encoded[0, i, mapping[base]] = 1
        else:
            encoded[0, i, :] = 0.25
    return encoded

def predict_from_sequence(sequence):
    """Prédire à partir d'une seule séquence ADN (string)"""
    if len(sequence) != 1000:
        return {
            'success': False,
            'error': f'La séquence doit faire 1000 pb (reçu: {len(sequence)})'
        }
    
    encoded = one_hot_encode_sequence(sequence)
    interpreter.set_tensor(input_details[0]['index'], encoded)
    interpreter.invoke()
    proba = interpreter.get_tensor(output_details[0]['index'])[0][0]
    
    is_probiotic = proba >= 0.5
    
    return {
        'success': True,
        'result': 'PROBIOTIQUE' if is_probiotic else 'NON PROBIOTIQUE',
        'probability': float(proba),
        'confidence': float(proba if is_probiotic else 1 - proba)
    }

def predict_from_csv(csv_content):
    """Prédire à partir d'un fichier CSV"""
    if isinstance(csv_content, str) and os.path.exists(csv_content):
        df = pd.read_csv(csv_content)
    else:
        df = pd.read_csv(io.StringIO(csv_content))
    
    if 'sequence' not in df.columns:
        return {
            'success': False,
            'error': "Le CSV doit contenir une colonne 'sequence'"
        }
    
    results = []
    for idx, row in df.iterrows():
        sequence = str(row['sequence']).strip().upper()
        pred = predict_from_sequence(sequence)
        results.append({
            'row': idx,
            'sequence_preview': sequence[:50] + '...' if len(sequence) > 50 else sequence,
            'result': pred.get('result'),
            'probability': pred.get('probability')
        })
    
    probiotiques = sum(1 for r in results if r.get('result') == 'PROBIOTIQUE')
    
    return {
        'success': True,
        'total': len(df),
        'probiotiques': probiotiques,
        'non_probiotiques': len(df) - probiotiques,
        'results': results
    }

def predict(input_data):
    """Fonction principale - accepte séquence ou CSV"""
    if isinstance(input_data, str):
        if len(input_data) == 1000 and set(input_data.upper()).issubset({'A', 'T', 'G', 'C'}):
            return predict_from_sequence(input_data)
        else:
            return predict_from_csv(input_data)
    else:
        return predict_from_csv(input_data)

# Test si exécuté directement
if __name__ == '__main__':
    print("🔬 Test du modèle TFLite...")
    test_seq = 'A' * 1000
    result = predict(test_seq)
    print("Résultat du test :")
    print(result)