from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError, validate, Schema, fields
from ..models.funcionario import FuncionarioModel
from ..models.linea_trabajo import LineaTrabajo
from ..schemas.funcionario_schema import funcionario_schema, funcionarios_schema
import logging
from bson import ObjectId

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Crear Blueprint para rutas de funcionarios
funcionarios_bp = Blueprint('funcionarios', __name__)

# Definir las secretarías válidas
SECRETARIAS_VALIDAS = [
    'Administración General',
    'Secretaría de Hacienda',
    'Secretaría General',
    'Secretaría de Gobierno',
    'Secretaría de Educación',
    'Secretaría de Salud',
    'Secretaría de Inclusión y Cohesión Social',
    'Secretaría de Mujer, Género y Diversidad Sexual',
    'Secretaría de Cultura, Patrimonio y Turismo Étnico Local',
    'Secretaría de Desarrollo Económico y Agroindustrial',
    'Secretaría de Planeación',
    'Secretaría de Movilidad',
    'Secretaría de Infraestructura',
    'Secretaría de Medio Ambiente y Biodiversidad',
    'Secretaría de Turismo, Economía Naranja y Competitividad'
]

class FuncionarioSchema(Schema):
    nombre = fields.String(required=False)
    email = fields.Email(required=False)
    telefono = fields.String(required=False)
    secretaría = fields.String(
        required=False, 
        validate=validate.OneOf(SECRETARIAS_VALIDAS, error='Secretaría no válida')
    )
    linea_trabajo = fields.String(required=False)
    rol = fields.String(required=False)
    estado = fields.String(required=False)
    password = fields.String(required=False, validate=validate.Length(min=8, error='La contraseña debe tener al menos 8 caracteres'))

funcionario_schema = FuncionarioSchema()

@funcionarios_bp.route('/funcionarios', methods=['GET'])
@jwt_required()
def obtener_funcionarios_route():
    """
    Obtener todos los funcionarios
    """
    try:
        db = current_app.config['db']
        funcionario_model = FuncionarioModel(db)
        
        # Obtener funcionarios
        funcionarios = funcionario_model.obtener_funcionarios()
        
        # Asegurar que cada funcionario tenga un nombre de línea de trabajo
        for funcionario in funcionarios:
            # Convertir ObjectId a string si es necesario
            funcionario['_id'] = str(funcionario.get('_id', ''))
            
            # Verificar y obtener nombre de línea de trabajo
            linea_trabajo_id = funcionario.get('linea_trabajo')
            if linea_trabajo_id:
                try:
                    linea_trabajo = db['lineas_trabajo'].find_one(
                        {'_id': ObjectId(linea_trabajo_id)}, 
                        {'nombre': 1}
                    )
                    funcionario['nombreLineaTrabajo'] = linea_trabajo.get('nombre', 'Sin línea de trabajo') if linea_trabajo else 'Sin línea de trabajo'
                except Exception as e:
                    current_app.logger.error(f"Error al obtener línea de trabajo: {str(e)}")
                    funcionario['nombreLineaTrabajo'] = 'Sin línea de trabajo'
            else:
                funcionario['nombreLineaTrabajo'] = 'Sin línea de trabajo'
        
        return jsonify({
            'status': 'success',
            'funcionarios': funcionarios
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener funcionarios: {str(e)}")
        return jsonify({
            'status': 'error',
            'msg': 'Error al obtener funcionarios',
            'detalles': str(e)
        }), 500

@funcionarios_bp.route('/funcionarios', methods=['POST'])
@jwt_required()
def crear_funcionario_route():
    """
    Crear un nuevo funcionario
    """
    try:
        db = current_app.config['db']
        datos = request.get_json()
        
        # Validar datos con el esquema
        try:
            datos_validados = funcionario_schema.load(datos)
        except ValidationError as err:
            logger.error(f"Error de validación: {err.messages}")
            return jsonify({
                'status': 'error', 
                'msg': 'Error de validación',
                'detalles': err.messages
            }), 400

        funcionario_model = FuncionarioModel(db)
        
        try:
            nuevo_funcionario_id = funcionario_model.crear_funcionario(datos_validados)
            
            return jsonify({
                'status': 'success', 
                'msg': 'Funcionario creado exitosamente',
                'funcionario_id': nuevo_funcionario_id
            }), 201
        
        except ValueError as e:
            error_msg = str(e)
            
            # Manejar específicamente el error de correo duplicado
            if 'Ya existe un funcionario con este correo electrónico' in error_msg:
                return jsonify({
                    'status': 'error',
                    'msg': 'Ya existe un funcionario con este correo electrónico',
                    'detalles': {
                        'email': ['Este correo electrónico ya está registrado']
                    }
                }), 400
            
            return jsonify({
                'status': 'error', 
                'msg': error_msg
            }), 400
        
        except Exception as e:
            logger.error(f"Error inesperado al crear funcionario: {str(e)}")
            return jsonify({
                'status': 'error',
                'msg': 'Error inesperado al crear funcionario'
            }), 500
    
    except Exception as e:
        logger.error(f"Error inesperado al crear funcionario: {str(e)}")
        return jsonify({
            'status': 'error',
            'msg': 'Error inesperado al crear funcionario'
        }), 500

@funcionarios_bp.route('/funcionarios/<string:funcionario_id>', methods=['GET'])
@jwt_required()
def obtener_funcionario_route(funcionario_id):
    """
    Obtener un funcionario por su ID
    """
    try:
        db = current_app.config['db']
        
        # Convertir ID a ObjectId
        try:
            funcionario_id_obj = ObjectId(funcionario_id)
        except Exception as e:
            current_app.logger.error(f"ID de funcionario inválido: {funcionario_id}")
            return jsonify({
                'status': 'error',
                'msg': 'ID de funcionario inválido',
                'detalles': str(e)
            }), 400
        
        # Buscar funcionario
        funcionario = db['funcionarios'].find_one({'_id': funcionario_id_obj})
        
        if not funcionario:
            current_app.logger.warning(f"Funcionario no encontrado: {funcionario_id}")
            return jsonify({
                'status': 'error',
                'msg': 'Funcionario no encontrado',
                'detalles': {'id': 'No existe un funcionario con este ID'}
            }), 404
        
        # Convertir ObjectId a string y manejar tipos de datos
        funcionario_serializable = {
            '_id': str(funcionario['_id']),
            'nombre': funcionario.get('nombre', ''),
            'email': funcionario.get('email', ''),
            'telefono': funcionario.get('telefono', ''),
            'secretaría': funcionario.get('secretaría', 'Administración General'),
            'linea_trabajo': str(funcionario.get('linea_trabajo', '')),
            'rol': funcionario.get('rol', 'funcionario'),
            'estado': funcionario.get('estado', 'Activo'),
            'nombreLineaTrabajo': 'Sin línea de trabajo'
        }
        
        # Obtener nombre de línea de trabajo si existe
        if 'linea_trabajo' in funcionario:
            try:
                linea_trabajo = db['lineas_trabajo'].find_one(
                    {'_id': funcionario['linea_trabajo']}, 
                    {'nombre': 1}
                )
                funcionario_serializable['nombreLineaTrabajo'] = linea_trabajo.get('nombre', 'Sin línea de trabajo') if linea_trabajo else 'Sin línea de trabajo'
            except Exception as e:
                current_app.logger.error(f"Error al obtener línea de trabajo: {str(e)}")
                funcionario_serializable['nombreLineaTrabajo'] = 'Sin línea de trabajo'
        
        return jsonify({
            'status': 'success',
            'funcionario': funcionario_serializable
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener funcionario: {str(e)}")
        return jsonify({
            'status': 'error',
            'msg': 'Error al obtener funcionario',
            'detalles': str(e)
        }), 500

@funcionarios_bp.route('/funcionarios/funcionarios/<string:funcionario_id>', methods=['GET'])
@jwt_required()
def obtener_funcionario_ruta_alternativa(funcionario_id):
    """
    Ruta alternativa para obtener un funcionario por su ID
    """
    return obtener_funcionario_route(funcionario_id)

@funcionarios_bp.route('/funcionarios/<string:funcionario_id>', methods=['PUT'])
@jwt_required()
def actualizar_funcionario_route(funcionario_id):
    """
    Actualizar un funcionario por su ID
    """
    try:
        db = current_app.config['db']
        datos = request.get_json()
        
        # Convertir ID a ObjectId
        try:
            funcionario_id_obj = ObjectId(funcionario_id)
        except Exception as e:
            current_app.logger.error(f"ID de funcionario inválido: {funcionario_id}")
            return jsonify({
                'status': 'error',
                'msg': 'ID de funcionario inválido',
                'detalles': str(e)
            }), 400
        
        # Validar datos
        try:
            datos_validados = funcionario_schema.load(datos, partial=True)
        except ValidationError as err:
            current_app.logger.error(f"Error de validación: {err.messages}")
            return jsonify({
                'status': 'error',
                'msg': 'Datos inválidos',
                'detalles': err.messages
            }), 400
        
        funcionario_model = FuncionarioModel(db)
        
        # Buscar funcionario antes de actualizar
        funcionario_existente = db['funcionarios'].find_one({'_id': funcionario_id_obj})
        
        if not funcionario_existente:
            current_app.logger.warning(f"Funcionario no encontrado: {funcionario_id}")
            return jsonify({
                'status': 'error', 
                'msg': 'Funcionario no encontrado'
            }), 404
        
        # Preparar datos para actualización
        datos_actualizacion = {}
        for key, value in datos_validados.items():
            if key == 'linea_trabajo' and value:
                try:
                    datos_actualizacion[key] = ObjectId(value)
                except Exception as e:
                    current_app.logger.error(f"ID de línea de trabajo inválido: {value}")
                    return jsonify({
                        'status': 'error',
                        'msg': 'ID de línea de trabajo inválido',
                        'detalles': str(e)
                    }), 400
            else:
                datos_actualizacion[key] = value
        
        # Actualizar funcionario usando el método del modelo
        resultado = funcionario_model.actualizar_funcionario(funcionario_id, datos_actualizacion)
        
        if resultado > 0:
            # Obtener funcionario actualizado
            funcionario_actualizado = db['funcionarios'].find_one({'_id': funcionario_id_obj})
            
            # Convertir ObjectId a string y manejar tipos de datos
            funcionario_serializable = {
                '_id': str(funcionario_actualizado['_id']),
                'nombre': funcionario_actualizado.get('nombre', ''),
                'email': funcionario_actualizado.get('email', ''),
                'telefono': funcionario_actualizado.get('telefono', ''),
                'secretaría': funcionario_actualizado.get('secretaría', 'Administración General'),
                'linea_trabajo': str(funcionario_actualizado.get('linea_trabajo', '')),
                'rol': funcionario_actualizado.get('rol', 'funcionario'),
                'estado': funcionario_actualizado.get('estado', 'Activo'),
                'nombreLineaTrabajo': 'Sin línea de trabajo'
            }
            
            # Obtener nombre de línea de trabajo si existe
            if 'linea_trabajo' in funcionario_actualizado:
                try:
                    linea_trabajo = db['lineas_trabajo'].find_one(
                        {'_id': funcionario_actualizado['linea_trabajo']}, 
                        {'nombre': 1}
                    )
                    funcionario_serializable['nombreLineaTrabajo'] = linea_trabajo.get('nombre', 'Sin línea de trabajo') if linea_trabajo else 'Sin línea de trabajo'
                except Exception as e:
                    current_app.logger.error(f"Error al obtener línea de trabajo: {str(e)}")
                    funcionario_serializable['nombreLineaTrabajo'] = 'Sin línea de trabajo'
            
            return jsonify({
                'status': 'success', 
                'msg': 'Funcionario actualizado exitosamente',
                'funcionario': funcionario_serializable
            }), 200
        
        return jsonify({
            'status': 'error', 
            'msg': 'No se pudo actualizar el funcionario'
        }), 500
    
    except ValueError as e:
        error_msg = str(e)
        logger.error(f"Error al actualizar funcionario: {error_msg}")
        
        # Manejar específicamente el error de correo duplicado
        if 'Ya existe un funcionario con este correo electrónico' in error_msg:
            return jsonify({
                'status': 'error',
                'msg': 'Ya existe un funcionario con este correo electrónico',
                'detalles': {
                    'email': ['Este correo electrónico ya está registrado']
                }
            }), 400
        
        return jsonify({
            'status': 'error', 
            'msg': error_msg
        }), 400
    
    except Exception as e:
        logger.error(f"Error inesperado al actualizar funcionario: {str(e)}")
        return jsonify({
            'status': 'error',
            'msg': 'Error inesperado al actualizar funcionario'
        }), 500

@funcionarios_bp.route('/funcionarios/<string:funcionario_id>', methods=['DELETE'])
@jwt_required()
def eliminar_funcionario_route(funcionario_id):
    """
    Eliminar un funcionario
    """
    try:
        db = current_app.config['db']
        funcionario_model = FuncionarioModel(db)
        eliminado = funcionario_model.eliminar_funcionario(funcionario_id)
        
        if eliminado:
            return jsonify({
                'status': 'success', 
                'msg': 'Funcionario eliminado exitosamente'
            }), 200
        
        return jsonify({
            'status': 'error', 
            'msg': 'No se pudo eliminar el funcionario'
        }), 404
    
    except ValueError as e:
        logger.error(f"Error al eliminar funcionario: {str(e)}")
        return jsonify({
            'status': 'error', 
            'msg': str(e)
        }), 500
    
    except Exception as e:
        logger.error(f"Error inesperado al eliminar funcionario: {str(e)}")
        return jsonify({
            'status': 'error',
            'msg': 'Error inesperado al eliminar funcionario'
        }), 500

