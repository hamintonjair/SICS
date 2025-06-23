from flask import Flask, jsonify, request
import os

# Inicializar la aplicación Flask
app = Flask(__name__)

# Configuración básica
app.config['JSON_SORT_KEYS'] = False

# Ruta de prueba
@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': '¡Backend funcionando correctamente en Vercel!',
        'framework': 'Flask',
        'version': '2.2.5'
    })

# Ruta de ejemplo para la API
@app.route('/api/hello')
def hello():
    return jsonify({
        'message': '¡Hola desde la API!',
        'status': 'success'
    })

# Manejador para errores 404
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Ruta no encontrada',
        'error': str(error)
    }), 404

# Manejador para errores 500
@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Error interno del servidor',
        'error': str(error)
    }), 500

# Adaptador para Vercel Serverless Functions
def handler(event, context):
    from werkzeug.wsgi import DispatcherMiddleware
    from werkzeug.serving import run_simple
    
    # Crear una aplicación WSGI simple que envuelva a Flask
    wsgi_app = DispatcherMiddleware(app, {
        '/api': app
    })
    
    # Procesar la solicitud
    environ = event
    environ['PATH_INFO'] = environ.get('PATH_INFO', '/').replace('/api', '', 1) or '/'
    
    # Inicializar la respuesta
    response = {'statusCode': 200, 'headers': {}}
    
    # Función para capturar la respuesta
    def start_response(status, headers, exc_info=None):
        response['statusCode'] = int(status.split(' ')[0])
        response['headers'] = dict(headers)
        return lambda data: None
    
    # Procesar la solicitud
    from io import BytesIO
    from werkzeug.wsgi import get_input_stream
    
    environ['wsgi.input'] = BytesIO(event.get('body', '').encode('utf-8'))
    
    # Ejecutar la aplicación
    from werkzeug.test import run_wsgi_app
    result = run_wsgi_app(app, environ, start_response, False)
    
    # Obtener el cuerpo de la respuesta
    try:
        body = b''.join(result).decode('utf-8')
    except:
        body = str(b''.join(result))
    
    # Asegurar encabezados CORS
    headers = response.get('headers', {})
    headers.update({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    
    return {
        'statusCode': response['statusCode'],
        'headers': headers,
        'body': body
    }

# Solo para pruebas locales
if __name__ == '__main__':
    app.run(debug=True, port=5000)
