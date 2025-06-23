from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime
import pandas as pd
import io
import math
import re
import traceback
poblacion_migrante_bp = Blueprint('poblacion_migrante', __name__)

# Esquema de validación para población migrante
class PoblacionMigranteSchema(Schema):
    # Datos personales
    funcionario_id = fields.Str(required=True)
    funcionario_nombre = fields.Str(required=True)
    linea_trabajo = fields.Str(required=True)
    fecha_registro = fields.Str(required=True)
    
    nombre_completo = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    tipo_documento = fields.Str(required=True, validate=validate.OneOf([
        'Cédula de ciudadanía',
        'Cédula de extranjería',
        'Pasaporte',
        'Permiso especial de permanencia',
        'Sin documento',
        'PPT',
        'Otro'
    ]))
    numero_documento = fields.Str(required=True)
    fecha_nacimiento = fields.Str(required=False, allow_none=True)
    sexo = fields.Str(required=False, allow_none=True, validate=validate.OneOf(['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'])) # Añadido
    
    # Datos migratorios
    pais_origen = fields.Str(required=True)
    fecha_llegada = fields.Str(required=False, allow_none=True)
    tiempoPermanenciaColombia = fields.Str(required=True, validate=validate.OneOf([
        '0-6', 
        '7-12', 
        '1-2', 
        '2+'
    ]))
    tipoDocumentoMigratorio = fields.Str(required=False, allow_none=True, validate=validate.OneOf([
        'PPT', 
        'PEP', 
        'Otro' 
    ]))

    # Ubicación
    comunaResidencia = fields.Str(required=True)
    barrio = fields.Str(required=True)
    familyDisability = fields.Str(required=False, allow_none=True, validate=validate.OneOf(['Sí', 'No'])) 
    healthSystemName = fields.Str(required=False, allow_none=True)
    sisbenStatus = fields.Str(required=False, allow_none=True, validate=validate.OneOf(['Sí', 'No'])) # Ya tenía allow_none en otra parte, consolidar
    needSisbenUpdate = fields.Str(required=False, allow_none=True, validate=validate.OneOf(['Sí', 'No'])) # Añadido
    disability = fields.Str(required=False, allow_none=True, validate=validate.OneOf(['Sí', 'No']))  # Ya tenía allow_none en otra parte, consolidar
    disabilityType = fields.Str(required=False, allow_none=True) 
    disease = fields.Str(required=False, allow_none=True, validate=validate.OneOf(['Sí', 'No'])) # Ya tenía allow_none en otra parte, consolidar 

    # Datos socioculturales
    etnia = fields.Str(required=True, validate=validate.OneOf([
        'Ninguna', 
        'Afrodescendiente',
        'Mestizo',  # Añadido
        'Indigena', 
        'Raizal', 
        'Palenquero', 
        'Otro'
    ]))
    nivelEducativo = fields.Str(required=True, validate=validate.OneOf([
        'Primaria_Incompleta',
        'Primaria_Completa',
        'Secundaria_Incompleta',
        'Secundaria_Completa',
        'Tecnico',
        'Tecnologico',
        'Universitario_Incompleto',
        'Universitario_Completo',
        'Postgrado',
        'Ninguno'
    ]))
    servicioAgua = fields.Bool(required=False)
    servicioElectricidad = fields.Bool(required=False)
    servicioAlcantarillado = fields.Bool(required=False)
    servicioSalud = fields.Bool(required=False)
    tipoVivienda = fields.Str(required=False, validate=validate.OneOf([
        'Propia', 
        'Alquilada', 
        'Prestada', 
        'Albergue', 
        'Otro'
    ]))
    condicionVivienda = fields.Str(required=False, validate=validate.OneOf([
        'Buenas', 
        'Regulares', 
        'Precarias'
    ]))

    # Información familiar
    tamanoNucleoFamiliar = fields.Str(required=True, validate=validate.OneOf([
        '1-3', 
        '4-6', 
        '7-10', 
        '10+'
    ]))
    cantidadNinosAdolescentes = fields.Str(required=True, validate=validate.OneOf([
        '1', 
        '2', 
        '3', 
        '4+'
    ]))
    rangoEdadNinosAdolescentes = fields.Str(required=False, validate=validate.OneOf([
        '0-5', 
        '6-10', 
        '11-15', 
        '16-17'
    ]))
    ocupacionNinosAdolescentes = fields.Str(required=False, validate=validate.OneOf([
        'estudiantes', 
        'programas_icbf', 
        'ninguna'
    ]))
    institucionEducativa = fields.Str(required=False, allow_none=True)

    # Información adicional
    # situacion_laboral = fields.Str(required=False)
    ingresos_mensuales = fields.Float(required=False, allow_none=True)
    victima_conflicto = fields.Bool(required=False, allow_none=True) # Asumiendo que también puede ser null
    
    # Campos adicionales
    edad = fields.Int(required=False, allow_none=True)
    telefono = fields.Str(required=False)
    situacion_migratoria = fields.Str(required=False)
    trabajoActual = fields.Str(required=False)
    # tipoTrabajo = fields.Str(required=False)
    workingStatus = fields.Str(required=False, allow_none=True)
    workType = fields.Str(required=False, allow_none=True)
    healthSystem = fields.Str(required=False, allow_none=True)
    healthSystemName = fields.Str(required=False, allow_none=True) # Repetido, asegurar que esté
    sisbenStatus = fields.Str(required=False, allow_none=True) # Repetido, asegurar que esté
    supportRoute = fields.Str(required=False, allow_none=True)
    permanentTreatment = fields.Str(required=False, allow_none=True)
    treatmentDetails = fields.Str(required=False, allow_none=True)
    disability = fields.Str(required=False, allow_none=True) # Repetido, asegurar que esté
    disabilityType = fields.Str(required=False, allow_none=True) # Repetido, asegurar que esté
    disease = fields.Str(required=False, allow_none=True) # Repetido, asegurar que esté
    diseaseDetails = fields.Str(required=False, allow_none=True)
    victimOfViolence = fields.Str(required=False, allow_none=True)
    armedConflictVictim = fields.Str(required=False, allow_none=True) # Asumo que victima_conflicto del frontend mapea a este bool, pero el schema tiene ambos
    conflictVictimType = fields.Str(required=False, allow_none=True)

poblacion_migrante_schema = PoblacionMigranteSchema()
poblaciones_migrantes_schema = PoblacionMigranteSchema(many=True)

@poblacion_migrante_bp.route('/registrar', methods=['POST'])
@jwt_required()
def registrar_poblacion_migrante():
    try:
        # Obtener datos del request
        data = request.get_json()
        
        # Logging de datos recibidos
        current_app.logger.info(f'Datos recibidos para registro: {data}')
        
        # Validar datos con el esquema
        try:
            poblacion_migrante_validada = poblacion_migrante_schema.load(data)
            current_app.logger.info('Datos validados correctamente')
        except ValidationError as err:
            current_app.logger.error(f'Error de validación: {err.messages}')
            return jsonify({
                "msg": "Error de validación",
                "errors": err.messages,
                "datos_recibidos": data
            }), 400

        # Obtener colección de base de datos
        poblacion_migrante = current_app.config['MONGO_DB']['poblacion_migrante']
        
        # Verificar documento único
        documento_existente = poblacion_migrante.find_one({
            'numero_documento': poblacion_migrante_validada['numero_documento']
        })
        
        if documento_existente:
            return jsonify({
                "msg": "Ya existe un registro con este número de documento"
            }), 400

        # Insertar en base de datos
        result = poblacion_migrante.insert_one(poblacion_migrante_validada)

        return jsonify({
            "success": True,
            "msg": "Registro de población migrante exitoso",
            "message": "Registro de población migrante exitoso",
            "id": str(result.inserted_id)
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error al registrar población migrante: {str(e)}")
        return jsonify({
            "msg": f"Error interno: {str(e)}"
        }), 500



@poblacion_migrante_bp.route('/poblacion-migrante/<string:id_migrante>', methods=['PUT'])
@jwt_required() # Asegura la ruta si es necesario, como en tu registro
def update_poblacion_migrante(id_migrante):
    try:
        # Validar y convertir el ID de string a ObjectId
        try:
            object_id = ObjectId(id_migrante)
        except Exception:
            current_app.logger.error(f"ID de registro inválido proporcionado: {id_migrante}")
            return jsonify({"success": False, "msg": "El ID del registro proporcionado no es válido."}), 400

        # Obtener los datos JSON del cuerpo de la solicitud
        data = request.get_json()
        if not data:
            current_app.logger.error("No se proporcionaron datos JSON en la solicitud PUT.")
            return jsonify({"success": False, "msg": "No se proporcionaron datos en la solicitud."}), 400
        
        current_app.logger.info(f"Datos recibidos para actualización del registro {id_migrante}: {data}")

        # Opcional: Validar los datos recibidos con el esquema si es necesario
        # Puedes decidir si quieres volver a validar todo o solo campos específicos.
        # Por simplicidad, aquí se omitirá la validación completa del esquema, 
        # pero en una aplicación robusta, podrías querer validar `data` contra `PoblacionMigranteSchema(partial=True)`.
        # Ejemplo:
        # try:
        #     poblacion_migrante_schema.load(data, partial=True) # partial=True permite actualizaciones parciales
        # except ValidationError as err:
        #     current_app.logger.error(f'Error de validación en actualización: {err.messages}')
        #     return jsonify({"success": False, "msg": "Error de validación en los datos de actualización.", "errors": err.messages}), 400

        # Eliminar campos que no deberían ser actualizados directamente
        if '_id' in data:
            del data['_id'] 
        # Considera si necesitas eliminar otros campos como funcionario_id, fecha_registro si no deben ser modificables.

        # Obtener colección de base de datos
        poblacion_migrante_collection = current_app.config['MONGO_DB']['poblacion_migrante']

        # Realizar la actualización en la base de datos
        result = poblacion_migrante_collection.update_one(
            {"_id": object_id},
            {"$set": data}
        )

        if result.matched_count == 0:
            current_app.logger.warn(f"Intento de actualizar registro no encontrado con ID: {id_migrante}")
            return jsonify({"success": False, "msg": "Registro no encontrado."}), 404
        elif result.modified_count == 0:
            current_app.logger.info(f"Registro {id_migrante} encontrado pero no modificado (datos idénticos).")
            return jsonify({
                "success": True,
                "msg": "Los datos del registro son los mismos, no se realizaron cambios.",
                "id": id_migrante
            }), 200
        else:
            current_app.logger.info(f"Registro {id_migrante} actualizado exitosamente.")
            return jsonify({
                "success": True,
                "msg": "Registro actualizado exitosamente.",
                "id": id_migrante
            }), 200

    except Exception as e:
        current_app.logger.error(f"Error inesperado al actualizar el registro {id_migrante}: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "msg": "Ocurrió un error interno en el servidor."}), 500


@poblacion_migrante_bp.route('/listar', methods=['GET'])
@jwt_required()
def listar_poblacion_migrante():
    try:
        usuario_actual = get_jwt_identity()
        current_app.logger.info(f'Listando población migrante para usuario: {usuario_actual}')

        pagina = int(request.args.get('pagina', 1))
        por_pagina = int(request.args.get('por_pagina', 10))
        filtro = request.args.get('filtro', '')
        linea_trabajo = request.args.get('linea_trabajo', None)
       
        # Validar parámetros
        if not linea_trabajo:
            current_app.logger.error('No se proporcionó línea de trabajo')
            return jsonify({
                'error': 'Línea de trabajo no proporcionada',
                'mensaje': 'Es necesario especificar una línea de trabajo válida'
            }), 400

        # Validar formato de línea de trabajo
      

        if not re.match(r'^[0-9a-fA-F]{24}$', linea_trabajo):
            current_app.logger.error(f'Formato de línea de trabajo inválido: {linea_trabajo}')
            return jsonify({
                'error': 'Formato de línea de trabajo inválido',
                'mensaje': 'El ID de línea de trabajo debe ser un ObjectId válido'
            }), 400

        from datetime import datetime
        
        # Obtener colección
        poblacion_migrante = current_app.config['MONGO_DB']['poblacion_migrante']
        lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']
        
        # Verificar línea de trabajo
        linea_trabajo_doc = lineas_trabajo.find_one({"_id": ObjectId(linea_trabajo)})

        if not linea_trabajo_doc:
            current_app.logger.error(f'Línea de trabajo no encontrada: {linea_trabajo}')
            return jsonify({
                'error': 'Línea de trabajo no encontrada',
                'mensaje': 'La línea de trabajo especificada no existe'
            }), 404
        current_app.logger.info(f'Filtro: {filtro}')

        # Contar documentos con comparación más flexible
        total_linea_trabajo = poblacion_migrante.count_documents({"linea_trabajo": linea_trabajo})

        # Si no hay documentos, retornar respuesta informativa
        if total_linea_trabajo == 0:
            current_app.logger.warning(f'No hay documentos para la línea de trabajo {linea_trabajo}')
            return jsonify({
                'poblacion_migrante': [],
                'total': 0,
                'pagina_actual': pagina,
                'total_paginas': 0,
                'mensaje': 'No se encontraron registros para esta línea de trabajo'
            }), 200

        # Inicializar lista de población migrante
        lista_poblacion_migrante = []

        # Construir filtros de búsqueda
        filtro_query = {"linea_trabajo": linea_trabajo}
        if filtro:
            filtro_query['$or'] = [
                {"nombre_completo": {"$regex": filtro, "$options": "i"}},
                {"numero_documento": {"$regex": filtro, "$options": "i"}},
                {"pais_origen": {"$regex": filtro, "$options": "i"}}
            ]

        # Contar total de documentos con filtro
        total_documentos = poblacion_migrante.count_documents(filtro_query)
        
        # Obtener documentos paginados
        documentos = list(poblacion_migrante.find(filtro_query)
            .sort('fecha_registro', -1)  # Ordenar por fecha de registro descendente
            .skip((pagina - 1) * por_pagina)  # Saltar documentos de páginas anteriores
            .limit(por_pagina)  # Limitar documentos por página
        )

        # Verificar si hay documentos
        if not documentos:
            current_app.logger.warning('No se encontraron documentos con los filtros especificados')

        # Convertir ObjectId a string y enriquecer datos
        for doc in documentos:
            doc['_id'] = str(doc['_id'])
            doc['linea_trabajo'] = str(doc['linea_trabajo'])
            doc['nombre_linea_trabajo'] = linea_trabajo_doc.get('nombre', 'Sin nombre')
            lista_poblacion_migrante.append(doc)

        # Calcular total de páginas
        total_paginas = math.ceil(total_documentos / por_pagina)

        return jsonify({
            'poblacion_migrante': lista_poblacion_migrante,
            'total': total_documentos,
            'pagina_actual': pagina,
            'total_paginas': total_paginas
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error al listar población migrante: {str(e)}")
        current_app.logger.error(f"Detalles: {traceback.format_exc()}")
        return jsonify({
            'error': 'Error al listar población migrante',
            'mensaje': str(e)
        }), 500

@poblacion_migrante_bp.route('/<id>', methods=['GET'])
@jwt_required()
def obtener_poblacion_migrante(id):
    try:
        poblacion_migrante = current_app.config['MONGO_DB']['poblacion_migrante']
        
        # Buscar por ID
        registro = poblacion_migrante.find_one({'_id': ObjectId(id)})
        
        if not registro:
            return jsonify({"msg": "Registro no encontrado"}), 404

        # Convertir ObjectId a string
        registro['_id'] = str(registro['_id'])
        
        return jsonify(registro), 200

    except Exception as e:
        current_app.logger.error(f"Error al obtener registro de población migrante: {str(e)}")
        return jsonify({
            "msg": f"Error interno: {str(e)}"
        }), 500

@poblacion_migrante_bp.route('/<id>', methods=['PUT'])
@jwt_required()
def actualizar_poblacion_migrante(id):
    try:
        # Obtener datos del request
        data = request.get_json()
        
        # Validar datos con el esquema
        try:
            poblacion_migrante_validada = poblacion_migrante_schema.load(data)
        except ValidationError as err:
            return jsonify({
                "msg": "Error de validación",
                "errors": err.messages
            }), 400

        # Obtener colección
        poblacion_migrante = current_app.config['MONGO_DB']['poblacion_migrante']
        
        # Actualizar registro
        resultado = poblacion_migrante.update_one(
            {'_id': ObjectId(id)},
            {'$set': poblacion_migrante_validada}
        )

        if resultado.modified_count == 0:
            return jsonify({"msg": "Registro no encontrado o sin cambios"}), 404

        return jsonify({
            "msg": "Registro actualizado exitosamente",
            "id": id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error al actualizar población migrante: {str(e)}")
        return jsonify({
            "msg": f"Error interno: {str(e)}"
        }), 500

@poblacion_migrante_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
def eliminar_poblacion_migrante(id):
    try:
        poblacion_migrante = current_app.config['MONGO_DB']['poblacion_migrante']
        
        # Eliminar registro
        resultado = poblacion_migrante.delete_one({'_id': ObjectId(id)})

        if resultado.deleted_count == 0:
            return jsonify({"msg": "Registro no encontrado"}), 404

        return jsonify({
            "msg": "Registro eliminado exitosamente"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error al eliminar población migrante: {str(e)}")
        return jsonify({
            "msg": f"Error interno: {str(e)}"
        }), 500

@poblacion_migrante_bp.route('/exportar', methods=['GET'])
@jwt_required()
def exportar_poblacion_migrante():
    try:
        # Parámetros de filtrado
        filtro = request.args.get('filtro', '')
        linea_trabajo = request.args.get('linea_trabajo')

        # Obtener colección
        poblacion_migrante = current_app.config['MONGO_DB']['poblacion_migrante']
        
        # Construir filtro
        filtro_query = {}
        if filtro:
            filtro_query['$or'] = [
                {'nombre_completo': {'$regex': filtro, '$options': 'i'}},
                {'numero_documento': {'$regex': filtro, '$options': 'i'}},
                {'pais_origen': {'$regex': filtro, '$options': 'i'}}
            ]
        
        if linea_trabajo:
            filtro_query['linea_trabajo'] = linea_trabajo

        # Obtener registros
        registros = list(poblacion_migrante.find(filtro_query))

        # Convertir a DataFrame
        df = pd.DataFrame(registros)
        
        # Limpiar columnas
        if not df.empty:
            df['_id'] = df['_id'].astype(str)
            df.drop(['_id'], axis=1, inplace=True)

        # Generar Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Población Migrante')

        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='poblacion_migrante.xlsx'
        )

    except Exception as e:
        current_app.logger.error(f"Error al exportar población migrante: {str(e)}")
        return jsonify({
            "msg": f"Error interno: {str(e)}"
        }), 500

@poblacion_migrante_bp.route('/verificar-documento', methods=['GET'])
@jwt_required()
def verificar_documento_unico():
    try:
        numero_documento = request.args.get('numero_documento')
        
        if not numero_documento:
            return jsonify({"msg": "Número de documento es requerido"}), 400

        # Obtener colección
        poblacion_migrante = current_app.config['MONGO_DB']['poblacion_migrante']
        
        # Verificar si el documento ya existe
        documento_existente = poblacion_migrante.find_one({
            'numero_documento': numero_documento
        })

        return jsonify({
            "es_unico": documento_existente is None
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error al verificar documento: {str(e)}")
        return jsonify({
            "msg": f"Error interno: {str(e)}"
        }), 500
