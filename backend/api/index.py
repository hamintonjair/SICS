import os
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from run import app
from flask import request, jsonify
import json

def handler(event, context):
    # This handler is needed for Vercel to run the Flask app
    from werkzeug.test import create_environ
    from werkzeug.wsgi import ClosingIterator
    from io import BytesIO
    
    # Parse the incoming event
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {})
    body = event.get('body', '')
    
    # Create a WSGI environment
    environ = create_environ(
        path=path,
        method=http_method,
        headers=headers,
        query_string=query_params,
        input_stream=BytesIO(body.encode('utf-8') if body else b'')
    )
    
    # Set the Content-Type header if not present
    if 'Content-Type' not in environ.get('HTTP_CONTENT_TYPE', ''):
        environ['CONTENT_TYPE'] = 'application/json'
    
    # Set the Authorization header if present
    if 'authorization' in headers:
        environ['HTTP_AUTHORIZATION'] = headers['authorization']
    
    # Initialize response variables
    response_headers = {}
    response_body = []
    
    def start_response(status, headers, exc_info=None):
        nonlocal response_headers
        # Convert status code to int (e.g., '200 OK' -> 200)
        response_headers['status'] = int(status.split(' ')[0])
        response_headers['headers'] = dict(headers)
        return response_body.append
    
    # Execute the Flask app
    try:
        with app.request_context(environ):
            response = app.full_dispatch_request()
            
            # Get response data
            status_code = response.status_code
            headers = dict(response.headers)
            
            # Ensure CORS headers are set
            headers['Access-Control-Allow-Origin'] = '*'
            headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            
            # Get response body
            try:
                body = response.get_data(as_text=True)
            except:
                body = str(response.get_data())
            
            # Return the response in Vercel's expected format
            return {
                'statusCode': status_code,
                'headers': headers,
                'body': body
            }
            
    except Exception as e:
        import traceback
        print(f"Error processing request: {str(e)}")
        print(traceback.format_exc())
        
        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': str(e),
                'type': type(e).__name__
            })
        }
