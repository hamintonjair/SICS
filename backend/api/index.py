from run import app
from flask import request, jsonify
import json

def handler(event, context):
    # Este manejador es necesario para que Vercel pueda ejecutar la aplicación Flask
    from werkzeug.test import create_environ
    from werkzeug.wsgi import ClosingIterator
    from io import BytesIO
    
    # Crear un entorno de solicitud a partir del evento de Vercel
    environ = create_environ(
        path=event.get('path', '/'),
        method=event.get('httpMethod', 'GET'),
        headers=dict(event.get('headers', {})),
        query_string=event.get('queryStringParameters', {}),
        input_stream=BytesIO(event.get('body', '').encode('utf-8') if event.get('body') else b'')
    )
    
    # Capturar la respuesta
    response_headers = {}
    response_body = []
    
    def start_response(status, headers, exc_info=None):
        nonlocal response_headers
        response_headers['status'] = status
        response_headers['headers'] = dict(headers)
        return response_body.append
    
    # Ejecutar la aplicación Flask
    with app.request_context(environ):
        try:
            response = app.full_dispatch_request()
            
            # Obtener el código de estado y los encabezados
            status_code = response.status_code
            headers = dict(response.headers)
            
            # Obtener el cuerpo de la respuesta
            body = response.get_data(as_text=True)
            
            # Devolver la respuesta en el formato que espera Vercel
            return {
                'statusCode': status_code,
                'headers': headers,
                'body': body
            }
            
        except Exception as e:
            # Manejar errores
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
