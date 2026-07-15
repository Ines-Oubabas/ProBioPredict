from django.test import TestCase

# Create your tests here.
from django.test import TestCase
from unittest.mock import patch, MagicMock
from .services import run_inference

class RunInferenceTest(TestCase):
    """Tests de la fonction run_inference()"""

    @patch('predictions.services.predict_from_sequence')
    def test_run_inference_returns_results(self, mock_predict):
        """
        Teste que run_inference() retourne bien les résultats
        avec les bons champs.
        """
        # Simulation du retour du modèle
        mock_predict.return_value = {
            'success': True,
            'result': 'PROBIOTIQUE',
            'probability': 0.87,
            'confidence': 0.87
        }

        rows = [
            {"sequence_id": "TEST1", "truncated_dna": "A" * 1000},
            {"sequence_id": "TEST2", "truncated_dna": "C" * 1000}
        ]

        results = run_inference(rows)

        # Vérifications
        self.assertEqual(len(results), 2)
        for result in results:
            self.assertIn("sequence_id", result)
            self.assertIn("predicted_class", result)
            self.assertIn("confidence", result)
            self.assertIsInstance(result["confidence"], float)

    @patch('predictions.services.predict_from_sequence')
    def test_run_inference_classification(self, mock_predict):
        """
        Teste que la classification est correcte.
        """
        # Simulation d'une prédiction PROBIOTIQUE
        mock_predict.return_value = {
            'success': True,
            'result': 'PROBIOTIQUE',
            'probability': 0.75,
            'confidence': 0.75
        }

        rows = [{"sequence_id": "TEST", "truncated_dna": "A" * 1000}]
        results = run_inference(rows)

        self.assertEqual(results[0]["predicted_class"], "probiotic")

        # Simulation d'une prédiction NON PROBIOTIQUE
        mock_predict.return_value = {
            'success': True,
            'result': 'NON PROBIOTIQUE',
            'probability': 0.23,
            'confidence': 0.77
        }

        results = run_inference(rows)
        self.assertEqual(results[0]["predicted_class"], "non-probiotic")