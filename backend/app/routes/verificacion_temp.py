from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId

verificacion_temp_bp = Blueprint('verificacion_temp', __name__)

@verificacion_temp_bp.route('/api/verificar', methods=['GET'])
def verificar_beneficiario_temp():
    try:
        # Obtener parámetros de la solicitud
        documento = request.args.get('documento')
        codigo_verificacion = request.args.get('codigo_verificacion')

        print(f"🔍 Búsqueda temporal - Documento: {documento}, Código: {codigo_verificacion}")
        
        # Validar que se proporcionen los parámetros
        if not documento or not codigo_verificacion:
            return jsonify({"msg": "Documento y código de verificación son requeridos"}), 400

        # Obtener colección de beneficiarios
        db = current_app.config['MONGO_DB']
        beneficiarios = db['beneficiarios']
        
        # Buscar por documento
        beneficiario = beneficiarios.find_one({'numero_documento': documento})
        
        if not beneficiario:
            print("❌ No se encontró ningún beneficiario con ese documento")
            return jsonify({"msg": "Beneficiario no encontrado"}), 404
            
        print("✅ Documento encontrado. Verificando código...")
        
        # Función para normalizar códigos (eliminar espacios, convertir a mayúsculas)
        def normalizar_codigo(codigo):
            if not codigo:
                return ""
            return str(codigo).strip().upper()

        # Obtener códigos de todas las ubicaciones posibles
        posibles_codigos = []
        
        # 1. Buscar en datos_biometricos.codigo_verificacion
        if 'datos_biometricos' in beneficiario and isinstance(beneficiario['datos_biometricos'], dict):
            bio_code = beneficiario['datos_biometricos'].get('codigo_verificacion')
            if bio_code:
                posibles_codigos.append(normalizar_codigo(bio_code))
        
        # 2. Buscar en la raíz del documento
        if 'codigo_verificacion' in beneficiario:
            root_code = beneficiario['codigo_verificacion']
            if root_code:
                posibles_codigos.append(normalizar_codigo(root_code))
        
        # 3. Buscar en huella_dactilar si existe
        if 'huella_dactilar' in beneficiario and isinstance(beneficiario['huella_dactilar'], dict):
            huella_code = beneficiario['huella_dactilar'].get('codigo_verificacion')
            if huella_code:
                posibles_codigos.append(normalizar_codigo(huella_code))
        
        print(f"🔍 Códigos encontrados: {posibles_codigos}")
        print(f"🔍 Código a verificar: {normalizar_codigo(codigo_verificacion)}")
        
        # Verificar si el código proporcionado coincide con alguno de los encontrados
        codigo_normalizado = normalizar_codigo(codigo_verificacion)
        if not any(codigo == codigo_normalizado for codigo in posibles_codigos if codigo):
            print(f"❌ Ningún código coincide. Códigos en BD: {posibles_codigos}")
            return jsonify({
                "msg": "Código de verificación inválido",
                "debug": {
                    "documento_encontrado": True,
                    "codigos_encontrados": posibles_codigos,
                    "codigo_proporcionado": codigo_verificacion,
                    "codigo_normalizado": codigo_normalizado
                }
            }), 400
            
        # Si llegamos aquí, la verificación fue exitosa
        print("✅ Verificación exitosa")
        return jsonify({
            "msg": "Verificación exitosa",
            "beneficiario": {
                "nombre_completo": beneficiario.get('nombre_completo', 'Nombre no disponible'),
                "numero_documento": beneficiario.get('numero_documento', ''),
                "fecha_registro": str(beneficiario.get('fecha_registro', ''))
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error en verificación temporal: {str(e)}")
        return jsonify({"msg": f"Error en el servidor: {str(e)}"}), 500
