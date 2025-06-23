from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import sys

# Añadir el directorio del backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Importar la aplicación Flask
from app import app

def handler(event, context):
    # Crear un manejador de solicitud HTTP
    class RequestHandler(BaseHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            self.request = event
            self.response_headers = {}
            self.status_code = 200
            super().__init__(*args, **kwargs)
        
        def send_response(self, code, message=None):
            self.status_code = code
        
        def send_header(self, key, value):
            self.response_headers[key] = value
        
        def end_headers(self):
            pass
        
        def do_GET(self):
            self.handle_request('GET')
        
        def do_POST(self):
            self.handle_request('POST')
        
        def do_PUT(self):
            self.handle_request('PUT')
        
        def do_DELETE(self):
            self.handle_request('DELETE')
        
        def handle_request(self, method):
            # Configurar el entorno de la solicitud
            environ = {
                'REQUEST_METHOD': method,
                'PATH_INFO': event['path'],
                'QUERY_STRING': event.get('rawQuery', ''),
                'SERVER_PROTOCOL': 'HTTP/1.1',
                'wsgi.input': event.get('body', ''),
                'wsgi.errors': sys.stderr,
                'wsgi.version': (1, 0),
                'wsgi.url_scheme': 'https',
                'wsgi.multithread': False,
                'wsgi.multiprocess': False,
                'wsgi.run_once': False,
            }
            
            # Ejecutar la aplicación Flask
            response = app(environ, self.start_response)
            
            # Construir la respuesta
            body = b''.join([chunk for chunk in response])
            
            self.response = {
                'statusCode': self.status_code,
                'headers': self.response_headers,
                'body': body.decode('utf-8')
            }
        
        def start_response(self, status, response_headers, exc_info=None):
            self.status_code = int(status.split(' ')[0])
            for header, value in response_headers:
                self.response_headers[header] = value
            return lambda data: None
    
    # Crear y ejecutar el manejador
    handler = RequestHandler(None, None, None)
    handler.handle_request(event['httpMethod'])
    
    return handler.response
