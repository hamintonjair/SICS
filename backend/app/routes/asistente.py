# backend/app/routes/asistente.py
from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import logging
from ..models.asistente import AsistenteModel

# Configurar el logger
logger = logging.getLogger(__name__)

# Crear el blueprint
asistente_bp = Blueprint('asistente', __name__)

# Variables globales
db = None
asistente_model = None

@asistente_bp.route('', methods=['GET'])
def listar_asistentes():
    """
    Obtiene todos los asistentes
    """
    try:
        # Obtener parámetros de consulta
        tipo = request.args.get('tipo')
        query = {}
        
        if tipo:
            query['tipo'] = tipo
        
        # Obtener asistentes usando el modelo
        asistentes = asistente_model.listar_todos(query)
        
        return jsonify({
            'success': True,
            'data': asistentes,
            'count': len(asistentes)
        })
        
    except Exception as e:
        logger.error(f'Error al listar asistentes: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al listar los asistentes',
            'error': str(e)
        }), 500

@asistente_bp.route('', methods=['POST'])
def crear_asistente():
    """
    Crea un nuevo asistente
    """
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'cedula', 'dependencia', 'cargo']
        for field in required_fields:
            if not data.get(field):
                logger.error(f'Campo requerido faltante: {field}')
                return jsonify({
                    'success': False,
                    'message': f'El campo {field} es requerido',
                    'field': field
                }), 400
        
        # Validar que no exista un asistente con la misma cédula
        if asistente_model.buscar_por_cedula(data['cedula']):
            logger.error(f'Cédula duplicada: {data["cedula"]}')
            return jsonify({
                'success': False,
                'message': 'Ya existe un asistente con esta cédula',
                'field': 'cedula'
            }), 400
            
        # Si se proporciona email, validar que sea único
        if data.get('email'):
            if asistente_model.buscar_por_email(data['email']):
                logger.error(f'Email duplicado: {data["email"]}')
                return jsonify({
                    'success': False,
                    'message': 'Ya existe un asistente con este correo electrónico',
                    'field': 'email'
                }), 400
        
        # Normalizar datos
        tipo_participacion = data.get('tipo_participacion', 'SERVIDOR PÚBLICO').strip().upper()
        
        # Crear el asistente
        asistente = {
            'tipo': 'funcionario',
            'nombre': data['nombre'].strip(),
            'cedula': data['cedula'].strip(),
            'dependencia': data['dependencia'].strip(),
            'cargo': data['cargo'].strip(),
            'tipo_participacion': tipo_participacion,
            'telefono': data.get('telefono', '').strip(),
            'email': data.get('email', '').strip().lower() if data.get('email') else '',
            'fecha_creacion': datetime.utcnow(),
            'fecha_actualizacion': datetime.utcnow(),
            'firma': data.get('firma')  # Añadir el campo de firma
        }
        
        # Crear el asistente usando el modelo
        asistente_id = asistente_model.crear(asistente)
        
        if not asistente_id:
            raise Exception('No se pudo crear el asistente')
        
        # Obtener el asistente recién creado
        asistente_creado = asistente_model.obtener_por_id(asistente_id)
        
        logger.info(f'Asistente creado exitosamente: {asistente_id}')
        return jsonify({
            'success': True,
            'message': 'Asistente creado exitosamente',
            'data': asistente_creado
        }), 201
        
    except Exception as e:
        logger.error(f'Error al crear asistente: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al crear el asistente',
            'error': str(e)
        }), 500

@asistente_bp.route('/<string:asistente_id>', methods=['GET'])
def obtener_asistente(asistente_id):
    """
    Obtiene un asistente por su ID
    """
    try:
        # Validar ID
        if not ObjectId.is_valid(asistente_id):
            return jsonify({
                'success': False,
                'message': 'ID de asistente no válido'
            }), 400
        
        # Buscar el asistente usando el modelo
        asistente = asistente_model.obtener_por_id(asistente_id)
        
        if not asistente:
            return jsonify({
                'success': False,
                'message': 'Asistente no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': asistente
        })
        
    except Exception as e:
        logger.error(f'Error al obtener asistente {asistente_id}: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al obtener el asistente',
            'error': str(e)
        }), 500

@asistente_bp.route('/<string:asistente_id>', methods=['PUT'])
def actualizar_asistente(asistente_id):
    """
    Actualiza un asistente
    """
    try:
        if not ObjectId.is_valid(asistente_id):
            return jsonify({
                'success': False,
                'message': 'ID de asistente no válido'
            }), 400
            
        data = request.get_json()
        
        # Verificar si el asistente existe
        asistente = asistente_model.obtener_por_id(asistente_id)
        if not asistente:
            return jsonify({
                'success': False,
                'message': 'Asistente no encontrado'
            }), 404
        
        # Validar campos requeridos
        campos_requeridos = ['nombre', 'cedula', 'dependencia', 'cargo']
        for campo in campos_requeridos:
            if campo in data and (data[campo] is None or str(data[campo]).strip() == ''):
                logger.error(f'Campo requerido vacío: {campo}')
                return jsonify({
                    'success': False,
                    'message': f'El campo {campo} no puede estar vacío',
                    'field': campo
                }), 400
        
        # Validar cédula única si se está actualizando
        if 'cedula' in data and data['cedula'] != asistente['cedula']:
            if asistente_model.buscar_por_cedula(data['cedula']):
                logger.error(f'Cédula duplicada: {data["cedula"]}')
                return jsonify({
                    'success': False,
                    'message': 'Ya existe un asistente con esta cédula',
                    'field': 'cedula'
                }), 400
        
        # Validar email único si se está actualizando
        if 'email' in data and data.get('email') and data['email'] != asistente.get('email', ''):
            if asistente_model.buscar_por_email(data['email']):
                logger.error(f'Email duplicado: {data["email"]}')
                return jsonify({
                    'success': False,
                    'message': 'Ya existe un asistente con este correo electrónico',
                    'field': 'email'
                }), 400
        
        # Preparar los datos a actualizar
        datos_actualizacion = {
            'nombre': data.get('nombre', asistente.get('nombre', '')).strip(),
            'cedula': data.get('cedula', asistente.get('cedula', '')).strip(),
            'dependencia': data.get('dependencia', asistente.get('dependencia', '')).strip(),
            'cargo': data.get('cargo', asistente.get('cargo', '')).strip(),
            'tipo_participacion': data.get('tipo_participacion', asistente.get('tipo_participacion', 'SERVIDOR PÚBLICO')).strip().upper(),
            'telefono': data.get('telefono', asistente.get('telefono', '')).strip(),
            'email': data.get('email', asistente.get('email', '')).strip().lower() if data.get('email', asistente.get('email')) else '',
            'fecha_actualizacion': datetime.utcnow()
        }
        
        # Si se está actualizando la firma, incluirla
        if 'firma' in data:
            datos_actualizacion['firma'] = data['firma']
        
        # Actualizar el asistente usando el modelo
        asistente_actualizado = asistente_model.actualizar_por_id(asistente_id, datos_actualizacion)
        
        if not asistente_actualizado:
            logger.warning(f'No se realizaron cambios en el asistente {asistente_id}')
            return jsonify({
                'success': True,
                'message': 'No se realizaron cambios en el asistente',
                'data': asistente
            })
        
        logger.info(f'Asistente actualizado exitosamente: {asistente_id}')
        return jsonify({
            'success': True,
            'message': 'Asistente actualizado correctamente',
            'data': asistente_actualizado
        })
        
    except Exception as e:
        logger.error(f'Error al actualizar asistente: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al actualizar el asistente',
            'error': str(e)
        }), 500

@asistente_bp.route('/<asistente_id>', methods=['DELETE'])
def eliminar_asistente(asistente_id):
    """
    Elimina un asistente
    """
    try:
        if not ObjectId.is_valid(asistente_id):
            return jsonify({
                'success': False,
                'message': 'ID de asistente no válido'
            }), 400
        
        # Verificar si el asistente existe
        asistente = asistente_model.obtener_por_id(asistente_id)
        if not asistente:
            return jsonify({
                'success': False,
                'message': 'Asistente no encontrado'
            }), 404
        
        # Eliminar el asistente usando el modelo
        eliminado = asistente_model.eliminar(asistente_id)
        
        if not eliminado:
            logger.error(f'No se pudo eliminar el asistente {asistente_id}')
            return jsonify({
                'success': False,
                'message': 'No se pudo eliminar el asistente'
            }), 400
        
        logger.info(f'Asistente eliminado exitosamente: {asistente_id}')
        return jsonify({
            'success': True,
            'message': 'Asistente eliminado correctamente'
        })
        
    except Exception as e:
        logger.error(f'Error al eliminar asistente: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al eliminar el asistente',
            'error': str(e)
        }), 500

def init_asistente_routes(app, database):
    """
    Inicializa las rutas de asistentes
    """
    global db, asistente_model
    
    # Asegurarse de que database es la base de datos de MongoDB
    if hasattr(database, 'name') and hasattr(database, 'list_collection_names'):
        # Si ya es una instancia de Database
        db = database
    elif hasattr(database, 'get_database'):
        # Si es un cliente de MongoDB
        db = database.get_database()
    else:
        # Si es un diccionario con la colección
        db = database
    
    # Inicializar el modelo de asistentes
    asistente_model = AsistenteModel(db)
    
    # Registrar el blueprint con el prefijo /api/asistente (singular para coincidir con el frontend)
    app.register_blueprint(asistente_bp, url_prefix='/api/asistente')
    
    # Verificar que la colección existe
    try:
        collection_names = db.list_collection_names()
        logger.info(f"Colecciones disponibles en la base de datos: {collection_names}")
        if 'asistentes' not in collection_names:
            logger.warning("La colección 'asistentes' no existe en la base de datos")
        else:
            logger.info("La colección 'asistentes' existe en la base de datos")
    except Exception as e:
        logger.error(f"Error al verificar colecciones: {str(e)}")
    
    logger.info("Rutas de asistentes inicializadas correctamente")
