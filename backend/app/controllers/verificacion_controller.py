from flask import jsonify
from bson import ObjectId
import secrets
import string

def generar_codigo_verificacion(length=10):
    """Genera un código único para verificación"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

class VerificacionController:
    def __init__(self, db):
        self.db = db
        self.beneficiarios = db['beneficiarios']

    def registrar_verificacion(self, beneficiario_id, datos_verificacion):
        """
        Registra una nueva verificación biométrica
        """
        try:
            # Generar código único de verificación
            codigo = f"RDI-{generar_codigo_verificacion()}"
            
            # Preparar datos de verificación
            verificacion = {
                "verificacion_biometrica": {
                    "credential_id": datos_verificacion["credential_id"],
                    "public_key": datos_verificacion["public_key"],
                    "fecha_registro": datos_verificacion["fecha_registro"],
                    "tipo_verificacion": datos_verificacion["tipo_verificacion"],
                    "estado": "verificado",
                    "dispositivo": datos_verificacion.get("dispositivo", {}),
                    "metadata": datos_verificacion.get("metadata", {})
                },
                "codigo_verificacion": codigo
            }
            
            # Actualizar beneficiario
            result = self.beneficiarios.update_one(
                {"_id": ObjectId(beneficiario_id)},
                {"$set": verificacion}
            )
            
            if result.modified_count == 0:
                return {"error": "No se pudo registrar la verificación"}, 400
                
            return {
                "mensaje": "Verificación registrada exitosamente",
                "codigo": codigo
            }, 200
            
        except Exception as e:
            return {"error": str(e)}, 500

    def verificar_registro(self, codigo):
        """
        Verifica un registro usando su código
        """
        try:
            # Buscar beneficiario por código
            beneficiario = self.beneficiarios.find_one({"codigo_verificacion": codigo})
            
            if not beneficiario:
                return {"error": "Código de verificación no válido"}, 404
                
            # Preparar respuesta con datos relevantes
            respuesta = {
                "estado": "verificado",
                "beneficiario": {
                    "nombre": beneficiario["nombre_completo"],
                    "documento": beneficiario["numero_documento"],
                    "fecha_registro": beneficiario["fecha_registro"],
                    "funcionario": beneficiario["funcionario_nombre"],
                    "verificacion": {
                        "tipo": beneficiario["verificacion_biometrica"]["tipo_verificacion"],
                        "fecha": beneficiario["verificacion_biometrica"]["fecha_registro"],
                        "estado": beneficiario["verificacion_biometrica"]["estado"]
                    }
                },
                "codigo": codigo
            }
            
            return respuesta, 200
            
        except Exception as e:
            return {"error": str(e)}, 500
