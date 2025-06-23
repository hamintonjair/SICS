import os
import sys
import json
import traceback
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

# Configure logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from run import app
    logger.info("Flask app imported successfully")
except Exception as e:
    logger.error(f"Error importing Flask app: {str(e)}")
    logger.error(traceback.format_exc())
    raise

def handler(event, context):
    logger.info(f"Received event: {json.dumps(event, default=str)[:500]}...")
    
    try:
        from werkzeug.test import create_environ
        from werkzeug.wsgi import ClosingIterator
        from io import BytesIO
    except ImportError as e:
        logger.error(f"Import error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Server configuration error', 'message': str(e)})
        }
    
    try:
        # Parse the incoming event
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        headers = event.get('headers', {}) or {}
        query_params = event.get('queryStringParameters', {}) or {}
        body = event.get('body', '')
        
        logger.info(f"Processing {http_method} {path}")
    except Exception as e:
        logger.error(f"Error parsing event: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid request', 'message': str(e)})
        }
    
    try:
        # Create a WSGI environment
        environ = create_environ(
            path=path,
            method=http_method,
            headers=headers,
            query_string=query_params,
            input_stream=BytesIO(body.encode('utf-8') if body else b'')
        )
    except Exception as e:
        logger.error(f"Error creating WSGI environment: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Server error', 'message': str(e)})
        }
    
    # Set headers
    environ['CONTENT_TYPE'] = headers.get('content-type', 'application/json')
    
    # Copy headers to environ
    for key, value in headers.items():
        if key.lower() == 'content-type':
            continue
        wsgi_key = 'HTTP_' + key.upper().replace('-', '_')
        environ[wsgi_key] = value
    
    # Set default content type if not set
    if 'CONTENT_TYPE' not in environ:
        environ['CONTENT_TYPE'] = 'application/json'
    
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
