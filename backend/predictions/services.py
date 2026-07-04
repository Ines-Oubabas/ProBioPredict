"""
Inference service abstraction.

Keep this contract stable:
- input: list[dict] rows
- output: list[dict] normalized inference results

Real ML model is now integrated using TensorFlow Lite.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# pylint: disable=wrong-import-position,import-error
from ml_engine.predict import predict_from_sequence


def run_inference(rows):
    """
    Public inference entrypoint used by views.
    Uses the real TFLite model for predictions.
    """
    results = []

    for item in rows:
        sequence = item["truncated_dna"].upper()

        if len(sequence) < 1000:
            sequence = sequence.ljust(1000, "A")
        elif len(sequence) > 1000:
            sequence = sequence[:1000]

        prediction = predict_from_sequence(sequence)

        predicted_class = (
            "probiotic"
            if prediction["result"] == "PROBIOTIQUE"
            else "non-probiotic"
        )

        results.append({
            "sequence_id": item["sequence_id"],
            "predicted_class": predicted_class,
            "confidence": prediction["probability"],
            "raw_output": {
                "source": "tflite_model",
                "probability": prediction["probability"],
                "confidence": prediction["confidence"],
            },
        })

    return results