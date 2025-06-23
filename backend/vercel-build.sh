#!/bin/bash
set -e  # Exit on error

# Install Python 3.9 specifically
pyenv install -s 3.9.18
pyenv global 3.9.18

# Update pip and setuptools
python -m pip install --upgrade pip setuptools wheel

# Install only binary packages to avoid compilation
pip install --only-binary :all: -r api/requirements.txt

# Create a simple WSGI server file for Vercel
cat > vercel_wsgi.py << 'EOL'
from api.index import handler as api_handler

def app(environ, start_response):
    try:
        # Convert WSGI environ to Vercel event format
        event = {
            'httpMethod': environ.get('REQUEST_METHOD', 'GET'),
            'path': environ.get('PATH_INFO', '/'),
            'headers': {k.upper().replace('-', '_'): v for k, v in environ.items() if k.startswith('HTTP_')},
            'queryStringParameters': dict(pair.split('=') for pair in environ.get('QUERY_STRING', '').split('&') if '=' in pair)
        }
        
        # Read request body if present
        try:
            content_length = int(environ.get('CONTENT_LENGTH', 0))
            if content_length > 0:
                event['body'] = environ['wsgi.input'].read(content_length).decode('utf-8')
        except Exception as e:
            print(f"Error reading request body: {str(e)}")
        
        # Call the handler
        response = api_handler(event, {})
        
        # Convert response to WSGI format
        status = f"{response['statusCode']} {response.get('statusDescription', 'OK')}"
        headers = [(k, v) for k, v in response.get('headers', {}).items()]
        body = [response.get('body', '').encode('utf-8')]
        
        start_response(status, headers)
        return body
        
    except Exception as e:
        print(f"Error in WSGI app: {str(e)}")
        start_response('500 Internal Server Error', [('Content-Type', 'application/json')])
        return [json.dumps({'error': 'Internal Server Error', 'message': str(e)}).encode('utf-8')]
EOL

echo "Build completed successfully!"

# Make the build script executable
chmod +x vercel-build.sh
