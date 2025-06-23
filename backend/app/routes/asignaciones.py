from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from marshmallow import ValidationError
from ..models.asignacion_linea import asignacion_linea_schema, asignaciones_linea_schema

asignaciones_bp = Blueprint('asignaciones', __name__)

@asignaciones_bp.route('/crear', methods=['POST'])
@jwt_required()
def crear_asignacion():
    try:
        # Verificar rol del usuario
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})
        
        if funcionario['rol'] not in ['admin', 'usuario']:
            return jsonify({"msg": "No tienes permisos para crear asignaciones"}), 403
        
        data = request.get_json()
        
        try:
            asignacion = asignacion_linea_schema.load(data)
        except ValidationError as err:
            return jsonify({"msg": "Error de validación", "errores": err.messages}), 400
        
        # Verificar que los IDs existan
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']
        
        if not beneficiarios.find_one({'_id': ObjectId(asignacion['beneficiario_id'])}):
            return jsonify({"msg": "Beneficiario no encontrado"}), 404
        
        if not lineas_trabajo.find_one({'_id': ObjectId(asignacion['linea_trabajo_id'])}):
            return jsonify({"msg": "Línea de trabajo no encontrada"}), 404
        
        asignaciones = current_app.config['MONGO_DB']['asignaciones']
        result = asignaciones.insert_one(asignacion)
        
        return jsonify({
            "msg": "Asignación creada exitosamente", 
            "asignacion_id": str(result.inserted_id)
        }), 201
    
    except Exception as e:
        return jsonify({"msg": f"Error al crear asignación: {str(e)}"}), 500

@asignaciones_bp.route('/listar', methods=['GET'])
@jwt_required()
def listar_asignaciones():
    try:
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})
        
        asignaciones = current_app.config['MONGO_DB']['asignaciones']
        
        # Si es admin, muestra todas las asignaciones
        if funcionario['rol'] == 'admin':
            lista_asignaciones = list(asignaciones.find())
        else:
            # Si es usuario, muestra solo sus asignaciones
            lista_asignaciones = list(asignaciones.find({'funcionario_id': funcionario_id}))
        
        for asignacion in lista_asignaciones:
            asignacion['_id'] = str(asignacion['_id'])
            asignacion['beneficiario_id'] = str(asignacion['beneficiario_id'])
            asignacion['linea_trabajo_id'] = str(asignacion['linea_trabajo_id'])
        
        return jsonify({
            "asignaciones": lista_asignaciones,
            "total": len(lista_asignaciones)
        }), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al listar asignaciones: {str(e)}"}), 500

@asignaciones_bp.route('/editar/<asignacion_id>', methods=['PUT'])
@jwt_required()
def editar_asignacion(asignacion_id):
    try:
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})
        
        if funcionario['rol'] not in ['admin', 'usuario']:
            return jsonify({"msg": "No tienes permisos para editar asignaciones"}), 403
        
        data = request.get_json()
        
        try:
            asignacion = asignacion_linea_schema.load(data, partial=True)
        except ValidationError as err:
            return jsonify({"msg": "Error de validación", "errores": err.messages}), 400
        
        asignaciones = current_app.config['MONGO_DB']['asignaciones']
        result = asignaciones.update_one(
            {'_id': ObjectId(asignacion_id)}, 
            {'$set': asignacion}
        )
        
        if result.modified_count == 0:
            return jsonify({"msg": "Asignación no encontrada"}), 404
        
        return jsonify({"msg": "Asignación actualizada exitosamente"}), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al editar asignación: {str(e)}"}), 500

@asignaciones_bp.route('/eliminar/<asignacion_id>', methods=['DELETE'])
@jwt_required()
def eliminar_asignacion(asignacion_id):
    try:
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})
        
        if funcionario['rol'] != 'admin':
            return jsonify({"msg": "No tienes permisos para eliminar asignaciones"}), 403
        
        asignaciones = current_app.config['MONGO_DB']['asignaciones']
        result = asignaciones.delete_one({'_id': ObjectId(asignacion_id)})
        
        if result.deleted_count == 0:
            return jsonify({"msg": "Asignación no encontrada"}), 404
        
        return jsonify({"msg": "Asignación eliminada exitosamente"}), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al eliminar asignación: {str(e)}"}), 500
