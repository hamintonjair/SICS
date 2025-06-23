from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from bson.objectid import ObjectId
import os
import sys

# Obtener la ruta del directorio del proyecto
proyecto_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, proyecto_dir)

# Importar configuración
from config import get_config

# Obtener configuración
config = get_config()

def inicializar_base_datos():
    try:
        # Conectar a MongoDB
        client = MongoClient(config.MONGO_URI)
        db = client[config.DATABASE_NAME]
        
        # Crear colección de funcionarios si no existe
        funcionarios = db['funcionarios']
        
        # Verificar si ya existe un usuario admin
        admin_existente = funcionarios.find_one({'email': 'admin@redinclusion.com'})
        if admin_existente:
            print("Ya existe un usuario administrador.")
            return
        
        # Crear usuario administrador
        usuario_admin = {
            '_id': ObjectId(),
            'nombre': 'Administrador',
            'email': 'admin@redinclusion.com',
            'password': generate_password_hash('admin123'),
            'rol': 'admin',
            'linea_trabajo': 'Administración General'
        }
        
        # Crear usuario funcionario
        usuario_funcionario = {
            '_id': ObjectId(),
            'nombre': 'Funcionario Principal',
            'email': 'funcionario@redinclusion.com',
            'password': generate_password_hash('funcionario123'),
            'rol': 'usuario',
            'linea_trabajo': 'Inclusión Social'
        }
        
        # Insertar usuarios
        funcionarios.insert_many([usuario_admin, usuario_funcionario])
        
        print("Base de datos inicializada con éxito.")
        print("Usuarios creados:")
        print(f"1. Admin: {usuario_admin['email']}")
        print(f"2. Funcionario: {usuario_funcionario['email']}")
    
    except Exception as e:
        print(f"Error al inicializar base de datos: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    inicializar_base_datos()
