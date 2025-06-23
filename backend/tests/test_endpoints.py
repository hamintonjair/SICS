import unittest
import json
from app import create_app
from flask_jwt_extended import create_access_token

class TestEndpoints(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

        # Crear token de prueba
        with self.app.app_context():
            self.test_token = create_access_token({
                'sub': 'test_user',
                'rol': 'admin'
            })

    def test_login_endpoint(self):
        # Prueba de inicio de sesión
        response = self.client.post('/api/auth/login', json={
            'email': 'admin@example.com',
            'password': 'password123'
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)

    def test_lineas_trabajo_endpoint(self):
        # Prueba de obtener líneas de trabajo
        headers = {
            'Authorization': f'Bearer {self.test_token}'
        }
        response = self.client.get('/api/lineas-trabajo/listar', headers=headers)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)

    def test_beneficiarios_endpoint(self):
        # Prueba de obtener beneficiarios
        headers = {
            'Authorization': f'Bearer {self.test_token}'
        }
        response = self.client.get('/api/beneficiarios/listar', headers=headers)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)

    def test_unauthorized_access(self):
        # Prueba de acceso sin autenticación
        response = self.client.get('/api/lineas-trabajo/listar')
        self.assertEqual(response.status_code, 401)

    def test_crear_linea_trabajo(self):
        # Prueba de crear línea de trabajo
        headers = {
            'Authorization': f'Bearer {self.test_token}',
            'Content-Type': 'application/json'
        }
        data = {
            'nombre': 'Línea de Prueba',
            'descripcion': 'Descripción de prueba'
        }
        
        response = self.client.post(
            '/api/lineas-trabajo/crear', 
            data=json.dumps(data), 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 201)
        result = json.loads(response.data)
        self.assertIn('id', result)

if __name__ == '__main__':
    unittest.main()
