from marshmallow import Schema, fields, validate
from bson.objectid import ObjectId
from datetime import datetime

class AsignacionLineaSchema(Schema):
    beneficiario_id = fields.Str(required=True, validate=lambda n: ObjectId.is_valid(n))
    linea_trabajo_id = fields.Str(required=True, validate=lambda n: ObjectId.is_valid(n))
    funcionario_id = fields.Str(required=True, validate=lambda n: ObjectId.is_valid(n))
    fecha_asignacion = fields.DateTime(missing=datetime.utcnow)
    estado = fields.Str(validate=validate.OneOf([
        'Activo', 
        'Suspendido', 
        'Completado', 
        'En Proceso'
    ]), missing='Activo')
    observaciones = fields.Str(validate=validate.Length(max=500), allow_none=True)

asignacion_linea_schema = AsignacionLineaSchema()
asignaciones_linea_schema = AsignacionLineaSchema(many=True)
