import json
import logging
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

def simple_handler(event, context):
    """Simple handler for testing Vercel deployment"""
    logger.info("Simple handler called")
    logger.info(f"Event: {json.dumps(event, default=str)[:500]}...")
    
    try:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({
                'status': 'success',
                'message': '¡Backend funcionando correctamente!',
                'path': event.get('path', '/'),
                'method': event.get('httpMethod', 'GET')
            })
        }
    except Exception as e:
        logger.error(f"Error in handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': str(e)
            })
        }

# Use the simple handler for now
handler = simple_handler
