from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import sys

# Obtener la ruta del directorio del proyecto
proyecto_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, proyecto_dir)

# Configuración de conexión a MongoDB
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'red_inclusion'

def listar_usuarios():
    try:
        # Conectar a MongoDB
        print("Intentando conectar a MongoDB...")
        client = MongoClient(MONGO_URI)
        print("Conexión establecida.")
        
        # Listar bases de datos disponibles
        print("\nBases de datos disponibles:")
        print(client.list_database_names())
        
        # Seleccionar base de datos
        db = client[DB_NAME]
        print(f"\nBase de datos seleccionada: {DB_NAME}")
        
        # Listar colecciones
        print("\nColecciones disponibles:")
        print(db.list_collection_names())
        
        # Obtener colección de funcionarios
        funcionarios = db['funcionarios']
        
        # Contar usuarios
        total_usuarios = funcionarios.count_documents({})
        print(f"\nNúmero total de usuarios: {total_usuarios}")
        
        # Listar todos los usuarios
        print("\nDetalles de usuarios:")
        for usuario in funcionarios.find({}, {'password': 0}):  # Excluir contraseñas
            print(f"ID: {usuario.get('_id', 'Sin ID')}")
            print(f"Nombre: {usuario.get('nombre', 'Sin nombre')}")
            print(f"Email: {usuario.get('email', 'Sin email')}")
            print(f"Rol: {usuario.get('rol', 'Sin rol')}")
            print("---")
    
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    listar_usuarios()
