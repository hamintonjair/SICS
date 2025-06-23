import os

class Config:
    # Configuración de la base de datos
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    DATABASE_NAME = os.environ.get('DATABASE_NAME', 'red_inclusion')

    # Configuración de JWT
    SECRET_KEY = os.environ.get('SECRET_KEY', 'desarrollo_red_inclusion_2024')
    JWT_SECRET_KEY = SECRET_KEY

    # Otras configuraciones
    DEBUG = os.environ.get('FLASK_DEBUG', True)
    TESTING = os.environ.get('FLASK_TESTING', False)

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        return ProductionConfig
    elif env == 'testing':
        return TestingConfig
    else:
        return DevelopmentConfig
