from http.server import BaseHTTPRequestHandler
from http.server import HTTPServer
import json

def handler(request, context):
    # Configurar las cabeceras de la respuesta
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }

    # Manejar la solicitud
    if request['httpMethod'] == 'GET':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'API en funcionamiento'})
        }
    elif request['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    else:
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Método no permitido'})
        }
