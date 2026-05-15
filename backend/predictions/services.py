# backend/predictions/services.py

"""
Inference service abstraction.

Keep this contract stable:
- input: list[dict] rows
- output: list[dict] normalized inference results

When the real ML model is ready, replace internals of run_inference()
(or delegate to a dedicated module) without changing API views.
"""


def _mock_inference(rows):
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


def run_inference(rows):
    """
    Public inference entrypoint used by views.
    Future real model should be wired here.
    """
    # Future switch example:
    # from .services_inference import run_real_inference
    # return run_real_inference(rows)
    return _mock_inference(rows)