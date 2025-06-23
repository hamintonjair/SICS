from flask import jsonify

def success_response(data, status_code=200):
    """
    Genera una respuesta de éxito estandarizada
    
    :param data: Datos a devolver en la respuesta
    :param status_code: Código de estado HTTP (por defecto 200)
    :return: Respuesta JSON con datos y estado de éxito
    """
    return jsonify({
        'status': 'success',
        'data': data
    }), status_code

def error_response(message, status_code=400):
    """
    Genera una respuesta de error estandarizada
    
    :param message: Mensaje de error
    :param status_code: Código de estado HTTP (por defecto 400)
    :return: Respuesta JSON con mensaje de error
    """
    return jsonify({
        'status': 'error',
        'message': message
    }), status_code
