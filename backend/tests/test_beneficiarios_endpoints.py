import requests
import json
from datetime import datetime, timedelta
import random
import sys

# Configuración base
BASE_URL = 'http://localhost:5000/api/beneficiarios'
LOGIN_URL = 'http://localhost:5000/api/auth/login'

def obtener_token(email, password):
    """Obtener token JWT para autenticación"""
    payload = {
        'email': email,
        'password': password
    }
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(LOGIN_URL, data=json.dumps(payload), headers=headers)
        
        print(f"Respuesta de login para {email}: {response.status_code}")
        print(f"Contenido de respuesta: {response.text}")
        
        if response.status_code == 200:
            return response.json()['access_token']
        else:
            print(f"Error al obtener token: {response.text}")
            return None
    except Exception as e:
        print(f"Excepción al iniciar sesión: {e}")
        return None

def generar_beneficiarios_prueba(token):
    """Generar beneficiarios de prueba"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Datos de ejemplo para beneficiarios
    beneficiarios = [
        {
            "nombre_completo": f"Beneficiario {i}",
            "tipo_documento": random.choice(["CC", "TI", "CE"]),
            "numero_documento": f"123{i}456",
            "genero": random.choice(["M", "F", "O"]),
            "edad": random.randint(10, 70),
            "celular": f"3{random.randint(10, 99)}123{i}456",
            "etnia": random.choice(["Indígena", "Afrodescendiente", "Mestizo", "Otro"]),
            "barrio": f"Barrio {i}",
            "discapacidad": random.choice([True, False]),
            "tipo_discapacidad": random.choice(["Física", "Visual", "Auditiva", "Ninguna"]),
            "victima": random.choice([True, False]),
            "hijos_a_cargo": random.randint(0, 5),
            "estudia": random.choice([True, False]),
            "nivel_educativo": random.choice(["Primaria", "Secundaria", "Universitario", "Ninguno"]),
            "situacion_laboral": random.choice(["Empleado", "Desempleado", "Estudiante", "Independiente"]),
            "tipo_vivienda": random.choice(["Propia", "Arrendada", "Familiar"]),
            "email": f"beneficiario{i}@ejemplo.com",
            "fecha_registro": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
        }
        for i in range(50)  # Generar 50 beneficiarios de prueba
    ]
    
    # Registrar cada beneficiario
    for beneficiario in beneficiarios:
        response = requests.post(f'{BASE_URL}/registrar', 
                                 headers=headers, 
                                 data=json.dumps(beneficiario))
        if response.status_code != 201:
            print(f"Error al registrar beneficiario: {response.text}")

def test_beneficiarios_por_mes(token):
    """Probar endpoint de beneficiarios por mes"""
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(f'{BASE_URL}/estadisticas/por-mes', headers=headers)
    
    print("Beneficiarios por Mes:")
    if response.status_code == 200:
        datos = response.json()
        for mes in datos:
            print(f"{mes['mes']}: {mes['cantidad']} beneficiarios")
    else:
        print(f"Error: {response.text}")

def test_poblaciones_vulnerables(token):
    """Probar endpoint de poblaciones vulnerables"""
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(f'{BASE_URL}/estadisticas/poblaciones-vulnerables', headers=headers)
    
    print("\nPoblaciones Vulnerables:")
    if response.status_code == 200:
        datos = response.json()
        for poblacion in datos:
            print(f"{poblacion['poblacion']}: {poblacion['cantidad']} beneficiarios")
    else:
        print(f"Error: {response.text}")

def main():
    # Credenciales de prueba actualizadas
    credenciales = [
        {'email': 'admin@redinclusion.com', 'password': 'admin123'},
        {'email': 'funcionario@redinclusion.com', 'password': 'funcionario123'}
    ]
    
    for cred in credenciales:
        print(f"\nProbando con email: {cred['email']}")
        token = obtener_token(cred['email'], cred['password'])
        
        if token:
            # Generar beneficiarios de prueba
            generar_beneficiarios_prueba(token)
            
            # Probar endpoints de estadísticas
            test_beneficiarios_por_mes(token)
            test_poblaciones_vulnerables(token)
        else:
            print(f"No se pudo obtener el token para {cred['email']}")

if __name__ == '__main__':
    main()
