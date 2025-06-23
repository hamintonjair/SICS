from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.comuna import ComunaModel
from app.models.funcionario import FuncionarioModel
from app.utils.response import error_response, success_response
from bson import ObjectId
import logging

comunas_bp = Blueprint('comunas', __name__)

@comunas_bp.route('/', methods=['POST'])
@jwt_required()
def crear_comuna():
    """
    Crear una nueva Comuna
    """
    try:
        # Obtener datos del usuario autenticado
        usuario_id = get_jwt_identity()
        logging.info(f"Creando Comuna - Usuario ID: {usuario_id}")
        
        db = current_app.config.get('db')
        logging.info(f"Base de datos obtenida: {db}")
        
        # Validar rol de administrador
        funcionario_model = FuncionarioModel(db)
        usuario = funcionario_model.obtener_funcionario_por_id(usuario_id)
        logging.info(f"Rol de usuario: {usuario.get('rol')}")
        
        if usuario['rol'] != 'admin':
            logging.warning(f"Intento de crear Comuna por usuario no admin: {usuario_id}")
            return error_response('No autorizado', 403)
        
        # Obtener datos de la solicitud
        datos = request.get_json()
        logging.info(f"Datos recibidos: {datos}")
        
        # Validar campos obligatorios
        if not datos.get('nombre') or not datos.get('zona'):
            logging.error("Campos obligatorios faltantes")
            return error_response('Nombre y Zona son obligatorios', 400)
        
        # Crear Comuna
        comuna_model = ComunaModel(db)
        nueva_comuna_id = comuna_model.crear_comuna(datos)
        logging.info(f"Comuna creada exitosamente. ID: {nueva_comuna_id}")
        
        return success_response({
            'mensaje': 'Comuna creada exitosamente', 
            'id': nueva_comuna_id
        }, 201)
    
    except ValueError as e:
        logging.error(f"Error de validación: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logging.error(f"Error interno al crear Comuna: {str(e)}")
        return error_response(f'Error interno del servidor: {str(e)}', 500)

@comunas_bp.route('/', methods=['GET'])
@jwt_required()
def obtener_comunas():
    """
    Obtener todas las Comunas
    """
    try:
        # Obtener datos del usuario autenticado
        usuario_id = get_jwt_identity()
        logging.info(f"Obteniendo Comunas - Usuario ID: {usuario_id}")
        
        db = current_app.config.get('db')
        logging.info(f"Base de datos obtenida: {db}")
        
        # Validar que el usuario esté autenticado
        funcionario_model = FuncionarioModel(db)
        usuario = funcionario_model.obtener_funcionario_por_id(usuario_id)
        logging.info(f"Rol de usuario: {usuario.get('rol')}")
        
        # Obtener Comunas
        comuna_model = ComunaModel(db)
        comunas = comuna_model.obtener_comunas()
        logging.info(f"Comunas obtenidas: {comunas}")
        
        return success_response(comunas)
    
    except ValueError as e:
        logging.error(f"Error de validación: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logging.error(f"Error interno al obtener Comunas: {str(e)}")
        return error_response(f'Error interno del servidor: {str(e)}', 500)

@comunas_bp.route('/<string:comuna_id>', methods=['GET'])
@jwt_required()
def obtener_comuna_por_id(comuna_id):
    """
    Obtener una Comuna por su ID
    """
    try:
        # Obtener datos del usuario autenticado
        usuario_id = get_jwt_identity()
        logging.info(f"Obteniendo Comuna por ID - Usuario ID: {usuario_id}")
        
        db = current_app.config.get('db')
        logging.info(f"Base de datos obtenida: {db}")
        
        # Validar rol de administrador
        funcionario_model = FuncionarioModel(db)
        usuario = funcionario_model.obtener_funcionario_por_id(usuario_id)
        logging.info(f"Rol de usuario: {usuario.get('rol')}")
        
        if usuario['rol'] != 'admin':
            logging.warning(f"Intento de obtener Comuna por ID por usuario no admin: {usuario_id}")
            return error_response('No autorizado', 403)
        
        # Obtener Comuna
        comuna_model = ComunaModel(db)
        comuna = comuna_model.obtener_comuna_por_id(comuna_id)
        logging.info(f"Comuna obtenida: {comuna}")
        
        if not comuna:
            logging.error(f"Comuna no encontrada: {comuna_id}")
            return error_response('Comuna no encontrada', 404)
        
        return success_response(comuna)
    
    except ValueError as e:
        logging.error(f"Error de validación: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logging.error(f"Error interno al obtener Comuna por ID: {str(e)}")
        return error_response(f'Error interno del servidor: {str(e)}', 500)

@comunas_bp.route('/<string:comuna_id>', methods=['PUT'])
@jwt_required()
def actualizar_comuna(comuna_id):
    """
    Actualizar una Comuna
    """
    try:
        # Obtener datos del usuario autenticado
        usuario_id = get_jwt_identity()
        logging.info(f"Actualizando Comuna - Usuario ID: {usuario_id}")
        
        db = current_app.config.get('db')
        logging.info(f"Base de datos obtenida: {db}")
        
        # Validar rol de administrador
        funcionario_model = FuncionarioModel(db)
        usuario = funcionario_model.obtener_funcionario_por_id(usuario_id)
        logging.info(f"Rol de usuario: {usuario.get('rol')}")
        
        if usuario['rol'] != 'admin':
            logging.warning(f"Intento de actualizar Comuna por usuario no admin: {usuario_id}")
            return error_response('No autorizado', 403)
        
        # Obtener datos de la solicitud
        datos = request.get_json()
        logging.info(f"Datos recibidos: {datos}")
        
        # Validar campos
        if not datos.get('nombre') and not datos.get('zona'):
            logging.error("Campos obligatorios faltantes")
            return error_response('Debe proporcionar al menos un campo para actualizar', 400)
        
        # Actualizar Comuna
        comuna_model = ComunaModel(db)
        modificados = comuna_model.actualizar_comuna(comuna_id, datos)
        logging.info(f"Comuna actualizada: {modificados}")
        
        if modificados == 0:
            logging.error(f"Comuna no encontrada o sin cambios: {comuna_id}")
            return error_response('Comuna no encontrada o sin cambios', 404)
        
        return success_response({
            'mensaje': 'Comuna actualizada exitosamente', 
            'modificados': modificados
        })
    
    except ValueError as e:
        logging.error(f"Error de validación: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logging.error(f"Error interno al actualizar Comuna: {str(e)}")
        return error_response(f'Error interno del servidor: {str(e)}', 500)

@comunas_bp.route('/<string:comuna_id>', methods=['DELETE'])
@jwt_required()
def eliminar_comuna(comuna_id):
    """
    Eliminar una Comuna
    """
    try:
        # Obtener datos del usuario autenticado
        usuario_id = get_jwt_identity()
        logging.info(f"Eliminando Comuna - Usuario ID: {usuario_id}")
        
        db = current_app.config.get('db')
        logging.info(f"Base de datos obtenida: {db}")
        
        # Validar rol de administrador
        funcionario_model = FuncionarioModel(db)
        usuario = funcionario_model.obtener_funcionario_por_id(usuario_id)
        logging.info(f"Rol de usuario: {usuario.get('rol')}")
        
        if usuario['rol'] != 'admin':
            logging.warning(f"Intento de eliminar Comuna por usuario no admin: {usuario_id}")
            return error_response('No autorizado', 403)
        
        # Eliminar Comuna
        comuna_model = ComunaModel(db)
        eliminados = comuna_model.eliminar_comuna(comuna_id)
        logging.info(f"Comuna eliminada: {eliminados}")
        
        if eliminados == 0:
            logging.error(f"Comuna no encontrada: {comuna_id}")
            return error_response('Comuna no encontrada', 404)
        
        return success_response({
            'mensaje': 'Comuna eliminada exitosamente', 
            'eliminados': eliminados
        })
    
    except ValueError as e:
        logging.error(f"Error de validación: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logging.error(f"Error interno al eliminar Comuna: {str(e)}")
        return error_response(f'Error interno del servidor: {str(e)}', 500)
