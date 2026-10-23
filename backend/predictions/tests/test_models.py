from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from ..models import Prediction, PredictionResult


User = get_user_model()


class PredictionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123",
        )

    def create_prediction(self):
        return Prediction.objects.create(
            user=self.user,
            file_name="test.csv",
            status=Prediction.STATUS_PENDING,
            row_count=1,
        )

    def create_result(self, prediction, sequence_id="TEST1"):
        return PredictionResult.objects.create(
            prediction=prediction,
            sequence_id=sequence_id,
            predicted_class="probiotic",
            confidence=0.87,
            raw_output={"source": "test"},
        )

    def test_create_prediction(self):
        prediction = self.create_prediction()
        prediction.refresh_from_db()

        self.assertEqual(prediction.user, self.user)
        self.assertEqual(prediction.file_name, "test.csv")
        self.assertEqual(prediction.status, Prediction.STATUS_PENDING)
        self.assertEqual(prediction.row_count, 1)

    def test_create_single_prediction_result(self):
        prediction = self.create_prediction()
        result = self.create_result(prediction)
        result.refresh_from_db()

        self.assertEqual(result.prediction, prediction)
        self.assertEqual(result.sequence_id, "TEST1")
        self.assertEqual(result.predicted_class, "probiotic")
        self.assertAlmostEqual(result.confidence, 0.87)
        self.assertEqual(result.raw_output, {"source": "test"})
        self.assertEqual(
            PredictionResult.objects.filter(prediction=prediction).count(),
            1,
        )

    def test_cannot_create_second_result_for_same_prediction(self):
        prediction = self.create_prediction()
        first_result = self.create_result(prediction)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.create_result(prediction, sequence_id="TEST2")

        self.assertEqual(
            PredictionResult.objects.filter(prediction=prediction).count(),
            1,
        )
        self.assertTrue(
            PredictionResult.objects.filter(pk=first_result.pk).exists()
        )

    def test_singular_reverse_access(self):
        prediction = self.create_prediction()
        result = self.create_result(prediction)

        reloaded_prediction = Prediction.objects.get(pk=prediction.pk)

        self.assertEqual(reloaded_prediction.result, result)

    def test_pending_prediction_can_have_no_result(self):
        prediction = self.create_prediction()

        with self.assertRaises(PredictionResult.DoesNotExist):
            _ = prediction.result

    def test_deleting_prediction_cascades_to_its_result(self):
        prediction = self.create_prediction()
        result = self.create_result(prediction)
        prediction_id = prediction.pk
        result_id = result.pk

        other_prediction = self.create_prediction()
        other_result = self.create_result(
            other_prediction,
            sequence_id="OTHER",
        )

        prediction.delete()

        self.assertFalse(
            Prediction.objects.filter(pk=prediction_id).exists()
        )
        self.assertFalse(
            PredictionResult.objects.filter(pk=result_id).exists()
        )
        self.assertTrue(
            Prediction.objects.filter(pk=other_prediction.pk).exists()
        )
        self.assertTrue(
            PredictionResult.objects.filter(pk=other_result.pk).exists()
        )
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())