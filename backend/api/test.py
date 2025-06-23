import json

def test_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': '¡Backend funcionando correctamente!',
            'event': event
        })
    }
