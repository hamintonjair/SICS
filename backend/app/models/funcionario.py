from bson import ObjectId
from flask import current_app
import logging
import bcrypt
from datetime import datetime

class FuncionarioModel:
    def __init__(self, db=None):
        """
        Inicializar modelo de funcionario con validaciones robustas
        
        Args:
            db (pymongo.database.Database, optional): Base de datos de MongoDB. 
                Si no se proporciona, intenta obtenerla de la configuración de la aplicación.
        """
        # Validación exhaustiva de la base de datos
        if db is None:
            try:
                # Intentar obtener la base de datos de la configuración de la aplicación
                db = current_app.config.get('db')
                
                if db is None:
                    logging.error("No se pudo obtener la base de datos de la configuración de la aplicación")
                    raise ValueError("Base de datos no configurada correctamente")
            except Exception as e:
                logging.error(f"Error al obtener base de datos: {str(e)}")
                raise ValueError(f"No se pudo inicializar el modelo de funcionario: {str(e)}")
        
        # Validar que db sea un objeto de base de datos válido
        if not hasattr(db, '__getitem__'):
            logging.error(f"Objeto de base de datos inválido: {type(db)}")
            raise ValueError("El objeto de base de datos no es válido")
        
        self.db = db
        
        # Obtener colección de funcionarios de manera segura
        try:
            self.collection = db['funcionarios']
            logging.info("Colección de funcionarios obtenida correctamente")
        except Exception as e:
            logging.error(f"Error al obtener colección de funcionarios: {str(e)}")
            raise ValueError(f"No se pudo obtener la colección de funcionarios: {str(e)}")
    
    def obtener_funcionario_por_email(self, email):
        """
        Obtener un funcionario por su correo electrónico
        
        Args:
            email (str): Correo electrónico del funcionario
        
        Returns:
            dict: Datos del funcionario o None si no se encuentra
        """
        try:
            funcionario = self.collection.find_one({'email': email})
            
            if funcionario:
                # Convertir ObjectId a string
                funcionario_dict = {
                    'id': str(funcionario['_id']),
                    '_id': str(funcionario['_id']),
                    'nombre': funcionario.get('nombre', ''),
                    'email': funcionario.get('email', ''),
                    'secretaría': funcionario.get('secretaría', ''),
                    'linea_trabajo': str(funcionario.get('linea_trabajo', '')),
                    'rol': funcionario.get('rol', 'funcionario'),
                    'estado': funcionario.get('estado', 'Activo'),
                    'password_hash': funcionario.get('password_hash', b'')
                }
                
                logging.info(f"Funcionario encontrado por email: {funcionario_dict}")
                return funcionario_dict
            
            logging.warning(f"No se encontró funcionario con email: {email}")
            return None
        except Exception as e:
            logging.error(f"Error al obtener funcionario por email: {str(e)}")
            return None
    
    def obtener_funcionario_por_id(self, funcionario_id):
        """
        Obtener un funcionario por su ID
        
        Args:
            funcionario_id (str): ID del funcionario
        
        Returns:
            dict: Datos del funcionario o None si no se encuentra
        """
        try:
            # Convertir a ObjectId si es necesario
            if not isinstance(funcionario_id, ObjectId):
                funcionario_id = ObjectId(funcionario_id)
            
            funcionario = self.collection.find_one({'_id': funcionario_id})
            
            if funcionario:
                # Convertir ObjectId a string
                funcionario['_id'] = str(funcionario['_id'])
                
                # Obtener nombre de línea de trabajo si existe
                if 'linea_trabajo' in funcionario:
                    try:
                        linea_trabajo = self.db['lineas_trabajo'].find_one(
                            {'_id': funcionario['linea_trabajo']}, 
                            {'nombre': 1}
                        )
                        funcionario['nombreLineaTrabajo'] = linea_trabajo.get('nombre', 'Sin línea de trabajo') if linea_trabajo else 'Sin línea de trabajo'
                    except Exception as e:
                        logging.error(f"Error al obtener línea de trabajo: {str(e)}")
                        funcionario['nombreLineaTrabajo'] = 'Sin línea de trabajo'
                else:
                    funcionario['nombreLineaTrabajo'] = 'Sin línea de trabajo'
                
                logging.info(f"Funcionario encontrado: {funcionario}")
                return funcionario
            
            return None
        except Exception as e:
            logging.error(f"Error al obtener funcionario por ID: {str(e)}")
            return None
    
    def crear_funcionario(self, datos):
        """
        Crear un nuevo funcionario
        
        :param datos: Diccionario con datos del funcionario
        :return: ID del nuevo funcionario
        """
        try:
            # Validar campos obligatorios
            campos_obligatorios = ['nombre', 'email', 'password', 'secretaría']
            for campo in campos_obligatorios:
                if campo not in datos or not datos[campo]:
                    raise ValueError(f"El campo {campo} es obligatorio")
            
            # Verificar si ya existe un funcionario con ese email
            funcionario_existente = self.collection.find_one({'email': datos['email']})
            if funcionario_existente:
                raise ValueError("Ya existe un funcionario con este correo electrónico")
            
            # Hashear la contraseña
            password_hash = bcrypt.hashpw(datos['password'].encode('utf-8'), bcrypt.gensalt())
            
            # Preparar datos para inserción
            nuevo_funcionario = {
                'nombre': datos['nombre'],
                'email': datos['email'],
                'password_hash': password_hash,
                'secretaría': datos['secretaría'],
                'linea_trabajo': ObjectId(datos.get('linea_trabajo')) if datos.get('linea_trabajo') else None,
                'rol': datos.get('rol', 'funcionario'),
                'estado': datos.get('estado', 'Activo'),
                'telefono': datos.get('telefono', ''),
                'fecha_registro': datetime.utcnow()
            }
            
            # Insertar funcionario
            resultado = self.collection.insert_one(nuevo_funcionario)
            
            logging.info(f"Funcionario creado: {resultado.inserted_id}")
            
            return str(resultado.inserted_id)
        
        except Exception as e:
            logging.error(f"Error al crear funcionario: {str(e)}")
            raise ValueError(f"No se pudo crear el funcionario: {str(e)}")
    
    def actualizar_funcionario(self, funcionario_id, datos):
        """
        Actualizar un funcionario por su ID
        
        :param funcionario_id: ID del funcionario
        :param datos: Diccionario con datos a actualizar
        :return: Número de documentos modificados
        """
        try:
            # Si se está actualizando la contraseña, hashearla
            if 'password' in datos and datos['password']:
                password_hash = bcrypt.hashpw(datos['password'].encode('utf-8'), bcrypt.gensalt())
                datos['password_hash'] = password_hash
                del datos['password']  # Eliminar la contraseña en texto plano
            
            # Si se está actualizando la línea de trabajo, convertir a ObjectId
            if 'linea_trabajo' in datos and datos['linea_trabajo'] and not isinstance(datos['linea_trabajo'], ObjectId):
                try:
                    datos['linea_trabajo'] = ObjectId(datos['linea_trabajo'])
                except Exception as e:
                    logging.error(f"Error al convertir linea_trabajo a ObjectId: {str(e)}")
                    raise ValueError("ID de línea de trabajo inválido")
            
            resultado = self.collection.update_one(
                {'_id': ObjectId(funcionario_id)}, 
                {'$set': datos}
            )
            
            return resultado.modified_count
        except Exception as e:
            logging.error(f"Error al actualizar funcionario: {str(e)}")
            raise
    
    def autenticar(self, email, password):
        """
        Autenticar un funcionario
        
        :param email: Correo electrónico
        :param password: Contraseña
        :return: Información del funcionario si la autenticación es exitosa
        """
        try:
            funcionario = self.collection.find_one({'email': email})
            
            if funcionario and bcrypt.checkpw(password.encode('utf-8'), funcionario['password_hash']):
                # Convertir ObjectId a string
                funcionario['id'] = str(funcionario['_id'])
                del funcionario['_id']
                del funcionario['password_hash']
                
                return funcionario
            
            return None
        except Exception as e:
            logging.error(f"Error de autenticación: {str(e)}")
            raise

    def eliminar_funcionario(self, funcionario_id):
        """
        Eliminar un funcionario
        
        :param funcionario_id: ID del funcionario
        :return: Número de documentos eliminados
        """
        try:
            # Convertir el ID a ObjectId si es un string
            if isinstance(funcionario_id, str):
                funcionario_id = ObjectId(funcionario_id)
            
            # Eliminar funcionario
            resultado = self.collection.delete_one({'_id': funcionario_id})
            
            return resultado.deleted_count > 0
        
        except Exception as e:
            logging.error(f"Error al eliminar funcionario: {str(e)}")
            raise ValueError(f"No se pudo eliminar el funcionario: {str(e)}")

    def obtener_funcionarios(self):
        """
        Obtener todos los funcionarios con detalles de línea de trabajo
        
        :return: Lista de funcionarios con información de línea de trabajo
        """
        try:
            # Obtener todos los funcionarios con agregación para incluir nombre de línea de trabajo
            pipeline = [
                {
                    '$lookup': {
                        'from': 'lineas_trabajo',  # Nombre de la colección de líneas de trabajo
                        'localField': 'linea_trabajo',
                        'foreignField': '_id',
                        'as': 'lineaTrabajoDetalle'
                    }
                },
                {
                    '$unwind': {
                        'path': '$lineaTrabajoDetalle',
                        'preserveNullAndEmptyArrays': True  # Mantener funcionarios sin línea de trabajo
                    }
                },
                {
                    '$project': {
                        '_id': {'$toString': '$_id'},
                        'nombre': 1,
                        'secretaría': 1,
                        'email': 1,
                        'linea_trabajo': {'$toString': '$linea_trabajo'},
                        'nombreLineaTrabajo': {
                            '$ifNull': [
                                '$lineaTrabajoDetalle.nombre', 
                                'Sin línea de trabajo asignada'
                            ]
                        },
                        'rol': 1,
                        'fecha_registro': 1,
                        'estado': 1,
                        'telefono': 1,
                        'fecha_ingreso': 1
                    }
                }
            ]
            
            # Ejecutar agregación
            funcionarios = list(self.collection.aggregate(pipeline))
            
            return funcionarios
        
        except Exception as e:
            logging.error(f"Error al obtener funcionarios: {str(e)}")
            logging.error(f"Detalles del error: {e}")
            raise ValueError(f"No se pudo obtener los funcionarios: {str(e)}")
