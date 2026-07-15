from django.test import TestCase
from unittest.mock import patch
from ..services import run_inference

class RunInferenceTest(TestCase):
    @patch('predictions.services.predict_from_sequence')
    def test_run_inference_returns_results(self, mock_predict):
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
        self.assertEqual(len(results), 2)

    @patch('predictions.services.predict_from_sequence')
    def test_normalization_short_sequence(self, mock_predict):
        mock_predict.return_value = {
            'success': True,
            'result': 'PROBIOTIQUE',
            'probability': 0.80,
            'confidence': 0.80
        }

        rows = [{"sequence_id": "SHORT", "truncated_dna": "A" * 500}]
        results = run_inference(rows)

        mock_predict.assert_called_once()
        seq = mock_predict.call_args[0][0]
        self.assertEqual(len(seq), 1000)