#!/bin/bash

# Install Python dependencies in the Vercel environment
pip install --upgrade pip
pip install -r api/requirements.txt

# Create a simple WSGI server file for Vercel
cat > vercel_wsgi.py << 'EOL'
from api.index import handler as api_handler

def app(environ, start_response):
    # Convert WSGI environ to Vercel event format
    event = {
        'httpMethod': environ.get('REQUEST_METHOD', 'GET'),
        'path': environ.get('PATH_INFO', '/'),
        'headers': {k.upper().replace('-', '_'): v for k, v in environ.items() if k.startswith('HTTP_')},
        'queryStringParameters': {k: v[0] for k, v in environ.get('QUERY_STRING', '').split('&') if '=' in v}
    }
    
    # Read request body if present
    try:
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        if content_length > 0:
            event['body'] = environ['wsgi.input'].read(content_length).decode('utf-8')
    except:
        pass
    
    # Call the handler
    response = api_handler(event, {})
    
    # Convert response to WSGI format
    status = f"{response['statusCode']} {response.get('statusDescription', 'OK')}"
    headers = [(k, v) for k, v in response.get('headers', {}).items()]
    body = [response.get('body', '').encode('utf-8')]
    
    start_response(status, headers)
    return body
EOL

echo "Build completed successfully!"

# Make the build script executable
chmod +x vercel-build.sh
