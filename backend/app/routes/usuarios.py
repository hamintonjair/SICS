from flask import Blueprint, request, jsonify, current_app
from marshmallow import ValidationError
from bson import ObjectId
from datetime import datetime
import bcrypt
import re

from ..models.usuario import usuario_schema, usuarios_schema, UsuarioSchema
from ..models.linea_trabajo import LineaTrabajoSchema, linea_trabajo_schema

usuarios_bp = Blueprint('usuarios', __name__)

def validar_contrasena(contrasena):
    """
    Validar complejidad de contraseña
    
    :param contrasena: Contraseña a validar
    :return: Diccionario con detalles de validación
    """
    errores = []
    
    if len(contrasena) < 8:
        errores.append("La contraseña debe tener al menos 8 caracteres")
    
    if not re.search(r'[A-Z]', contrasena):
        errores.append("Debe contener al menos una letra mayúscula")
    
    if not re.search(r'[a-z]', contrasena):
        errores.append("Debe contener al menos una letra minúscula")
    
    if not re.search(r'\d', contrasena):
        errores.append("Debe contener al menos un número")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', contrasena):
        errores.append("Debe contener al menos un carácter especial")
    
    return {
        'valido': len(errores) == 0,
        'errores': errores
    }

@usuarios_bp.route('/crear', methods=['POST'])
def crear_usuario():
    try:
        # Validar datos de entrada
        data = usuario_schema.load(request.json)
        
        # Validar línea de trabajo
        lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']
        linea_trabajo = lineas_trabajo.find_one({'_id': ObjectId(data['linea_trabajo'])})
        
        if not linea_trabajo:
            return jsonify({
                "msg": "Línea de trabajo no encontrada", 
                "status": "error",
                "detalles": {"lineaTrabajo": ["Línea de trabajo no válida"]}
            }), 400
        
        # Validar contraseña
        validacion_contrasena = validar_contrasena(data['contrasena'])
        if not validacion_contrasena['valido']:
            return jsonify({
                "msg": "Contraseña inválida", 
                "status": "error",
                "detalles": {
                    "contrasena": validacion_contrasena['errores']
                }
            }), 400
        
        # Hash de contraseña
        salt = bcrypt.gensalt()
        data['contrasena'] = bcrypt.hashpw(data['contrasena'].encode('utf-8'), salt).decode('utf-8')
        
        # Verificar si ya existe un usuario con este correo
        usuarios = current_app.config['MONGO_DB']['usuarios']
        usuario_existente = usuarios.find_one({'correo_electronico': data['correo_electronico']})
        
        if usuario_existente:
            return jsonify({
                "msg": "Ya existe un usuario con este correo electrónico", 
                "status": "error",
                "detalles": {"correoElectronico": ["Correo electrónico ya registrado"]}
            }), 400
        
        # Insertar nuevo usuario
        data['fecha_registro'] = datetime.utcnow()
        
        # Asignar rol por defecto si no se especifica
        data['rol'] = data.get('rol', 'funcionario')
        
        resultado = usuarios.insert_one(data)
        
        return jsonify({
            "msg": "Usuario creado exitosamente", 
            "status": "success",
            "id": str(resultado.inserted_id)
        }), 201
    
    except ValidationError as err:
        return jsonify({
            "msg": "Error de validación", 
            "status": "error",
            "detalles": err.messages
        }), 400
    except Exception as e:
        return jsonify({
            "msg": f"Error al crear usuario: {str(e)}", 
            "status": "error"
        }), 500

@usuarios_bp.route('/listar', methods=['GET'])
def listar_usuarios():
    try:
        # Obtener la colección de usuarios
        usuarios = current_app.config['MONGO_DB']['usuarios']
        
        # Obtener todos los usuarios con su línea de trabajo
        pipeline = [
            {
                '$lookup': {
                    'from': 'lineas_trabajo',
                    'localField': 'linea_trabajo',
                    'foreignField': '_id',
                    'as': 'linea_trabajo_info'
                }
            },
            {
                '$unwind': '$linea_trabajo_info'
            },
            {
                '$project': {
                    '_id': {'$toString': '$_id'},
                    'nombre_completo': 1,
                    'correo_electronico': 1,
                    'rol': 1,
                    'linea_trabajo': {
                        '_id': {'$toString': '$linea_trabajo_info._id'},
                        'nombre': '$linea_trabajo_info.nombre'
                    },
                    'fecha_registro': 1
                }
            }
        ]
        
        usuarios_con_lineas = list(usuarios.aggregate(pipeline))
        
        return jsonify(usuarios_schema.dump(usuarios_con_lineas)), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al listar usuarios: {str(e)}"}), 500

@usuarios_bp.route('/funcionarios', methods=['GET'])
def listar_funcionarios():
    try:
        # Obtener la colección de usuarios
        usuarios = current_app.config['MONGO_DB']['usuarios']
        
        # Filtrar solo funcionarios
        pipeline = [
            {
                '$match': {'rol': 'funcionario'}
            },
            {
                '$lookup': {
                    'from': 'lineas_trabajo',
                    'localField': 'linea_trabajo',
                    'foreignField': '_id',
                    'as': 'linea_trabajo_info'
                }
            },
            {
                '$unwind': '$linea_trabajo_info'
            },
            {
                '$project': {
                    '_id': {'$toString': '$_id'},
                    'nombre_completo': 1,
                    'correo_electronico': 1,
                    'rol': 1,
                    'linea_trabajo': {
                        '_id': {'$toString': '$linea_trabajo_info._id'},
                        'nombre': '$linea_trabajo_info.nombre'
                    },
                    'fecha_registro': 1
                }
            }
        ]
        
        funcionarios = list(usuarios.aggregate(pipeline))
        
        return jsonify(usuarios_schema.dump(funcionarios)), 200
    
    except Exception as e:
        return jsonify({
            "msg": f"Error al listar funcionarios: {str(e)}",
            "status": "error"
        }), 500

@usuarios_bp.route('/actualizar/<id>', methods=['PUT'])
def actualizar_usuario(id):
    try:
        # Validar datos de entrada
        data = usuario_schema.load(request.json, partial=True)
        
        # Obtener la colección de usuarios
        usuarios = current_app.config['MONGO_DB']['usuarios']
        
        # Verificar si el usuario existe
        usuario_existente = usuarios.find_one({'_id': ObjectId(id)})
        if not usuario_existente:
            return jsonify({"msg": "Usuario no encontrado"}), 404
        
        # Validar línea de trabajo si se proporciona
        if 'linea_trabajo' in data:
            lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']
            linea_trabajo = lineas_trabajo.find_one({'_id': ObjectId(data['linea_trabajo'])})
            
            if not linea_trabajo:
                return jsonify({
                    "msg": "Línea de trabajo no encontrada", 
                    "status": "error",
                    "detalles": {"lineaTrabajo": ["Línea de trabajo no válida"]}
                }), 400
        
        # Validar contraseña si se proporciona
        if 'contrasena' in data:
            validacion_contrasena = validar_contrasena(data['contrasena'])
            if not validacion_contrasena['valido']:
                return jsonify({
                    "msg": "Contraseña inválida", 
                    "status": "error",
                    "detalles": {
                        "contrasena": validacion_contrasena['errores']
                    }
                }), 400
            
            # Hash de contraseña
            salt = bcrypt.gensalt()
            data['contrasena'] = bcrypt.hashpw(data['contrasena'].encode('utf-8'), salt).decode('utf-8')
        
        # Actualizar usuario
        resultado = usuarios.update_one(
            {'_id': ObjectId(id)}, 
            {'$set': data}
        )
        
        if resultado.modified_count == 0:
            return jsonify({"msg": "No se realizaron cambios"}), 200
        
        return jsonify({"msg": "Usuario actualizado exitosamente"}), 200
    
    except ValidationError as err:
        return jsonify({
            "msg": "Error de validación", 
            "status": "error",
            "detalles": err.messages
        }), 400
    except Exception as e:
        return jsonify({
            "msg": f"Error al actualizar usuario: {str(e)}", 
            "status": "error"
        }), 500

@usuarios_bp.route('/eliminar/<id>', methods=['DELETE'])
def eliminar_usuario(id):
    try:
        # Obtener la colección de usuarios
        usuarios = current_app.config['MONGO_DB']['usuarios']
        
        # Eliminar usuario
        resultado = usuarios.delete_one({'_id': ObjectId(id)})
        
        if resultado.deleted_count == 0:
            return jsonify({"msg": "Usuario no encontrado"}), 404
        
        return jsonify({"msg": "Usuario eliminado exitosamente"}), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al eliminar usuario: {str(e)}"}), 500
