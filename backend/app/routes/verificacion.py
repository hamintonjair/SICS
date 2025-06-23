from flask import Blueprint, request, current_app
from app.controllers.verificacion_controller import VerificacionController
from app.middleware.auth import token_required

bp = Blueprint('verificacion', __name__)
controller = None

@bp.before_request
def before_request():
    global controller
    if not controller:
        controller = VerificacionController(current_app.config['db'])

@bp.route('/registrar/<string:beneficiario_id>', methods=['POST'])
@token_required
def registrar_verificacion(beneficiario_id):
    """Registrar una nueva verificación biométrica"""
    datos = request.get_json()
    return controller.registrar_verificacion(beneficiario_id, datos)

@bp.route('/verificar/<string:codigo>', methods=['GET'])
def verificar_registro(codigo):
    """Verificar un registro usando su código QR"""
    return controller.verificar_registro(codigo)
