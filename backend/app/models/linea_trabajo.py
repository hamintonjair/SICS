from marshmallow import Schema, fields, validate
from datetime import datetime
from bson import ObjectId
import logging

class LineaTrabajoSchema(Schema):
    nombre = fields.Str(required=True, validate=[
        validate.Length(min=2, max=100),
        validate.Regexp(r"^[\w\sáéíóúÁÉÍÓÚñÑ,\.\-¡!¿?()'\"]+$", error='Solo se permiten letras, números, espacios y signos de puntuación comunes')
    ])
    descripcion = fields.Str(validate=validate.Length(max=500), required=False, allow_none=True)
    fecha_creacion = fields.DateTime(dump_default=datetime.utcnow)
    estado = fields.Str(validate=validate.OneOf(['Activo', 'Inactivo']), dump_default='Activo')
    responsable = fields.Str(required=False, allow_none=True)  # ID del funcionario responsable

linea_trabajo_schema = LineaTrabajoSchema()
lineas_trabajo_schema = LineaTrabajoSchema(many=True)

class LineaTrabajo:
    def __init__(self, collection):
        """
        Inicializar el modelo de Línea de Trabajo
        
        :param collection: Colección de MongoDB para líneas de trabajo
        """
        self.collection = collection
        self.logger = logging.getLogger(__name__)

    def crear_linea_trabajo(self, datos):
        """
        Crear una nueva línea de trabajo
        
        :param datos: Diccionario con datos de la línea de trabajo
        :return: ID de la línea de trabajo creada
        """
        try:
            # Verificar si ya existe una línea de trabajo con ese nombre
            if self.collection.find_one({'nombre': datos['nombre']}):
                raise ValueError("Ya existe una línea de trabajo con este nombre")
            
            # Establecer fecha de creación si no se proporciona
            datos['fecha_creacion'] = datos.get('fecha_creacion', datetime.now())
            
            # Establecer estado por defecto si no se proporciona
            datos['estado'] = datos.get('estado', 'Activo')
            
            # Insertar línea de trabajo
            resultado = self.collection.insert_one(datos)
            
            return str(resultado.inserted_id)
        except Exception as e:
            self.logger.error(f"Error al crear línea de trabajo: {str(e)}")
            raise

    def obtener_lineas_trabajo(self):
        """
        Obtener todas las líneas de trabajo
        
        :return: Lista de líneas de trabajo
        """
        try:
            lineas = list(self.collection.find())
            
            # Convertir ObjectId a string para cada línea
            for linea in lineas:
                linea['id'] = str(linea['_id'])
                del linea['_id']
            
            return lineas
        except Exception as e:
            self.logger.error(f"Error al obtener líneas de trabajo: {str(e)}")
            raise

    def obtener_linea_trabajo_por_id(self, linea_trabajo_id):
        """
        Obtener una línea de trabajo por su ID
        
        :param linea_trabajo_id: ID de la línea de trabajo
        :return: Línea de trabajo o None si no se encuentra
        """
        try:
            linea = self.collection.find_one({'_id': ObjectId(linea_trabajo_id)})
            
            if linea:
                linea['id'] = str(linea['_id'])
                del linea['_id']
                return linea
            
            return None
        except Exception as e:
            self.logger.error(f"Error al obtener línea de trabajo por ID: {str(e)}")
            raise

    def obtener_linea_trabajo_por_nombre(self, nombre):
        """
        Obtener una línea de trabajo por su nombre
        
        :param nombre: Nombre de la línea de trabajo
        :return: Línea de trabajo o None si no se encuentra
        """
        try:
            linea = self.collection.find_one({'nombre': nombre})
            
            if linea:
                linea['id'] = str(linea['_id'])
                del linea['_id']
                return linea
            
            return None
        except Exception as e:
            self.logger.error(f"Error al obtener línea de trabajo por nombre: {str(e)}")
            raise

    def actualizar_linea_trabajo(self, linea_trabajo_id, datos):
        """
        Actualizar una línea de trabajo
        
        :param linea_trabajo_id: ID de la línea de trabajo
        :param datos: Diccionario con datos a actualizar
        :return: Número de documentos modificados
        """
        try:
            resultado = self.collection.update_one(
                {'_id': ObjectId(linea_trabajo_id)}, 
                {'$set': datos}
            )
            
            return resultado.modified_count
        except Exception as e:
            self.logger.error(f"Error al actualizar línea de trabajo: {str(e)}")
            raise

    def eliminar_linea_trabajo(self, linea_trabajo_id):
        """
        Eliminar una línea de trabajo
        
        :param linea_trabajo_id: ID de la línea de trabajo
        :return: Número de documentos eliminados
        """
        try:
            resultado = self.collection.delete_one({'_id': ObjectId(linea_trabajo_id)})
            
            return resultado.deleted_count
        except Exception as e:
            self.logger.error(f"Error al eliminar línea de trabajo: {str(e)}")
            raise
