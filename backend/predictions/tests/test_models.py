from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import Prediction, PredictionResult

User = get_user_model()

class PredictionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )

    def test_create_prediction(self):
        prediction = Prediction.objects.create(
            user=self.user,
            file_name='test.csv',
            status='pending'
        )
        self.assertEqual(prediction.user, self.user)
        self.assertEqual(prediction.status, 'pending')
        self.assertEqual(prediction.file_name, 'test.csv')