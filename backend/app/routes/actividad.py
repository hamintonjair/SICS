# backend/app/routes/actividad.py
import logging
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from app.controllers.actividad_controller import (
    crear_actividad, obtener_actividades, obtener_actividad,
    actualizar_actividad, eliminar_actividad, registrar_asistencias,
    exportar_actividad, exportar_reunion, subir_logo
)

logger = logging.getLogger(__name__)

actividad_bp = Blueprint('actividad', __name__)

@actividad_bp.route('', methods=['GET'])
def obtener_actividades_route():
    return obtener_actividades()

@actividad_bp.route('', methods=['POST'])
def crear_actividad_route():
    return crear_actividad()

@actividad_bp.route('/<actividad_id>', methods=['GET'])
def obtener_actividad_route(actividad_id):
    return obtener_actividad(actividad_id)

@actividad_bp.route('/<actividad_id>', methods=['PUT'])
def actualizar_actividad_route(actividad_id):
    # Si no hay token, usar un usuario por defecto
    from flask import g
    if not hasattr(g, 'user_id'):
        g.user_id = 'sistema'  # Usuario por defecto cuando no hay autenticación
    return actualizar_actividad(actividad_id)

@actividad_bp.route('/<actividad_id>', methods=['DELETE'])
def eliminar_actividad_route(actividad_id):
    return eliminar_actividad(actividad_id)

@actividad_bp.route('/<actividad_id>/asistentes', methods=['POST'])
def registrar_asistencias_route(actividad_id):
    return registrar_asistencias(actividad_id)

@actividad_bp.route('/<actividad_id>/exportar-excel', methods=['GET'])
@actividad_bp.route('/reuniones/<actividad_id>/exportar-excel', methods=['GET'])
def exportar_actividad_route(actividad_id):
    # Configurar usuario por defecto si no hay autenticación
    if not hasattr(g, 'user_id'):
        g.user_id = 'sistema'
    
    # Obtener parámetros de consulta
    columnas = request.args.get('columnas')
    if columnas:
        try:
            if isinstance(columnas, str):
                columnas = columnas.split(',')
        except Exception as e:
            logger.error(f"Error al procesar parámetros: {str(e)}")
            return jsonify({'error': 'Formato de columnas inválido'}), 400
    
    
    # Manejar la autenticación JWT de forma opcional
    def jwt_optional(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=True)
            except Exception as e:
                logger.warning(f"Error en autenticación JWT: {str(e)}")
            return fn(*args, **kwargs)
        return wrapper
    
    @jwt_optional
    def exportar_con_jwt_opcional(actividad_id):
        try:
            # Verificar si la ruta es para una reunión
            es_reunion = '/reuniones/' in request.path
            logger.info(f"Verificando si es reunión - Ruta: {request.path}, Es reunión: {es_reunion}")
            
            if es_reunion:
                logger.info("Redirigiendo a exportar_reunion")
                return exportar_reunion(actividad_id, columnas=columnas)
            else:
                logger.info("Redirigiendo a exportar_actividad")
                return exportar_actividad(actividad_id, columnas=columnas)
        except Exception as e:
            logger.error(f"Error en exportación: {str(e)}", exc_info=True)
            return jsonify({
                'success': False,
                'message': 'Error al procesar la exportación',
                'error': str(e)
            }), 500
    
    return exportar_con_jwt_opcional(actividad_id)

@actividad_bp.route('/upload-logo', methods=['POST'])
def subir_logo_route():
    return subir_logo()