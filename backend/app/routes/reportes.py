from flask import Blueprint, request, jsonify, current_app, send_file
from bson import ObjectId
from datetime import datetime, timedelta
import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/beneficiarios', methods=['GET'])
def generar_reporte_beneficiarios():
    try:
        # Obtener parámetros de consulta
        mes = request.args.get('mes', type=int, default=datetime.now().month)
        año = request.args.get('año', type=int, default=datetime.now().year)
        
        # Configurar rango de fechas
        fecha_inicio = datetime(año, mes, 1)
        if mes == 12:
            fecha_fin = datetime(año + 1, 1, 1)
        else:
            fecha_fin = datetime(año, mes + 1, 1)
        
        # Obtener la colección de beneficiarios
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        
        # Pipeline de agregación para obtener beneficiarios
        pipeline = [
            {
                '$match': {
                    'fecha_registro': {
                        '$gte': fecha_inicio,
                        '$lt': fecha_fin
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'lineas_trabajo',
                    'localField': 'linea_trabajo',
                    'foreignField': '_id',
                    'as': 'linea_trabajo_info'
                }
            },
            {
                '$unwind': '$linea_trabajo_info'
            },
            {
                '$project': {
                    'nombre_completo': 1,
                    'edad': 1,
                    'genero': 1,
                    'linea_trabajo': '$linea_trabajo_info.nombre',
                    'fecha_registro': 1,
                    'vulnerabilidad': {
                        '$cond': [
                            {'$or': [
                                {'$eq': ['$victima', True]}, 
                                {'$eq': ['$discapacidad', True]}
                            ]},
                            'Sí', 'No'
                        ]
                    }
                }
            }
        ]
        
        # Ejecutar pipeline
        resultados = list(beneficiarios.aggregate(pipeline))
        
        # Convertir a DataFrame
        df = pd.DataFrame(resultados)
        
        # Generar PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Título
        titulo = Paragraph(f"Reporte de Beneficiarios - {fecha_inicio.strftime('%B %Y')}", styles['Title'])
        
        # Convertir DataFrame a lista para tabla
        data = [df.columns.tolist()] + df.values.tolist()
        
        # Estilo de tabla
        tabla = Table(data)
        tabla.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 12),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        
        # Contenido del PDF
        contenido = [titulo, tabla]
        
        # Generar PDF
        doc.build(contenido)
        buffer.seek(0)
        
        return send_file(
            buffer, 
            mimetype='application/pdf', 
            as_attachment=True, 
            download_name=f'reporte_beneficiarios_{fecha_inicio.strftime("%B_%Y")}.pdf'
        )
    
    except Exception as e:
        return jsonify({"msg": f"Error al generar reporte: {str(e)}"}), 500

@reportes_bp.route('/estadisticas', methods=['GET'])
def obtener_estadisticas_reportes():
    try:
        # Obtener parámetros de consulta
        mes = request.args.get('mes', type=int, default=datetime.now().month)
        año = request.args.get('año', type=int, default=datetime.now().year)
        
        # Configurar rango de fechas
        fecha_inicio = datetime(año, mes, 1)
        if mes == 12:
            fecha_fin = datetime(año + 1, 1, 1)
        else:
            fecha_fin = datetime(año, mes + 1, 1)
        
        # Obtener la colección de beneficiarios
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        
        # Estadísticas generales
        pipeline_base = [
            {
                '$match': {
                    'fecha_registro': {
                        '$gte': fecha_inicio,
                        '$lt': fecha_fin
                    }
                }
            }
        ]
        
        estadisticas = {
            'total_beneficiarios': beneficiarios.count_documents({
                'fecha_registro': {
                    '$gte': fecha_inicio,
                    '$lt': fecha_fin
                }
            }),
            'beneficiarios_victimas': beneficiarios.count_documents({
                **pipeline_base[0]['$match'], 
                'victima': True
            }),
            'beneficiarios_discapacidad': beneficiarios.count_documents({
                **pipeline_base[0]['$match'], 
                'discapacidad': True
            }),
            'beneficiarios_por_genero': list(beneficiarios.aggregate([
                *pipeline_base,
                {
                    '$group': {
                        '_id': '$genero',
                        'total': {'$sum': 1}
                    }
                }
            ])),
            'beneficiarios_por_edad': list(beneficiarios.aggregate([
                *pipeline_base,
                {
                    '$group': {
                        '_id': {
                            '$switch': {
                                'branches': [
                                    {'case': {'$lte': ['$edad', 12]}, 'then': '0-12'},
                                    {'case': {'$lte': ['$edad', 17]}, 'then': '13-17'},
                                    {'case': {'$lte': ['$edad', 25]}, 'then': '18-25'},
                                    {'case': {'$lte': ['$edad', 35]}, 'then': '26-35'},
                                    {'case': {'$lte': ['$edad', 45]}, 'then': '36-45'},
                                    {'case': {'$lte': ['$edad', 55]}, 'then': '46-55'},
                                    {'case': {'$lte': ['$edad', 65]}, 'then': '56-65'}
                                ],
                                'default': '65+'
                            }
                        },
                        'total': {'$sum': 1}
                    }
                },
                {'$sort': {'_id': 1}}
            ])),
            'beneficiarios_por_linea_trabajo': list(beneficiarios.aggregate([
                *pipeline_base,
                {
                    '$lookup': {
                        'from': 'lineas_trabajo',
                        'localField': 'linea_trabajo',
                        'foreignField': '_id',
                        'as': 'linea_trabajo_info'
                    }
                },
                {'$unwind': '$linea_trabajo_info'},
                {
                    '$group': {
                        '_id': '$linea_trabajo_info.nombre',
                        'total': {'$sum': 1}
                    }
                }
            ])),
            'beneficiarios_por_comuna': list(beneficiarios.aggregate([
                *pipeline_base,
                {
                    '$group': {
                        '_id': '$comuna',
                        'total': {'$sum': 1}
                    }
                }
            ]))
        }
        
        return jsonify(estadisticas), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al obtener estadísticas: {str(e)}"}), 500
