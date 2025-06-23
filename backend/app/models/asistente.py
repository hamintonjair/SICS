from bson import ObjectId
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AsistenteModel:
    def __init__(self, db):
        """Inicializa el modelo con la conexión a la base de datos."""
        self.db = db
        
        # Verificar colecciones disponibles
        collections = db.list_collection_names()
        logger.info(f"Colecciones disponibles: {collections}")
        
        # Determinar el nombre de la colección a usar
        if 'asistentes.asistentes' in collections:
            collection_name = 'asistentes.asistentes'
        elif 'asistentes' in collections:
            collection_name = 'asistentes'
        else:
            # Si no existe ninguna de las colecciones, creamos una nueva
            collection_name = 'asistentes'
            logger.warning(f"La colección 'asistentes' no existe. Se creará al insertar el primer documento.")
        
        # Obtener la colección
        self.collection = db[collection_name]
        logger.info(f"Usando colección: {self.collection.full_name}")
        
        # Verificar si la colección está vacía
        try:
            count = self.collection.count_documents({})
            logger.info(f"La colección {collection_name} contiene {count} documentos")
        except Exception as e:
            logger.error(f"Error al contar documentos en {collection_name}: {str(e)}")

    def obtener_por_id(self, asistente_id):
        """Obtiene un asistente por su ID."""
        try:
            if not ObjectId.is_valid(asistente_id):
                return None
                
            asistente = self.collection.find_one({'_id': ObjectId(asistente_id)})
            if asistente:
                asistente['_id'] = str(asistente['_id'])
            return asistente
            
        except Exception as e:
            logger.error(f"Error al obtener asistente por ID {asistente_id}: {str(e)}")
            return None

    def listar_por_actividad(self, actividad_id):
        """Lista todos los asistentes de una actividad."""
        try:
            if not ObjectId.is_valid(actividad_id):
                return []
                
            asistentes = list(self.collection.find({'actividad_id': ObjectId(actividad_id)}))
            for asistente in asistentes:
                asistente['_id'] = str(asistente['_id'])
            return asistentes
            
        except Exception as e:
            logger.error(f"Error al listar asistentes para actividad {actividad_id}: {str(e)}")
            return []

    def crear(self, datos_asistente):
        """Crea un nuevo asistente."""
        try:
            resultado = self.collection.insert_one(datos_asistente)
            return str(resultado.inserted_id)
        except Exception as e:
            logger.error(f"Error al crear asistente: {str(e)}")
            return None

    def actualizar(self, asistente_id, datos_actualizacion):
        """Actualiza los datos de un asistente."""
        try:
            if not ObjectId.is_valid(asistente_id):
                return False
                
            resultado = self.collection.update_one(
                {'_id': ObjectId(asistente_id)},
                {'$set': datos_actualizacion}
            )
            return resultado.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error al actualizar asistente {asistente_id}: {str(e)}")
            return False

    def eliminar(self, asistente_id):
        """Elimina un asistente."""
        try:
            if not ObjectId.is_valid(asistente_id):
                return False
                
            resultado = self.collection.delete_one({'_id': ObjectId(asistente_id)})
            return resultado.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error al eliminar asistente {asistente_id}: {str(e)}")
            return False
            
    def buscar_por_email(self, email):
        """Busca un asistente por su email."""
        try:
            return self.collection.find_one({'email': email})
        except Exception as e:
            logger.error(f"Error al buscar asistente por email {email}: {str(e)}")
            return None
            
    def buscar_por_cedula(self, cedula):
        """Busca un asistente por su número de cédula."""
        try:
            logger.info(f"Buscando asistente con cédula: {cedula}")
            asistente = self.collection.find_one({'cedula': cedula})
            if asistente and '_id' in asistente:
                asistente['_id'] = str(asistente['_id'])
            return asistente
        except Exception as e:
            logger.error(f"Error al buscar asistente por cédula {cedula}: {str(e)}", exc_info=True)
            return None
            
    def listar_todos(self, filtro=None):
        """Lista todos los asistentes con un filtro opcional."""
        try:
            logger.info("Iniciando listar_todos")
            logger.info(f"Tipo de self.db: {type(self.db)}")
            logger.info(f"Atributos de self.db: {dir(self.db)}")
            
            query = filtro or {}
            logger.info(f"Ejecutando consulta en la colección {self.collection.name} con filtro: {query}")
            
            try:
                # Verificar si la colección existe
                collection_names = self.db.list_collection_names()
                logger.info(f"Colecciones disponibles: {collection_names}")
                
                if self.collection.name not in collection_names:
                    logger.error(f"La colección {self.collection.name} no existe en la base de datos")
                    return []
                
                logger.info("Realizando consulta find...")
                cursor = self.collection.find(query)
                asistentes = list(cursor)
                logger.info(f"Consulta completada. Se encontraron {len(asistentes)} asistentes")
                
                for i, asistente in enumerate(asistentes):
                    if not isinstance(asistente, dict):
                        logger.error(f"Documento {i} no es un diccionario: {asistente}")
                        continue
                        
                    if '_id' in asistente:
                        try:
                            asistente['_id'] = str(asistente['_id'])
                        except Exception as e:
                            logger.error(f"Error al convertir _id a string: {e}")
                            asistente['_id'] = str(asistente['_id']) if asistente['_id'] else None
                    else:
                        logger.warning(f"Documento {i} no tiene _id: {asistente}")
                
                logger.info("Procesamiento de documentos completado")
                return asistentes
                
            except Exception as inner_e:
                logger.error(f"Error interno en listar_todos: {str(inner_e)}", exc_info=True)
                return []
                
        except Exception as e:
            logger.error(f"Error en listar_todos: {str(e)}", exc_info=True)
            return []

    def actualizar_por_id(self, asistente_id, datos_actualizacion):
        """Actualiza un asistente por su ID y devuelve el documento actualizado."""
        try:
            if not ObjectId.is_valid(asistente_id):
                return None
                
            datos_actualizacion['fecha_actualizacion'] = datetime.utcnow()
            resultado = self.collection.find_one_and_update(
                {'_id': ObjectId(asistente_id)},
                {'$set': datos_actualizacion},
                return_document=True
            )
            
            if resultado:
                resultado['_id'] = str(resultado['_id'])
                return resultado
            return None
            
        except Exception as e:
            logger.error(f"Error al actualizar asistente {asistente_id}: {str(e)}")
            return None
