from bson import ObjectId
from flask import current_app
import logging
from datetime import datetime

class ComunaModel:
    def __init__(self, db=None):
        """
        Inicializar modelo de Comuna con validaciones robustas
        
        Args:
            db (pymongo.database.Database, optional): Base de datos de MongoDB. 
                Si no se proporciona, intenta obtenerla de la configuración de la aplicación.
        """
        if db is None:
            try:
                db = current_app.config.get('db')
                
                if db is None:
                    logging.error("No se pudo obtener la base de datos de la configuración de la aplicación")
                    raise ValueError("Base de datos no configurada correctamente")
            except Exception as e:
                logging.error(f"Error al obtener base de datos: {str(e)}")
                raise ValueError(f"No se pudo inicializar el modelo de Comuna: {str(e)}")
        
        self.db = db
        self.collection = db['comunas']

    def crear_comuna(self, datos):
        """
        Crear una nueva Comuna
        
        :param datos: Diccionario con datos de la Comuna
        :return: ID de la nueva Comuna
        """
        try:
            # Validar campos obligatorios
            campos_obligatorios = ['nombre', 'zona']
            for campo in campos_obligatorios:
                if campo not in datos or not datos[campo]:
                    raise ValueError(f"El campo {campo} es obligatorio")
            
            # Verificar si ya existe una Comuna con ese nombre
            comuna_existente = self.collection.find_one({'nombre': datos['nombre']})
            if comuna_existente:
                raise ValueError("Ya existe una Comuna con este nombre")
            
            # Preparar datos para inserción
            nueva_comuna = {
                'nombre': f"{datos['nombre']} - {datos['zona']}",
                'zona': datos['zona'],
                'fecha_registro': datetime.utcnow()
            }
            
            # Insertar Comuna
            resultado = self.collection.insert_one(nueva_comuna)
            
            logging.info(f"Comuna creada: {resultado.inserted_id}")
            
            return str(resultado.inserted_id)
        
        except Exception as e:
            logging.error(f"Error al crear Comuna: {str(e)}")
            raise ValueError(f"No se pudo crear la Comuna: {str(e)}")

    def obtener_comunas(self):
        """
        Obtener todas las Comunas
        """
        try:
            # Obtener todas las comunas, ordenadas por nombre
            comunas = list(self.collection.find().sort('nombre', 1))
            
            # Convertir ObjectId a string para serialización JSON
            for comuna in comunas:
                comuna['_id'] = str(comuna['_id'])
            
            return comunas
        
        except Exception as e:
            logging.error(f"Error al obtener comunas: {str(e)}")
            return []

    def obtener_comuna_por_id(self, comuna_id):
        """
        Obtener una Comuna por su ID
        
        :param comuna_id: ID de la Comuna
        :return: Datos de la Comuna
        """
        try:
            # Convertir a ObjectId si es necesario
            if not isinstance(comuna_id, ObjectId):
                comuna_id = ObjectId(comuna_id)
            
            comuna = self.collection.find_one({'_id': comuna_id})
            
            if comuna:
                # Convertir ObjectId a string
                comuna['_id'] = str(comuna['_id'])
                return comuna
            
            return None
        
        except Exception as e:
            logging.error(f"Error al obtener Comuna por ID: {str(e)}")
            raise ValueError(f"No se pudo obtener la Comuna: {str(e)}")

    def actualizar_comuna(self, comuna_id, datos):
        """
        Actualizar una Comuna
        
        :param comuna_id: ID de la Comuna a actualizar
        :param datos: Diccionario con datos a actualizar
        :return: Número de documentos modificados
        """
        try:
            # Convertir a ObjectId si es necesario
            if not isinstance(comuna_id, ObjectId):
                comuna_id = ObjectId(comuna_id)
            
            # Eliminar _id si está presente en los datos
            datos.pop('_id', None)
            datos.pop('fecha_registro', None)
            
            # Validar que haya campos para actualizar
            if not datos:
                raise ValueError("No hay campos válidos para actualizar")
            
            # Agregar fecha de actualización
            datos['fecha_actualizacion'] = datetime.utcnow()
            
            # Actualizar Comuna
            resultado = self.collection.update_one(
                {'_id': comuna_id}, 
                {'$set': datos}
            )
            
            logging.info(f"Comuna actualizada: {resultado.modified_count}")
            
            return resultado.modified_count
        
        except Exception as e:
            logging.error(f"Error al actualizar Comuna: {str(e)}")
            raise ValueError(f"No se pudo actualizar la Comuna: {str(e)}")

    def eliminar_comuna(self, comuna_id):
        """
        Eliminar una Comuna
        
        :param comuna_id: ID de la Comuna a eliminar
        :return: Número de documentos eliminados
        """
        try:
            # Convertir a ObjectId si es necesario
            if not isinstance(comuna_id, ObjectId):
                comuna_id = ObjectId(comuna_id)
            
            # Eliminar Comuna
            resultado = self.collection.delete_one({'_id': comuna_id})
            
            logging.info(f"Comuna eliminada: {resultado.deleted_count}")
            
            return resultado.deleted_count
        
        except Exception as e:
            logging.error(f"Error al eliminar Comuna: {str(e)}")
            raise ValueError(f"No se pudo eliminar la Comuna: {str(e)}")
