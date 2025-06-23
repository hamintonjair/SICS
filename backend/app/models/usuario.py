from datetime import datetime
from bson import ObjectId
from marshmallow import Schema, fields, validate, ValidationError

class UsuarioSchema(Schema):
    _id = fields.Str(dump_only=True)
    nombre_completo = fields.Str(required=True, validate=validate.Length(min=3))
    correo_electronico = fields.Email(required=True)
    numero_documento = fields.Str(required=True)
    contrasena = fields.Str(required=True, load_only=True)
    rol = fields.Str(validate=validate.OneOf(['funcionario', 'admin']), required=True)
    linea_trabajo = fields.Str(required=True)
    fecha_registro = fields.DateTime(dump_only=True)

class Usuario:
    def __init__(self, db):
        self.collection = db['usuarios']

    def registrar_usuario(self, datos):
        # Verificar si ya existe un usuario con ese documento
        if self.collection.find_one({'numero_documento': datos['numero_documento']}):
            raise ValueError("Ya existe un usuario con este documento")
        
        datos['fecha_registro'] = datetime.now()
        resultado = self.collection.insert_one(datos)
        return str(resultado.inserted_id)

    def obtener_usuarios(self):
        usuarios = list(self.collection.find())
        for usuario in usuarios:
            usuario['id'] = str(usuario['_id'])
            del usuario['_id']
        return usuarios

    def obtener_usuario_por_id(self, usuario_id):
        usuario = self.collection.find_one({'_id': ObjectId(usuario_id)})
        
        if usuario:
            usuario['id'] = str(usuario['_id'])
            del usuario['_id']
            return usuario
        
        return None

# Crear instancias de esquema
usuario_schema = UsuarioSchema()
usuarios_schema = UsuarioSchema(many=True)
