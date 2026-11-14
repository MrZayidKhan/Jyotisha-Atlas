import unittest
from fastapi.testclient import TestClient
from backend.main import app

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.birth = dict(name='Fixture', date='2000-01-01', time='12:00', place='Greenwich', lat=51.48, lon=0, offset=0, unknown=False)

    def test_chart_and_validation(self):
        response = self.client.post('/api/chart', json=self.birth)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(response.json()['placements']), 9)
        self.assertEqual(self.client.post('/api/chart', json={**self.birth, 'lat': 90}).status_code, 422)

    def test_configuration_and_unknown_time(self):
        self.assertEqual(self.client.get('/api/health').status_code, 200)
        response = self.client.post('/api/chart', json={**self.birth, 'time': '', 'unknown': True})
        self.assertIsNone(response.json()['lagna'])
        self.assertTrue(all(p['house'] is None for p in response.json()['placements']))

if __name__ == '__main__':
    unittest.main()
