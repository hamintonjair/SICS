from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from app.models.beneficiario import BeneficiarioModel
import logging
import re

beneficiario_bp = Blueprint('beneficiario', __name__)

@beneficiario_bp.route('/estadisticas/<linea_trabajo_id>', methods=['GET'])
@jwt_required()
def obtener_estadisticas_beneficiarios(linea_trabajo_id):
    """
    Obtener estadísticas de beneficiarios por línea de trabajo
    """
    try:
        current_app.logger.info(f"Solicitando estadísticas para línea de trabajo: {linea_trabajo_id}")
        
        db = current_app.config['db']
        beneficiario_model = BeneficiarioModel(db)
        
        # Convertir a ObjectId
        linea_trabajo_obj_id = ObjectId(linea_trabajo_id)
        
        # Verificar si la línea de trabajo existe
        linea_trabajo = db['lineas_trabajo'].find_one({'_id': linea_trabajo_obj_id})
        if not linea_trabajo:
            current_app.logger.warning(f"Línea de trabajo no encontrada: {linea_trabajo_id}")
            return jsonify({
                "status": "error",
                "msg": f"Línea de trabajo {linea_trabajo_id} no encontrada"
            }), 404
        
        # Obtener estadísticas
        estadisticas = beneficiario_model.obtener_estadisticas_por_linea_trabajo(linea_trabajo_obj_id)
        
        current_app.logger.info(f"Estadísticas obtenidas: {estadisticas}")
        return jsonify({
            "status": "success",
            "estadisticas": estadisticas
        }), 200
    
    except ValueError as ve:
        current_app.logger.error(f"Error de validación: {str(ve)}")
        return jsonify({
            "status": "error",
            "msg": str(ve)
        }), 400
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener estadísticas de beneficiarios: {str(e)}")
        return jsonify({
            "status": "error",
            "msg": "Error al obtener estadísticas de beneficiarios"
        }), 500

@beneficiario_bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def obtener_estadisticas_beneficiarios_todos():
    try:
        db = current_app.config['db']
        beneficiario_model = BeneficiarioModel(db)
        estadisticas = beneficiario_model.obtener_estadisticas_globales_admin()

        return jsonify({
            "status": "success",
            "estadisticas": estadisticas
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "msg": "Error al obtener estadísticas generales de beneficiarios"
        }), 500

@beneficiario_bp.route('/verificar', methods=['GET'])
def verificar_beneficiario():
    try:
        # Obtener parámetros de la solicitud
        documento = request.args.get('documento')
        codigo_verificacion = request.args.get('codigo_verificacion')

        # Validar que se proporcionen los parámetros
        if not documento or not codigo_verificacion:
            return jsonify({"msg": "Documento y código de verificación son requeridos"}), 400

        # Obtener colecciones
        db = current_app.config['db']
        beneficiarios = db['beneficiarios']

        print(f"Iniciando verificación para documento: {documento}, código: {codigo_verificacion}")
        
        # 1. Buscar primero solo por documento
        query_doc = {'numero_documento': documento}
        print(f"Buscando documento: {query_doc}")
        
        beneficiario_por_doc = beneficiarios.find_one(query_doc)
        if not beneficiario_por_doc:
            print("❌ No se encontró ningún beneficiario con ese documento")
            return jsonify({"msg": "Beneficiario no encontrado"}), 404
            
        print("✅ Documento encontrado. Campos del documento:", list(beneficiario_por_doc.keys()))
        
        # Función para normalizar códigos (eliminar espacios, convertir a mayúsculas)
        def normalizar_codigo(codigo):
            if not codigo:
                return ""
            return str(codigo).strip().upper()

        # Obtener códigos de todas las ubicaciones posibles
        posibles_codigos = []
        
        # 1. Buscar en datos_biometricos.codigo_verificacion
        if 'datos_biometricos' in beneficiario_por_doc and isinstance(beneficiario_por_doc['datos_biometricos'], dict):
            bio_code = beneficiario_por_doc['datos_biometricos'].get('codigo_verificacion')
            if bio_code:
                posibles_codigos.append(normalizar_codigo(bio_code))
        
        # 2. Buscar en la raíz del documento
        if 'codigo_verificacion' in beneficiario_por_doc:
            root_code = beneficiario_por_doc['codigo_verificacion']
            if root_code:
                posibles_codigos.append(normalizar_codigo(root_code))
        
        # 3. Buscar en huella_dactilar si existe
        if 'huella_dactilar' in beneficiario_por_doc and isinstance(beneficiario_por_doc['huella_dactilar'], dict):
            huella_code = beneficiario_por_doc['huella_dactilar'].get('codigo_verificacion')
            if huella_code:
                posibles_codigos.append(normalizar_codigo(huella_code))
        
        print(f"🔍 Códigos encontrados: {posibles_codigos}")
        print(f"🔍 Código a verificar: {normalizar_codigo(codigo_verificacion)}")
        
        # Verificar si el código proporcionado coincide con alguno de los encontrados
        codigo_normalizado = normalizar_codigo(codigo_verificacion)
        if not any(codigo == codigo_normalizado for codigo in posibles_codigos if codigo):
            print(f"❌ Ningún código coincide. Códigos en BD: {posibles_codigos}")
            return jsonify({"msg": "Código de verificación inválido"}), 400
            
        # Si llegamos aquí, la verificación fue exitosa
        print("✅ Verificación exitosa")
        return jsonify({
            "msg": "Verificación exitosa",
            "beneficiario": {
                "nombre_completo": beneficiario_por_doc.get('nombre_completo', 'Nombre no disponible'),
                "numero_documento": beneficiario_por_doc.get('numero_documento', ''),
                "fecha_registro": str(beneficiario_por_doc.get('fecha_registro', ''))
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error en verificación: {str(e)}")
        return jsonify({"msg": f"Error en el servidor: {str(e)}"}), 500
