from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from ..models.funcionario import FuncionarioModel
from ..schemas.funcionario_schema import funcionario_schema
import logging
import bcrypt
from datetime import datetime
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

def init_admin_user(mongo_db):
    """Crear usuario administrador si no existe"""
    funcionarios = mongo_db['funcionarios']
    admin_email = 'admin@redinclusion.com'
    
    # Verificar si ya existe un admin
    existing_admin = funcionarios.find_one({'email': admin_email})
    if not existing_admin:
        # Crear usuario administrador
        admin_data = {
            'nombre': 'Administrador',
            'secretaría': 'Administración General',
            'email': admin_email,
            'password_hash': bcrypt.hashpw('RedInclusion2024'.encode('utf-8'), bcrypt.gensalt()),
            'linea_trabajo': str(ObjectId()),  # Generar un ObjectId para línea de trabajo
            'rol': 'admin',
            'estado': 'Activo',
            'fecha_registro': datetime.utcnow()
        }
        
        funcionarios.insert_one(admin_data)
        logging.info("Usuario administrador creado exitosamente")
    else:
        logging.info("Usuario administrador ya existe")

def verify_password(stored_password, provided_password):
    """
    Verificar contraseña usando bcrypt
    
    :param stored_password: Hash de contraseña almacenado
    :param provided_password: Contraseña proporcionada por el usuario
    :return: Booleano indicando si la contraseña es correcta
    """
    try:
        # Si stored_password es un hash de bcrypt
        if isinstance(stored_password, bytes):
            return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password)
        
        # Si stored_password es un string (para compatibilidad)
        elif isinstance(stored_password, str):
            # Convertir a bytes si es un string
            stored_bytes = stored_password.encode('utf-8')
            return bcrypt.checkpw(provided_password.encode('utf-8'), stored_bytes)
        
        # Si no es un formato reconocido
        return False

    except Exception as e:
        current_app.logger.error(f"Error en verificación de contraseña: {e}")
        return False

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"msg": "Credenciales incompletas"}), 400

        # Obtener datos de la base de datos
        db = current_app.config['db']
        funcionario_model = FuncionarioModel(db)
        
        # Buscar funcionario por email
        funcionario_completo = funcionario_model.obtener_funcionario_por_email(email)

        if not funcionario_completo:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        # Verificar contraseña
        password_verified = verify_password(funcionario_completo.get('password_hash', b''), password)
        
        if not password_verified:
            return jsonify({"msg": "Contraseña incorrecta"}), 401

        # Obtener nombre de línea de trabajo
        lineas_trabajo = db['lineas_trabajo']
        linea_trabajo_obj = lineas_trabajo.find_one({'_id': ObjectId(funcionario_completo['linea_trabajo'])})
        nombre_linea_trabajo = linea_trabajo_obj['nombre'] if linea_trabajo_obj else 'Sin línea de trabajo'

        # Crear tokens de acceso y refresco
        access_token = create_access_token(identity=funcionario_completo['id'])
        refresh_token = create_refresh_token(identity=funcionario_completo['id'])

        # Preparar respuesta
        response_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds(),
            "status": "success",
            "funcionario": {
                "id": funcionario_completo['id'],
                "nombre": funcionario_completo['nombre'],
                "secretaría": funcionario_completo.get('secretaría', ''),
                "email": funcionario_completo['email'],
                "linea_trabajo": nombre_linea_trabajo,
                "linea_trabajo_id": funcionario_completo['linea_trabajo'],
                "linea_trabajo_nombre": funcionario_completo.get('nombreLineaTrabajo', nombre_linea_trabajo),
                "rol": funcionario_completo.get('rol', 'funcionario'),
                "estado": funcionario_completo.get('estado', 'Activo')
            }
        }
        
        # Guardar el refresh token en la base de datos
        db['refresh_tokens'].insert_one({
            'user_id': funcionario_completo['id'],
            'token': refresh_token,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
        })
        
        return jsonify(response_data), 200

    except Exception as e:
        current_app.logger.error(f"Error en login: {str(e)}")
        return jsonify({"msg": "Error interno del servidor"}), 500

@auth_bp.route('/perfil', methods=['GET'])
@jwt_required()
def obtener_perfil():
    """
    Obtener perfil del funcionario autenticado
    """
    try:
        # Obtener ID del funcionario desde el token
        funcionario_id = get_jwt_identity()
        
        # Obtener datos de la base de datos
        db = current_app.config['db']
        funcionario_model = FuncionarioModel(db)
        
        # Buscar funcionario por ID
        funcionario = funcionario_model.obtener_funcionario_por_id(funcionario_id)
        
        if not funcionario:
            return jsonify({
                "msg": "Funcionario no encontrado", 
                "status": "error"
            }), 404
        
        return jsonify({
            "status": "success",
            "funcionario": {
                "id": funcionario['_id'],
                "nombre": funcionario['nombre'],
                "secretaría": funcionario.get('secretaría', ''),
                "email": funcionario['email'],
                "linea_trabajo": funcionario.get('linea_trabajo', ''),
                "rol": funcionario.get('rol', 'funcionario'),
                "estado": funcionario.get('estado', 'Activo'),
                "fecha_registro": funcionario.get('fecha_registro', '').isoformat() if funcionario.get('fecha_registro') else ''
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener perfil: {str(e)}")
        return jsonify({
            "msg": "Error interno del servidor", 
            "status": "error"
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refrescar el token de acceso
    """
    try:
        current_user = get_jwt_identity()
        
        # Verificar si el token de refresco es válido
        db = current_app.config['db']
        token_data = get_jwt()
        
        # Crear nuevo token de acceso
        access_token = create_access_token(identity=current_user)
        
        return jsonify({
            'access_token': access_token,
            'token_type': 'bearer',
            'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al refrescar token: {str(e)}")
        return jsonify({"msg": "Error al refrescar el token"}), 500

@auth_bp.route('/registro', methods=['POST'])
def registro():
    """
    Registrar un nuevo funcionario
    """
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'email', 'password', 'secretaría', 'linea_trabajo']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Faltan campos requeridos"}), 400
            
        # Verificar si el correo ya existe
        db = current_app.config['db']
        if db.funcionarios.find_one({"email": data['email']}):
            return jsonify({"error": "El correo ya está registrado"}), 400
            
        # Hashear la contraseña
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Crear nuevo funcionario
        nuevo_funcionario = {
            'nombre': data['nombre'],
            'email': data['email'],
            'password_hash': hashed_password,
            'secretaría': data['secretaría'],
            'linea_trabajo': data['linea_trabajo'],
            'rol': 'funcionario',
            'estado': 'Activo',
            'fecha_registro': datetime.utcnow()
        }
        
        # Insertar en la base de datos
        result = db.funcionarios.insert_one(nuevo_funcionario)
        
        return jsonify({
            "message": "Usuario registrado exitosamente",
            "id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error en registro: {str(e)}")
        return jsonify({"error": "Error al registrar el usuario"}), 500
