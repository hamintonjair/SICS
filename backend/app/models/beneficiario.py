from datetime import datetime
from bson import ObjectId

# Importaciones de Marshmallow
from marshmallow import Schema, fields, validate, EXCLUDE
from marshmallow.validate import Length, OneOf, Regexp, Email, Range
from marshmallow.decorators import validates_schema
from marshmallow.exceptions import ValidationError
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date
import logging

# Constantes para validaciones
TIPOS_DOCUMENTO = ['Cédula de ciudadanía', 'Tarjeta de identidad', 'Cédula extranjera', 'Sin documento', 'Otro']
GENEROS = ['Masculino', 'Femenino', 'No binario', 'Prefiere no decirlo']
RANGOS_EDAD = ['0-5', '6-12', '13-17', '18-28', '29-59', '60+']
ETNIAS = ['Indígena', 'Afrodescendiente', 'Raizal', 'Palenquero', 'ROM', 'Mestizo', 'Ninguna']
TIPOS_DISCAPACIDAD = ['Visual', 'Auditiva', 'Motriz', 'Psicosocial', 'Cognitiva', 'Otra']
NIVELES_EDUCATIVOS = ['Ninguno', 'Primaria incompleta', 'Primaria completa', 'Secundaria incompleta', 'Secundaria completa', 'Técnica', 'Tecnológica', 'Universitaria', 'Posgrado']
SITUACIONES_LABORALES = ['Empleado', 'Independiente', 'Desempleado', 'Pensionado', 'Otro']
TIPOS_VIVIENDA = ['Propia', 'Arriendo', 'Familiar', 'Invasión', 'Otra']
TIPOS_VERIFICACION = ['huella_digital', 'firma_digital']
ESTADOS_VERIFICACION = ['pendiente', 'verificado', 'rechazado']

# Esquema obsoleto para compatibilidad con datos existentes
class HuellaDactilarSchema(Schema):
    id = fields.Str(required=False)
    type = fields.Str(required=False)
    quality = fields.Int(required=False)
    documento = fields.Str(required=False)
    nombre = fields.Str(required=False)
    fecha_registro = fields.Str(required=False)
    datos_biometricos = fields.Dict(required=False)
    codigo_verificacion = fields.Str(required=False)
    enlace_qr = fields.Str(required=False)

class VerificacionBiometricaSchema(Schema):
    credential_id = fields.Str(required=True)
    public_key = fields.Str(required=True)
    fecha_registro = fields.DateTime(required=True)
    tipo_verificacion = fields.Str(required=True, validate=validate.OneOf(TIPOS_VERIFICACION))
    estado = fields.Str(required=True, validate=validate.OneOf(ESTADOS_VERIFICACION))
    dispositivo = fields.Dict(keys=fields.Str(), values=fields.Str())
    metadata = fields.Dict(keys=fields.Str(), values=fields.Str())

class BeneficiarioSchema(Schema):
    funcionario_id = fields.Str(required=True)
    funcionario_nombre = fields.Str(required=True)
    linea_trabajo = fields.Str(required=True)
    fecha_registro = fields.Str(required=True)
    nombre_completo = fields.Str(required=True)
    tipo_documento = fields.Str(required=True)
    # Campo obsoleto, mantenido para compatibilidad
    huella_dactilar = fields.Nested(HuellaDactilarSchema, required=False, allow_none=True)
    # Campo para almacenar la firma digital en formato base64
    firma = fields.Str(required=False, allow_none=True)
    verificacion_biometrica = fields.Nested(VerificacionBiometricaSchema, required=False)
    codigo_verificacion = fields.Str(required=False)  # Código único para el QR
    numero_documento = fields.Str(required=True)
    genero = fields.Str(required=True)
    rango_edad = fields.Str(required=True)
    sabe_leer = fields.Bool(required=True)
    sabe_escribir = fields.Bool(required=True)
    numero_celular = fields.Str(required=True)
    correo_electronico = fields.Str()
    etnia = fields.Str()
    comuna = fields.Str(required=True)
    barrio = fields.Str(required=True)
    barrio_lat = fields.Float(required=False, allow_none=True)
    barrio_lng = fields.Float(required=False, allow_none=True)
    tiene_discapacidad = fields.Bool()
    tipo_discapacidad = fields.Str()
    nombre_cuidadora = fields.Str()
    labora_cuidadora = fields.Bool()
    victima_conflicto = fields.Bool()
    hijos_a_cargo = fields.Int()
    estudia_actualmente = fields.Bool()
    nivel_educativo = fields.Str()
    situacion_laboral = fields.Str()
    tipo_vivienda = fields.Str()
    ayuda_humanitaria = fields.Bool()
    descripcion_ayuda_humanitaria = fields.Str()

beneficiario_schema = BeneficiarioSchema()
beneficiarios_schema = BeneficiarioSchema(many=True)

class BeneficiarioModel:
    def __init__(self, db=None):
        """
        Inicializar modelo de Beneficiario
        
        :param db: Conexión a la base de datos MongoDB
        """
        if db is None:
            from flask import current_app
            db = current_app.config.get('db')
        
        if db is None:
            raise ValueError("Base de datos no configurada")
        
        self.db = db
        self.collection = db['beneficiarios']
        self.schema = BeneficiarioSchema()
    
    def crear_beneficiario(self, datos):
        """
        Crear un nuevo beneficiario
        
        :param datos: Diccionario con datos del beneficiario
        :return: ID del nuevo beneficiario
        """
        try:
            # Validar datos con el esquema
            datos_validados = self.schema.load(datos)
            
            # Preparar datos para inserción
            nuevo_beneficiario = {
                **datos_validados,
                'fecha_registro': datetime.utcnow()
            }
            
            # Insertar beneficiario
            resultado = self.collection.insert_one(nuevo_beneficiario)
            
            return str(resultado.inserted_id)
        
        except ValidationError as e:
            raise ValueError(f"Datos inválidos: {e.messages}")
        except Exception as e:
            raise ValueError(f"Error al crear beneficiario: {str(e)}")
    
    def obtener_beneficiarios(self, filtros=None):
        """
        Obtener beneficiarios con filtros opcionales
        
        :param filtros: Diccionario de filtros para la consulta
        :return: Lista de beneficiarios
        """
        try:
            filtros = filtros or {}
            
            # Convertir filtros de ObjectId si es necesario
            for key, value in list(filtros.items()):
                if key.endswith('_id'):
                    filtros[key] = ObjectId(value) if value else None
            
            # Obtener beneficiarios
            beneficiarios = list(self.collection.find(filtros))
            
            # Convertir ObjectId a string
            for beneficiario in beneficiarios:
                beneficiario['_id'] = str(beneficiario['_id'])
            
            return beneficiarios
        
        except Exception as e:
            raise ValueError(f"Error al obtener beneficiarios: {str(e)}")
    
    def obtener_beneficiario_por_id(self, beneficiario_id):
        """
        Obtener un beneficiario por su ID
        
        :param beneficiario_id: ID del beneficiario
        :return: Datos del beneficiario
        """
        try:
            # Convertir a ObjectId si es necesario
            if not isinstance(beneficiario_id, ObjectId):
                beneficiario_id = ObjectId(beneficiario_id)
            
            beneficiario = self.collection.find_one({'_id': beneficiario_id})
            
            if beneficiario:
                # Convertir ObjectId a string
                beneficiario['_id'] = str(beneficiario['_id'])
                return beneficiario
            
            return None
        
        except Exception as e:
            raise ValueError(f"Error al obtener beneficiario: {str(e)}")
    
    def actualizar_beneficiario(self, beneficiario_id, datos):
        """
        Actualizar un beneficiario
        
        :param beneficiario_id: ID del beneficiario a actualizar
        :param datos: Diccionario con datos a actualizar
        :return: Número de documentos modificados
        """
        try:
            # Convertir a ObjectId si es necesario
            if not isinstance(beneficiario_id, ObjectId):
                beneficiario_id = ObjectId(beneficiario_id)
            
            # Eliminar _id si está presente en los datos
            datos.pop('_id', None)
            
            # Validar datos parcialmente
            datos_validados = self.schema.load(datos, partial=True)
            
            # Actualizar beneficiario
            resultado = self.collection.update_one(
                {'_id': beneficiario_id}, 
                {'$set': datos_validados}
            )
            
            return resultado.modified_count
        
        except ValidationError as e:
            raise ValueError(f"Datos inválidos: {e.messages}")
        except Exception as e:
            raise ValueError(f"Error al actualizar beneficiario: {str(e)}")
    
    def eliminar_beneficiario(self, beneficiario_id):
        """
        Eliminar un beneficiario
        
        :param beneficiario_id: ID del beneficiario a eliminar
        :return: Número de documentos eliminados
        """
        try:
            # Convertir a ObjectId si es necesario
            if not isinstance(beneficiario_id, ObjectId):
                beneficiario_id = ObjectId(beneficiario_id)
            
            # Eliminar beneficiario
            resultado = self.collection.delete_one({'_id': beneficiario_id})
            
            return resultado.deleted_count
        
        except Exception as e:
            raise ValueError(f"Error al eliminar beneficiario: {str(e)}")
    
    def obtener_estadisticas_por_linea_trabajo(self, linea_trabajo_id):
        """
        Obtener estadísticas detalladas de beneficiarios por línea de trabajo
        
        :param linea_trabajo_id: ObjectId de la línea de trabajo
        :return: Diccionario con estadísticas
        """
        try:
            # Validar que el ID sea un ObjectId válido
            if not isinstance(linea_trabajo_id, ObjectId):
                try:
                    linea_trabajo_id = ObjectId(linea_trabajo_id)
                except Exception as e:
                    logging.error(f"ID de línea de trabajo inválido: {linea_trabajo_id}")
                    raise ValueError(f"ID de línea de trabajo inválido: {linea_trabajo_id}")
            
            logging.info(f"Obteniendo estadísticas para línea de trabajo: {linea_trabajo_id}")
            
            # Verificar si la línea de trabajo existe
            linea_trabajo_existente = self.collection.database['lineas_trabajo'].find_one({'_id': linea_trabajo_id})
            if not linea_trabajo_existente:
                logging.warning(f"Línea de trabajo no encontrada: {linea_trabajo_id}")
                return {}
            
            # Filtro base por línea de trabajo
            filtro_base = {
                'linea_trabajo': str(linea_trabajo_id)  # Convertir a string para comparación
            }
            
            # Estadísticas generales
            total_beneficiarios = self.collection.count_documents(filtro_base)
            
            # Estadísticas de comunas
            comunas = self.collection.aggregate([
                {'$match': filtro_base},
                {'$group': {
                    '_id': '$comuna',
                    'total': {'$sum': 1}
                }}
            ])
            total_comunas = list(comunas)
            
            # Menores de 18 años que estudian
            menores_estudiando = self.collection.count_documents({
                **filtro_base,
                'rango_edad': {'$in': ['0-12', '13-18']},
                'estudia_actualmente': True
            })
            
            # Beneficiarios que trabajan
            beneficiarios_trabajan = self.collection.count_documents({
                **filtro_base,
                'situacion_laboral': {'$ne': 'Desempleado'}
            })
            
            # Estadísticas de vivienda
            vivienda_propia = self.collection.count_documents({
                **filtro_base,
                'tipo_vivienda': 'Propia'
            })
            
            vivienda_arrendada = self.collection.count_documents({
                **filtro_base,
                'tipo_vivienda': 'Arriendo'
            })
            
            vivienda_familiar = self.collection.count_documents({
                **filtro_base,
                'tipo_vivienda': 'Familiar'
            })
            
            # Cuida casa
            vivienda_compartida = self.collection.count_documents({
                **filtro_base,
               'tipo_vivienda': 'Compartida'
            })
            
            estadisticas = {
                # Estadísticas previas
                'total_beneficiarios': total_beneficiarios,
                'total_victimas': self.collection.count_documents({
                    **filtro_base,
                    'victima_conflicto': True
                }),
                'total_discapacidad': self.collection.count_documents({
                    **filtro_base,
                    'tiene_discapacidad': True
                }),
                'total_ayuda_humanitaria': self.collection.count_documents({
                    **filtro_base,
                    'ayuda_humanitaria': True
                }),
                
                # Nuevas estadísticas
                'total_comunas': {
                    'cantidad': len(total_comunas),
                    'detalles': [
                        {'nombre': str(comuna['_id']), 'total': comuna['total']} 
                        for comuna in total_comunas
                    ]
                },
                'menores_estudiando': menores_estudiando,
                'beneficiarios_trabajan': beneficiarios_trabajan,
                'vivienda_propia': vivienda_propia,
                'vivienda_arrendada': vivienda_arrendada,
                'vivienda_familiar': vivienda_familiar,
                'vivienda_compartida': vivienda_compartida,
                
                # Estadísticas de edad previas
                'total_menores_13': self.collection.count_documents({
                    **filtro_base,
                    'rango_edad': '0-12'
                }),
                'total_13_25': self.collection.count_documents({
                    **filtro_base,
                    'rango_edad': {'$in': ['13-18', '19-25']}
                }),
                'total_mayores_25': self.collection.count_documents({
                    **filtro_base,
                    'rango_edad': {'$in': ['26-35', '36-45', '46-55', '56-65', '66 o más']}
                }),
                
                # Alfabetización
                'total_alfabetizados': self.collection.count_documents({
                    **filtro_base,
                    'sabe_leer': True,
                    'sabe_escribir': True
                }),
                'total_analfabetas': self.collection.count_documents({
                    **filtro_base,
                    '$or': [
                        {'sabe_leer': False},
                        {'sabe_escribir': False}
                    ]
                }),
                'total_mujeres_menores_con_hijos': self.collection.count_documents({
                    **filtro_base,
                    'genero': 'Femenino',
                    'rango_edad': {'$in': ['0-12', '13-18']},
                    'hijos_a_cargo': {'$gt': 0}
                })
            }
            
            logging.info(f"Estadísticas obtenidas: {estadisticas}")
            return estadisticas
        
        except Exception as e:
            logging.error(f"Error al obtener estadísticas de beneficiarios: {str(e)}")
            return {}

    def obtener_estadisticas_globales_admin(self):
        """
        Obtener estadísticas globales de beneficiarios para dashboard administrativo
        sin filtrar por línea de trabajo
        
        :return: Diccionario con estadísticas globales
        """
        try:
            # Total de beneficiarios
            total_beneficiarios = self.collection.count_documents({})
            
            # Víctimas de conflicto
            total_victimas = self.collection.count_documents({
                'victima_conflicto': True
            })
            
            # Beneficiarios con discapacidad
            total_discapacidad = self.collection.count_documents({
                'tiene_discapacidad': True
            })
            
            # Ayuda humanitaria
            total_ayuda_humanitaria = self.collection.count_documents({
                'ayuda_humanitaria': True
            })
            
            # Rango de edades
            total_menores_13 = self.collection.count_documents({
                'rango_edad': '0-12'
            })
            
            total_13_25 = self.collection.count_documents({
                'rango_edad': {'$in': ['13-18', '19-25']}
            })
            
            total_mayores_25 = self.collection.count_documents({
                'rango_edad': {'$in': ['26-35', '36-45', '46-55', '56-65', '66 o más']}
            })
            
            # Alfabetización
            total_alfabetizados = self.collection.count_documents({
                'sabe_leer': True,
                'sabe_escribir': True
            })
            
            total_analfabetas = self.collection.count_documents({
                '$or': [
                    {'sabe_leer': False},
                    {'sabe_escribir': False}
                ]
            })
            
            # Mujeres menores con hijos
            total_mujeres_menores_con_hijos = self.collection.count_documents({
                'genero': 'Femenino',
                'rango_edad': {'$in': ['0-12', '13-18']},
                'hijos_a_cargo': {'$gt': 0}
            })
            
            # Estadísticas globales para dashboard admin
            total_comunas = list(self.collection.aggregate([
                {"$group": {"_id": "$comuna", "cantidad": {"$sum": 1}}}
            ]))
            
            comunas_conteo = {str(item['_id']): item['cantidad'] for item in total_comunas}
            
            # Menores de 18 años que estudian
            menores_estudian = self.collection.count_documents({
                'rango_edad': {'$in': ['0-12', '13-18']},
                'estudia_actualmente': True
            })
            
            # Beneficiarios que trabajan
            beneficiarios_trabajan = self.collection.count_documents({
                'situacion_laboral': {'$ne': 'Desempleado'}
            })
            
            # Estadísticas de vivienda
            vivienda_propia = self.collection.count_documents({
                'tipo_vivienda': 'Propia'
            })
            
            vivienda_arrendada = self.collection.count_documents({
                'tipo_vivienda': 'Arriendo'
            })
            
            vivienda_familiar = self.collection.count_documents({
                'tipo_vivienda': 'Familiar'
            })
            
            vivienda_compartida = self.collection.count_documents({
                'tipo_vivienda': 'Compartida'
            })
            
            
            estadisticas = {
                'total_beneficiarios': total_beneficiarios,
                'total_victimas': total_victimas,
                'total_discapacidad': total_discapacidad,
                'total_ayuda_humanitaria': total_ayuda_humanitaria,
                'total_menores_13': total_menores_13,
                'total_13_25': total_13_25,
                'total_mayores_25': total_mayores_25,
                'total_alfabetizados': total_alfabetizados,
                'total_analfabetas': total_analfabetas,
                'total_mujeres_menores_con_hijos': total_mujeres_menores_con_hijos,
                'total_comunas': comunas_conteo,
                'menores_estudian': menores_estudian,
                'beneficiarios_trabajan': beneficiarios_trabajan,
                'vivienda_propia': vivienda_propia,
                'vivienda_arrendada': vivienda_arrendada,
                'vivienda_familiar': vivienda_familiar,
                'vivienda_compartida': vivienda_compartida
            }
            
            logging.info(f"Estadísticas globales administrativas obtenidas: {estadisticas}")
            return estadisticas
        
        except Exception as e:
            logging.error(f"Error al obtener estadísticas globales administrativas: {str(e)}")
            return {}
