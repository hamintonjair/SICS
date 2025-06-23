from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, get_jwt_identity, verify_jwt_in_request
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import timedelta
from functools import wraps
import logging

# Importar todos los blueprints
from .routes.auth import auth_bp
from .routes.usuarios import usuarios_bp
from .routes.beneficiarios import beneficiarios_bp
from .routes.lineas_trabajo import lineas_trabajo_bp
from .routes.asignaciones import asignaciones_bp
from .routes.reportes import reportes_bp
from .routes.funcionarios import funcionarios_bp  # Importación de blueprint de funcionarios
from .routes.comunas import comunas_bp  # Nuevo blueprint de comunas
from .routes.beneficiario import beneficiario_bp  # Importar blueprint singular
from .routes.poblacion_migrante import poblacion_migrante_bp  # Importar blueprint de población migrante
from .routes.actividad import actividad_bp  # Importar blueprint de actividades

# Importación opcional de dashboard
try:
    from .routes.dashboard import dashboard_bp
except ImportError:
    dashboard_bp = None

# Importar función de inicialización de usuario
from .routes.auth import init_admin_user

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuración de logging
    import logging
    import os

    # Crear directorio de logs si no existe
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)

    # Configurar logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, 'app.log'), encoding='utf-8'),
            logging.StreamHandler()  # También muestra logs en consola
        ]
    )
    
    # Desactivar la configuración automática de CORS
    # Manejaremos CORS manualmente con middlewares
    
    # Middleware de depuración para todas las solicitudes
    @app.before_request
    def log_request_info():
        app.logger.debug('Encabezados: %s', request.headers)
        app.logger.debug('Método: %s', request.method)
        app.logger.debug('URL: %s', request.url)
        app.logger.debug('Datos: %s', request.get_data())
        
        # Manejar solicitudes OPTIONS
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response
    
    # Añadir encabezados CORS a todas las respuestas
    @app.after_request
    def add_cors_headers(response):
        # Obtener el origen de la solicitud
        origin = request.headers.get('Origin')
        
        # Solo configurar encabezados si hay un origen en la solicitud
        if origin:
            # Establecer (no añadir) los encabezados CORS
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-user-id'
            response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        
       
        
        return response
    
    # Configuración de MongoDB sin opciones de conexión directa
    try:
        # Obtener la URI de MongoDB del archivo .env
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/red_inclusion')
        
        # Crear cliente de MongoDB sin opciones de conexión directa
        client = MongoClient(mongodb_uri)
        
        # Obtener el nombre de la base de datos del entorno o usar un valor predeterminado
        db_name = os.getenv('MONGODB_NAME', 'red_inclusion')
        
        # Obtener la base de datos específica
        db = client[db_name]
        app.config['MONGO_CLIENT'] = client
        app.config['MONGO_DB'] = db
        app.config['db'] = db  # Agregar esta línea para compatibilidad
        
        # Crear diccionario de colecciones para mantener compatibilidad
        app.config['MONGO_DB_COLLECTIONS'] = {
            'usuarios': db['usuarios'],
            'funcionarios': db['funcionarios'],
            'lineas_trabajo': db['lineas_trabajo'],
            'asistentes': db['asistentes']
        }
        
        # Log de depuración para la configuración de base de datos
        app.logger.info(f"Conectando a base de datos: {db_name}")
        app.logger.info(f"Colecciones disponibles: {db.list_collection_names()}")
        
    except Exception as e:
        print(f"Error de conexión a MongoDB: {e}")
        # Puedes manejar el error de manera más específica según tus necesidades
        raise
    
    # Crear usuario administrador inicial
    init_admin_user(app.config['MONGO_DB'])
    
    # Configuración de JWT
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'clave-secreta-predeterminada')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)  # 24 horas de expiración
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)  # 30 días para refresh token
    jwt = JWTManager(app)
    
    # Configuración personalizada de JWT
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({
            'msg': 'Token de autenticación requerido',
            'status': 'error'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({
            'msg': 'Token de autenticación inválido',
            'status': 'error'
        }), 422
    
    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({
            'msg': 'Token de autenticación expirado',
            'status': 'error'
        }), 401
    
    # Importar blueprints
    from .routes.auth import auth_bp
    from .routes.funcionarios import funcionarios_bp
    from .routes.beneficiarios import beneficiarios_bp
    from .routes.lineas_trabajo import lineas_trabajo_bp
    from .routes.beneficiario import beneficiario_bp  # Importar blueprint singular
    from .routes.actividad import actividad_bp  # Importar blueprint de actividades
    from .routes.asistente import init_asistente_routes  # Importar función de inicialización

    # Importar blueprint temporal
    from .routes.verificacion_temp import verificacion_temp_bp
    
    # Registrar blueprints con prefijos
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(funcionarios_bp, url_prefix='/funcionarios')
    
    # Registrar ambos blueprints con prefijos únicos
    app.register_blueprint(beneficiarios_bp, url_prefix='/beneficiarios')
    app.register_blueprint(beneficiario_bp, url_prefix='/api/beneficiario')  # Prefijo más específico
    
    app.register_blueprint(lineas_trabajo_bp, url_prefix='/lineas-trabajo')
    
    # Registrar blueprints con prefijos correctos
    app.register_blueprint(usuarios_bp, url_prefix='/usuarios')
    app.register_blueprint(asignaciones_bp, url_prefix='/asignaciones')
    app.register_blueprint(reportes_bp, url_prefix='/reportes')
    app.register_blueprint(comunas_bp, url_prefix='/comunas')
    app.register_blueprint(poblacion_migrante_bp, url_prefix='/poblacion-migrante')
    app.register_blueprint(actividad_bp, url_prefix='/actividades')
    
    # Inicializar rutas de asistentes con la base de datos
    init_asistente_routes(app, db)
    
    # Registrar blueprint temporal
    app.register_blueprint(verificacion_temp_bp)

    # Registrar dashboard blueprint si está disponible
    if dashboard_bp:
        app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    
    # Decorador personalizado para roles
    def role_required(allowed_roles):
        def decorator(fn):
            @wraps(fn)
            def wrapper(*args, **kwargs):
                verify_jwt_in_request()
                current_user = get_jwt_identity()
                # Aquí deberías agregar lógica para verificar roles
                return fn(*args, **kwargs)
            return wrapper
        return decorator

    # Ruta raíz de prueba
    @app.route('/')
    def index():
        return jsonify({"message": "Bienvenido a Red de Inclusión API"}), 200

    return app
