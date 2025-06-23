from marshmallow import Schema, fields, validate, ValidationError, pre_load
import re
from bson import ObjectId
from datetime import datetime, date

class FuncionarioSchema(Schema):
    """
    Esquema de validación para funcionarios
    """
    nombre = fields.String(
        required=True, 
        validate=[
            validate.Length(min=2, max=100, error='El nombre debe tener entre 2 y 100 caracteres')
        ]
    )
    secretaría = fields.String(
        required=True, 
        validate=[
            validate.Length(min=2, max=100, error='La secretaría debe tener entre 2 y 100 caracteres'),
            validate.OneOf([
                'Administración General',
                'Desarrollo Social',
                'Educación',
                'Salud',
                'Infraestructura',
                'Medio Ambiente',
                'Seguridad',
                'Cultura'
            ], error='Secretaría no válida')
        ]
    )
    email = fields.Email(
        required=True, 
        error_messages={'invalid': 'Formato de correo electrónico inválido'}
    )
    password = fields.String(
        required=True, 
        validate=[
            validate.Length(
                min=8, 
                error='La contraseña debe tener al menos 8 caracteres'
            )
        ],
        load_only=True
    )
    linea_trabajo = fields.String(
        required=True,
        validate=[
            validate.Length(min=1, error='ID de línea de trabajo inválido')
        ]
    )
    rol = fields.String(
        required=True, 
        validate=[
            validate.OneOf(
                ['funcionario', 'admin'], 
                error='Rol inválido. Debe ser funcionario o admin'
            )
        ]
    )
    telefono = fields.String(
        required=False,
        validate=[
            validate.Regexp(r'^\+?1?\d{9,15}$', error='Número de teléfono inválido')
        ]
    )
    fecha_ingreso = fields.DateTime(
        required=False, 
        dump_default=datetime.utcnow,
        format='%Y-%m-%d'
    )
    fecha_registro = fields.DateTime(
        required=False, 
        missing=datetime.utcnow,
        dump_only=True
    )
    estado = fields.String(
        required=False,
        validate=[
            validate.OneOf(
                ['Activo', 'Inactivo'], 
                error='Estado inválido. Debe ser Activo o Inactivo'
            )
        ],
        missing='Activo'
    )
    ultima_actualizacion = fields.DateTime(dump_only=True, dump_default=datetime.utcnow)

    def validate_linea_trabajo(self, data):
        """
        Validar que linea_trabajo sea un ObjectId válido
        """
        try:
            if data:
                ObjectId(data)
        except Exception:
            raise ValidationError('ID de línea de trabajo inválido')

    def validate_password(self, value):
        """
        Validaciones adicionales para contraseña
        """
        if value:
            if not re.search(r'[A-Z]', value):
                raise ValidationError('La contraseña debe contener al menos una letra mayúscula')
            if not re.search(r'[a-z]', value):
                raise ValidationError('La contraseña debe contener al menos una letra minúscula')
            if not re.search(r'\d', value):
                raise ValidationError('La contraseña debe contener al menos un número')
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
                raise ValidationError('La contraseña debe contener al menos un carácter especial')

# Crear instancia del esquema
funcionario_schema = FuncionarioSchema()
funcionarios_schema = FuncionarioSchema(many=True)
