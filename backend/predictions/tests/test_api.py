# backend/predictions/tests/test_api.py
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from ..models import Prediction
import io
import csv

User = get_user_model()

class PredictionAPITest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_upload_valid_csv(self):
        # Création du CSV en mémoire avec un nom de fichier et un type MIME
        csv_content = io.StringIO()
        writer = csv.writer(csv_content)
        writer.writerow(['sequence_id', 'truncated_dna'])
        writer.writerow(['TEST1', 'A' * 1000])
        writer.writerow(['TEST2', 'C' * 1000])
        csv_content.seek(0)

        # Création d'un fichier uploadé avec nom et type MIME
        csv_file = SimpleUploadedFile(
            'test.csv',
            csv_content.getvalue().encode('utf-8'),
            content_type='text/csv'
        )

        response = self.client.post(
            '/api/predictions/upload/',
            {'dna_file': csv_file},
            format='multipart'
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)

    def test_upload_invalid_csv(self):
        csv_content = io.StringIO()
        writer = csv.writer(csv_content)
        writer.writerow(['sequence_id', 'wrong_column'])
        writer.writerow(['TEST1', 'A' * 1000])
        csv_content.seek(0)

        csv_file = SimpleUploadedFile(
            'invalid.csv',
            csv_content.getvalue().encode('utf-8'),
            content_type='text/csv'
        )

        response = self.client.post(
            '/api/predictions/upload/',
            {'dna_file': csv_file},
            format='multipart'
        )

        self.assertEqual(response.status_code, 400)