import csv
import io
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from billing.models import UserSubscription
from ..models import Prediction, PredictionResult


User = get_user_model()


@override_settings(
    PREDICTION_FREE_PLAN_LIMIT=3,
    PREDICTION_PRO_PLAN_LIMIT=100,
    PREDICTION_LAB_PLAN_LIMIT=0,
    PREDICTION_UPLOAD_MAX_BYTES=512 * 1024,
    PREDICTION_UPLOAD_ALLOWED_EXTENSIONS=[".csv"],
    PREDICTION_UPLOAD_ALLOWED_MIME_TYPES=["text/csv"],
    PREDICTION_UPLOAD_EXPECTED_COLUMNS=[
        "sequence_id",
        "truncated_dna",
    ],
)
class PredictionAPITest(TestCase):
    upload_url = "/api/predictions/upload/"
    history_url = "/api/predictions/history/"
    dashboard_url = "/api/predictions/dashboard-summary/"
    email_url = "/api/predictions/send-result-email/"
    direct_url = "/api/predictions/predict/"

    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123",
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="password123",
        )

        self.subscription = UserSubscription.objects.create(
            user=self.user,
            plan=UserSubscription.PLAN_FREE,
            status=UserSubscription.STATUS_FREE,
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        inference_patcher = patch("predictions.views.run_inference")
        self.mock_inference = inference_patcher.start()
        self.addCleanup(inference_patcher.stop)
        self.mock_inference.return_value = [
            {
                "sequence_id": "TEST1",
                "predicted_class": "probiotic",
                "confidence": 0.87,
                "raw_output": {"source": "test"},
            }
        ]

    def make_csv(self, rows=None, columns=None):
        if rows is None:
            rows = [("TEST1", "A" * 1000)]
        if columns is None:
            columns = ["sequence_id", "truncated_dna"]

        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerow(columns)
        writer.writerows(rows)

        return SimpleUploadedFile(
            "test.csv",
            stream.getvalue().encode("utf-8"),
            content_type="text/csv",
        )

    def upload(self, csv_file=None):
        if csv_file is None:
            csv_file = self.make_csv()

        return self.client.post(
            self.upload_url,
            {"dna_file": csv_file},
            format="multipart",
        )

    def create_prediction(self, user=None, with_result=True):
        if user is None:
            user = self.user

        prediction = Prediction.objects.create(
            user=user,
            file_name="stored.csv",
            row_count=1,
            model_mode=Prediction.MODEL_MODE_REAL,
            status=(
                Prediction.STATUS_COMPLETED
                if with_result
                else Prediction.STATUS_PENDING
            ),
        )

        if with_result:
            PredictionResult.objects.create(
                prediction=prediction,
                sequence_id="STORED",
                predicted_class="probiotic",
                confidence=0.87,
            )

        return prediction

    def set_subscription(self, plan, subscription_status):
        self.subscription.plan = plan
        self.subscription.status = subscription_status
        self.subscription.save(update_fields=["plan", "status"])

    def assert_no_prediction_saved(self):
        self.assertEqual(Prediction.objects.count(), 0)
        self.assertEqual(PredictionResult.objects.count(), 0)

    def test_upload_one_sequence_creates_one_prediction_and_one_result(self):
        response = self.upload()

        self.assertEqual(response.status_code, 200)
        self.assertIn("result", response.data)
        self.assertNotIn("results", response.data)
        self.assertIsInstance(response.data["result"], dict)
        self.assertEqual(response.data["result"]["sequence_id"], "TEST1")
        self.assertEqual(response.data["result"]["predicted_class"], "probiotic")
        self.assertAlmostEqual(response.data["result"]["confidence"], 0.87)
        self.assertEqual(response.data["summary"]["rows_received"], 1)

        self.assertEqual(Prediction.objects.count(), 1)
        self.assertEqual(PredictionResult.objects.count(), 1)

        prediction = Prediction.objects.get()
        self.assertEqual(prediction.user, self.user)
        self.assertEqual(prediction.status, Prediction.STATUS_COMPLETED)
        self.assertEqual(prediction.model_mode, Prediction.MODEL_MODE_REAL)
        self.assertEqual(prediction.row_count, 1)
        self.assertEqual(prediction.result.sequence_id, "TEST1")
        self.assertEqual(
            response.data["summary"]["prediction_id"],
            prediction.pk,
        )
        self.assertEqual(response.data["plan"]["used"], 1)
        self.assertEqual(response.data["plan"]["remaining"], 2)

        self.mock_inference.assert_called_once_with(
            [{"sequence_id": "TEST1", "truncated_dna": "A" * 1000}]
        )

    @override_settings(PREDICTION_UPLOAD_MAX_ROWS=5000)
    def test_upload_two_sequences_rejected_even_if_config_allows_more(self):
        response = self.upload(
            self.make_csv(
                rows=[
                    ("TEST1", "A" * 1000),
                    ("TEST2", "C" * 1000),
                ]
            )
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("exactly one data row", response.data["detail"])
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_empty_csv_rejected(self):
        csv_file = SimpleUploadedFile(
            "empty.csv",
            b"",
            content_type="text/csv",
        )

        response = self.upload(csv_file)

        self.assertEqual(response.status_code, 400)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_header_without_data_rejected(self):
        response = self.upload(self.make_csv(rows=[]))

        self.assertEqual(response.status_code, 400)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_wrong_columns_rejected(self):
        response = self.upload(
            self.make_csv(
                columns=["sequence_id", "wrong_column"],
            )
        )

        self.assertEqual(response.status_code, 400)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_extra_csv_field_rejected(self):
        response = self.upload(
            self.make_csv(rows=[("TEST1", "A" * 1000, "unexpected")])
        )

        self.assertEqual(response.status_code, 400)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_invalid_dna_rejected(self):
        response = self.upload(
            self.make_csv(rows=[("TEST1", "ACGTN")])
        )

        self.assertEqual(response.status_code, 400)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_csv_injection_rejected(self):
        response = self.upload(
            self.make_csv(rows=[("=FORMULA", "A" * 1000)])
        )

        self.assertEqual(response.status_code, 400)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_multiple_files_rejected(self):
        response = self.client.post(
            self.upload_url,
            {"dna_file": [self.make_csv(), self.make_csv()]},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_upload_without_authentication_rejected(self):
        self.client.force_authenticate(user=None)

        response = self.upload()

        self.assertEqual(response.status_code, 401)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_empty_or_multiple_inference_results_roll_back(self):
        valid_result = self.mock_inference.return_value[0]

        for inference_results in ([], [valid_result, valid_result]):
            with self.subTest(result_count=len(inference_results)):
                self.mock_inference.return_value = inference_results

                response = self.upload()

                self.assertEqual(response.status_code, 503)
                self.assert_no_prediction_saved()

    def test_invalid_inference_result_rolls_back(self):
        self.mock_inference.return_value = [
            {
                "sequence_id": "WRONG",
                "predicted_class": "probiotic",
                "confidence": 0.87,
            }
        ]

        response = self.upload()

        self.assertEqual(response.status_code, 503)
        self.assert_no_prediction_saved()

    def test_inference_exception_rolls_back_without_consuming_quota(self):
        self.mock_inference.side_effect = RuntimeError("Simulated failure")

        response = self.upload()

        self.assertEqual(response.status_code, 503)
        self.assert_no_prediction_saved()

        dashboard = self.client.get(self.dashboard_url)
        self.assertEqual(dashboard.data["plan"]["used"], 0)
        self.assertEqual(dashboard.data["plan"]["remaining"], 3)

    def test_free_plan_blocks_upload_at_limit(self):
        for _ in range(3):
            self.create_prediction()

        response = self.upload()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["plan"]["key"], "free")
        self.assertEqual(response.data["plan"]["used"], 3)
        self.assertEqual(response.data["plan"]["remaining"], 0)
        self.mock_inference.assert_not_called()
        self.assertEqual(Prediction.objects.count(), 3)

    def test_predictions_of_other_user_do_not_consume_quota(self):
        for _ in range(3):
            self.create_prediction(user=self.other_user)

        response = self.upload()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["plan"]["used"], 1)
        self.assertEqual(
            Prediction.objects.filter(user=self.user).count(),
            1,
        )

    @override_settings(PREDICTION_PRO_PLAN_LIMIT=4)
    def test_active_pro_plan_uses_its_limit(self):
        self.set_subscription(
            UserSubscription.PLAN_PRO,
            UserSubscription.STATUS_ACTIVE,
        )
        for _ in range(3):
            self.create_prediction()

        accepted = self.upload()
        refused = self.upload()

        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(accepted.data["plan"]["key"], "pro")
        self.assertEqual(accepted.data["plan"]["limit"], 4)
        self.assertEqual(refused.status_code, 403)
        self.assertEqual(Prediction.objects.filter(user=self.user).count(), 4)
        self.mock_inference.assert_called_once()

    def test_active_lab_plan_is_unlimited(self):
        self.set_subscription(
            UserSubscription.PLAN_LAB,
            UserSubscription.STATUS_ACTIVE,
        )
        for _ in range(3):
            self.create_prediction()

        response = self.upload()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["plan"]["key"], "lab")
        self.assertTrue(response.data["plan"]["is_unlimited"])
        self.assertIsNone(response.data["plan"]["limit"])
        self.assertIsNone(response.data["plan"]["remaining"])
        self.assertEqual(response.data["plan"]["used"], 4)

    @override_settings(PREDICTION_LAB_PLAN_LIMIT=2)
    def test_lab_plan_respects_configured_finite_limit(self):
        self.set_subscription(
            UserSubscription.PLAN_LAB,
            UserSubscription.STATUS_ACTIVE,
        )
        for _ in range(2):
            self.create_prediction()

        response = self.upload()

        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.data["plan"]["is_unlimited"])
        self.assertEqual(response.data["plan"]["limit"], 2)
        self.mock_inference.assert_not_called()

    def test_inactive_paid_plan_falls_back_to_free_limit(self):
        self.set_subscription(
            UserSubscription.PLAN_PRO,
            UserSubscription.STATUS_CANCELED,
        )
        for _ in range(3):
            self.create_prediction()

        response = self.upload()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["plan"]["key"], "free")
        self.assertEqual(response.data["plan"]["limit"], 3)
        self.mock_inference.assert_not_called()

    def test_detail_and_history_return_singular_result_and_only_owned_data(self):
        own_prediction = self.create_prediction()
        self.create_prediction(user=self.other_user)

        detail = self.client.get(
            f"/api/predictions/{own_prediction.pk}/"
        )
        history = self.client.get(self.history_url)

        self.assertEqual(detail.status_code, 200)
        self.assertIsInstance(detail.data["result"], dict)
        self.assertNotIn("results", detail.data)
        self.assertEqual(
            detail.data["result"]["id"],
            own_prediction.result.pk,
        )

        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.data["count"], 1)
        item = history.data["predictions"][0]
        self.assertEqual(item["id"], own_prediction.pk)
        self.assertIsInstance(item["result"], dict)
        self.assertNotIn("results", item)

    def test_other_users_prediction_cannot_be_read_pinned_or_deleted(self):
        other_prediction = self.create_prediction(user=self.other_user)
        base_url = f"/api/predictions/{other_prediction.pk}"

        detail = self.client.get(f"{base_url}/")
        pin = self.client.patch(
            f"{base_url}/pin/",
            {"is_pinned": True},
            format="json",
        )
        deletion = self.client.delete(f"{base_url}/delete/")

        self.assertEqual(detail.status_code, 404)
        self.assertEqual(pin.status_code, 404)
        self.assertEqual(deletion.status_code, 404)

        other_prediction.refresh_from_db()
        self.assertFalse(other_prediction.is_pinned)
        self.assertTrue(
            PredictionResult.objects.filter(
                prediction=other_prediction
            ).exists()
        )

    def test_prediction_without_result_is_handled(self):
        prediction = self.create_prediction(with_result=False)

        detail = self.client.get(
            f"/api/predictions/{prediction.pk}/"
        )
        history = self.client.get(self.history_url)
        dashboard = self.client.get(self.dashboard_url)

        self.assertEqual(detail.status_code, 200)
        self.assertIsNone(detail.data["result"])

        self.assertEqual(history.status_code, 200)
        self.assertIsNone(history.data["predictions"][0]["result"])

        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(
            dashboard.data["latest_prediction"]["id"],
            prediction.pk,
        )
        self.assertIsNone(dashboard.data["latest_result"])
        self.assertEqual(dashboard.data["recent_history"], [])

    def test_dashboard_returns_one_history_item_per_owned_prediction(self):
        prediction = self.create_prediction()
        self.create_prediction(user=self.other_user)

        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["latest_result"]["prediction_id"],
            prediction.pk,
        )
        self.assertEqual(len(response.data["recent_history"]), 1)
        self.assertEqual(
            response.data["recent_history"][0]["prediction_id"],
            prediction.pk,
        )
        self.assertEqual(response.data["plan"]["used"], 1)

    def test_pin_and_unpin_preserved(self):
        prediction = self.create_prediction()
        url = f"/api/predictions/{prediction.pk}/pin/"

        for desired in (True, False):
            with self.subTest(is_pinned=desired):
                response = self.client.patch(
                    url,
                    {"is_pinned": desired},
                    format="json",
                )

                self.assertEqual(response.status_code, 200)
                prediction.refresh_from_db()
                self.assertEqual(prediction.is_pinned, desired)

    def test_pin_requires_boolean(self):
        prediction = self.create_prediction()

        response = self.client.patch(
            f"/api/predictions/{prediction.pk}/pin/",
            {"is_pinned": "true"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        prediction.refresh_from_db()
        self.assertFalse(prediction.is_pinned)

    def test_delete_cascades_and_frees_quota(self):
        predictions = [self.create_prediction() for _ in range(3)]
        prediction = predictions[0]
        result_id = prediction.result.pk

        response = self.client.delete(
            f"/api/predictions/{prediction.pk}/delete/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            PredictionResult.objects.filter(pk=result_id).exists()
        )

        upload_response = self.upload()
        self.assertEqual(upload_response.status_code, 200)
        self.assertEqual(upload_response.data["plan"]["used"], 3)

    @patch("predictions.views.send_mail")
    def test_email_uses_owned_stored_result(self, mock_send_mail):
        prediction = self.create_prediction()

        response = self.client.post(
            self.email_url,
            {
                "summary": {"prediction_id": prediction.pk},
                "result": {
                    "sequence_id": "FORGED",
                    "predicted_class": "non-probiotic",
                    "confidence": 0.01,
                },
                "submittedFileName": "forged.csv",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        mock_send_mail.assert_called_once()
        mail_arguments = mock_send_mail.call_args.kwargs
        self.assertEqual(
            mail_arguments["recipient_list"],
            [self.user.email],
        )
        self.assertIn("sequence_id=STORED", mail_arguments["message"])
        self.assertNotIn("FORGED", mail_arguments["message"])
        self.assertIn("stored.csv", mail_arguments["subject"])

    @patch("predictions.views.send_mail")
    def test_email_for_other_users_prediction_rejected(self, mock_send_mail):
        prediction = self.create_prediction(user=self.other_user)

        response = self.client.post(
            self.email_url,
            {
                "summary": {"prediction_id": prediction.pk},
                "result": {"sequence_id": "STORED"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)
        mock_send_mail.assert_not_called()

    @patch("predictions.views.send_mail")
    def test_email_without_stored_result_rejected(self, mock_send_mail):
        prediction = self.create_prediction(with_result=False)

        response = self.client.post(
            self.email_url,
            {
                "summary": {"prediction_id": prediction.pk},
                "result": {"sequence_id": "STORED"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        mock_send_mail.assert_not_called()

    @patch("predictions.views.send_mail")
    def test_email_old_results_contract_rejected(self, mock_send_mail):
        prediction = self.create_prediction()

        response = self.client.post(
            self.email_url,
            {
                "summary": {"prediction_id": prediction.pk},
                "results": [{"sequence_id": "STORED"}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        mock_send_mail.assert_not_called()

    def test_direct_endpoint_retired_without_inference_or_persistence(self):
        response = self.client.post(
            self.direct_url,
            {"sequence": "A" * 1000},
            format="json",
        )

        self.assertEqual(response.status_code, 410)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()

    def test_direct_endpoint_still_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            self.direct_url,
            {"sequence": "A" * 1000},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.mock_inference.assert_not_called()
        self.assert_no_prediction_saved()