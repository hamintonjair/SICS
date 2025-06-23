from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required
from bson import ObjectId
from marshmallow import ValidationError
import logging
from urllib.parse import unquote
import re

from app.models.linea_trabajo import linea_trabajo_schema, lineas_trabajo_schema, LineaTrabajo

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Crear Blueprint para rutas de líneas de trabajo
lineas_trabajo_bp = Blueprint('lineas_trabajo', __name__)

@lineas_trabajo_bp.route('', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required(optional=True)  # Make JWT optional for OPTIONS requests
def lineas_trabajo_route():
    """
    Manejar solicitudes GET y POST para líneas de trabajo
    """
    try:
        # Handle OPTIONS request for CORS preflight
        if request.method == 'OPTIONS':
            response = jsonify(success=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
            
        # Check if user is authenticated for non-OPTIONS requests
        from flask_jwt_extended import get_jwt_identity
        current_user = get_jwt_identity()
        if not current_user and request.method != 'OPTIONS':
            return jsonify({"msg": "Missing or invalid token"}), 401
            
        # Obtener la colección de líneas de trabajo
        lineas_trabajo_collection = current_app.config['MONGO_DB']['lineas_trabajo']
        
        # Inicializar modelo de líneas de trabajo
        linea_trabajo_model = LineaTrabajo(lineas_trabajo_collection)
        
        # Manejar solicitudes GET
        if request.method == 'GET':
            logger.debug("Obteniendo líneas de trabajo")
            lineas = linea_trabajo_model.obtener_lineas_trabajo()
            return jsonify(lineas), 200
        
        # Manejar solicitudes POST
        if request.method == 'POST':
            logger.debug("Creando nueva línea de trabajo")
            
            # Validar datos de entrada
            try:
                data = linea_trabajo_schema.load(request.json)
            except ValidationError as err:
                logger.error(f"Error de validación: {err.messages}")
                return jsonify({"msg": "Error de validación", "errores": err.messages}), 400
            
            # Crear línea de trabajo
            try:
                nuevo_id = linea_trabajo_model.crear_linea_trabajo(data)
                
                # Obtener la línea de trabajo recién creada
                linea_creada = linea_trabajo_model.obtener_linea_trabajo_por_id(nuevo_id)
                
                return jsonify({
                    "msg": "Línea de trabajo creada exitosamente", 
                    "id": nuevo_id,
                    "linea_trabajo": linea_creada
                }), 201
            
            except ValueError as e:
                logger.error(f"Error al crear línea de trabajo: {str(e)}")
                return jsonify({"msg": str(e)}), 400
    
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}")
        return jsonify({"msg": f"Error interno del servidor: {str(e)}"}), 500

@lineas_trabajo_bp.route('/<id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
@jwt_required()
def linea_trabajo_por_id(id):
    """
    Manejar solicitudes GET, PUT y DELETE para una línea de trabajo específica
    """
    try:
        # Obtener la colección de líneas de trabajo
        lineas_trabajo_collection = current_app.config['MONGO_DB']['lineas_trabajo']
        
        # Inicializar modelo de líneas de trabajo
        linea_trabajo_model = LineaTrabajo(lineas_trabajo_collection)
        
        # Manejar solicitudes OPTIONS (CORS)
        if request.method == 'OPTIONS':
            response = jsonify(success=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
            return response
        
        # Manejar solicitudes GET
        if request.method == 'GET':
            logger.debug(f"Obteniendo línea de trabajo con ID: {id}")
            linea = linea_trabajo_model.obtener_linea_trabajo_por_id(id)
            
            if linea:
                return jsonify(linea), 200
            else:
                return jsonify({"msg": "Línea de trabajo no encontrada"}), 404
        
        # Manejar solicitudes PUT
        if request.method == 'PUT':
            logger.debug(f"Actualizando línea de trabajo con ID: {id}")
            
            # Validar datos de entrada
            try:
                data = linea_trabajo_schema.load(request.json, partial=True)
            except ValidationError as err:
                logger.error(f"Error de validación: {err.messages}")
                return jsonify({"msg": "Error de validación", "errores": err.messages}), 400
            
            # Actualizar línea de trabajo
            modificados = linea_trabajo_model.actualizar_linea_trabajo(id, data)
            
            if modificados > 0:
                # Obtener la línea de trabajo actualizada
                linea_actualizada = linea_trabajo_model.obtener_linea_trabajo_por_id(id)
                return jsonify({
                    "msg": "Línea de trabajo actualizada exitosamente",
                    "linea_trabajo": linea_actualizada
                }), 200
            else:
                return jsonify({"msg": "No se encontró la línea de trabajo o no se realizaron cambios"}), 404
        
        # Manejar solicitudes DELETE
        if request.method == 'DELETE':
            logger.debug(f"Eliminando línea de trabajo con ID: {id}")
            eliminados = linea_trabajo_model.eliminar_linea_trabajo(id)
            
            if eliminados > 0:
                return jsonify({"msg": "Línea de trabajo eliminada exitosamente"}), 200
            else:
                return jsonify({"msg": "No se encontró la línea de trabajo"}), 404
    
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}")
        return jsonify({"msg": f"Error interno del servidor: {str(e)}"}), 500

@lineas_trabajo_bp.route('/<nombre_linea_trabajo>', methods=['GET'])
def obtener_linea_trabajo(nombre_linea_trabajo):
    try:
        # Decodificar el nombre de la línea de trabajo
        nombre_linea_trabajo_decoded = unquote(nombre_linea_trabajo)
        
        # Obtener la colección de líneas de trabajo
        lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']
        
        # Buscar la línea de trabajo por nombre, ignorando mayúsculas/minúsculas
        linea_trabajo = lineas_trabajo.find_one({
            'nombre': {'$regex': f'^{re.escape(nombre_linea_trabajo_decoded)}$', '$options': 'i'}
        })
        
        if not linea_trabajo:
            return jsonify({"msg": f"Línea de trabajo '{nombre_linea_trabajo_decoded}' no encontrada"}), 404
        
        # Convertir ObjectId a string
        linea_trabajo['_id'] = str(linea_trabajo['_id'])
        
        return jsonify(linea_trabajo), 200
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener línea de trabajo: {str(e)}")
        return jsonify({"msg": f"Error interno al obtener línea de trabajo: {str(e)}"}), 500

@lineas_trabajo_bp.route('/', methods=['GET'])
def listar_lineas_trabajo():
    try:
        # Obtener la colección de líneas de trabajo
        lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']
        
        # Obtener todas las líneas de trabajo
        todas_lineas = list(lineas_trabajo.find())
        
        # Convertir ObjectId a string
        for linea in todas_lineas:
            linea['_id'] = str(linea['_id'])
        
        return jsonify(todas_lineas), 200
    
    except Exception as e:
        current_app.logger.error(f"Error al listar líneas de trabajo: {str(e)}")
        return jsonify({"msg": f"Error interno al listar líneas de trabajo: {str(e)}"}), 500
