# backend/predictions/services.py

"""
Inference service abstraction.

For now this module returns mocked predictions.
Later, replace run_inference implementation with real ML inference logic
without changing the API view structure.
"""


def run_inference(rows):
    """
    rows: list[dict] with at least:
      - sequence_id
      - truncated_dna

    Returns:
      list[dict] with:
      - sequence_id
      - predicted_class
      - confidence
      - raw_output (optional)
    """
    return [
        {
            "sequence_id": item["sequence_id"],
            "predicted_class": "mock_safe",
            "confidence": 0.95,
            "raw_output": {
                "source": "mock_inference_service",
                "note": "Real ML model not integrated yet.",
            },
        }
        for item in rows
    ]
