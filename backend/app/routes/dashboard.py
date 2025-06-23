from flask import Blueprint, jsonify, current_app
from datetime import datetime, timedelta
from bson import ObjectId
import sys

# Importaciones opcionales para gráficos
try:
    import io
    import pandas as pd
    import matplotlib.pyplot as plt
    import base64
    import numpy as np
    GRAFICOS_DISPONIBLES = True
    print("Dependencias de gráficos importadas correctamente")
except ImportError as e:
    print(f"Error al importar dependencias de gráficos: {e}")
    GRAFICOS_DISPONIBLES = False
    plt = None
    pd = None
    np = None
    io = None
    base64 = None

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/estadisticas', methods=['GET'])
def obtener_estadisticas():
    db = current_app.config['MONGO_DB']
    beneficiarios_collection = db['beneficiarios']
    
    # Año actual
    año_actual = datetime.now().year
    
    # Estadísticas generales
    estadisticas = {
        'total_beneficiarios': beneficiarios_collection.count_documents({
            'fecha_registro': {
                '$gte': datetime(año_actual, 1, 1),
                '$lte': datetime(año_actual, 12, 31)
            }
        }),
        'vulnerabilidad': {
            'victimas': beneficiarios_collection.count_documents({
                'victima': True,
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            'discapacidad': beneficiarios_collection.count_documents({
                'discapacidad': True,
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            })
        },
        'genero': {
            'masculino': beneficiarios_collection.count_documents({
                'genero': 'Masculino',
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            'femenino': beneficiarios_collection.count_documents({
                'genero': 'Femenino',
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            })
        },
        'grupos_edad': {
            '0-12': beneficiarios_collection.count_documents({
                'edad': {'$gte': 0, '$lt': 13},
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            '13-18': beneficiarios_collection.count_documents({
                'edad': {'$gte': 13, '$lt': 19},
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            '19-35': beneficiarios_collection.count_documents({
                'edad': {'$gte': 19, '$lt': 36},
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            '36-60': beneficiarios_collection.count_documents({
                'edad': {'$gte': 36, '$lt': 61},
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            '60+': beneficiarios_collection.count_documents({
                'edad': {'$gte': 61},
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            })
        },
        'comunas': {
            'Comuna 1: Zona Norte': beneficiarios_collection.count_documents({
                'comuna': 'Comuna 1: Zona Norte',
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            'Comuna 2: Porvenir - Platina': beneficiarios_collection.count_documents({
                'comuna': 'Comuna 2: Porvenir - Platina',
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            # Continuar con las demás comunas
        },
        'ayudas_entregadas': {
            'Alimentación': beneficiarios_collection.count_documents({
                'ayudas': {'$elemMatch': {'tipo': 'Alimentación'}},
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            'Salud': beneficiarios_collection.count_documents({
                'ayudas': {'$elemMatch': {'tipo': 'Salud'}},
                'fecha_registro': {
                    '$gte': datetime(año_actual, 1, 1),
                    '$lte': datetime(año_actual, 12, 31)
                }
            }),
            # Añadir más tipos de ayudas
        }
    }
    
    return jsonify(estadisticas), 200

@dashboard_bp.route('/estadisticas-graficas', methods=['GET'])
def obtener_estadisticas_graficas():
    try:
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        
        # Estadísticas para gráficos
        estadisticas = {
            'lineas_trabajo': obtener_estadistica_lineas_trabajo(beneficiarios),
            'rango_edad': obtener_estadistica_rango_edad(beneficiarios),
            'genero': obtener_estadistica_genero(beneficiarios),
            'nivel_educativo': obtener_estadistica_nivel_educativo(beneficiarios)
        }
        
        return jsonify(estadisticas)
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener estadísticas: {str(e)}")
        return jsonify({'error': 'No se pudieron obtener las estadísticas'}), 500

def obtener_estadistica_lineas_trabajo(beneficiarios):
    pipeline = [
        {'$group': {'_id': '$linea_trabajo_nombre', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    return list(beneficiarios.aggregate(pipeline))

def obtener_estadistica_rango_edad(beneficiarios):
    pipeline = [
        {'$group': {'_id': '$rango_edad', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    return list(beneficiarios.aggregate(pipeline))

def obtener_estadistica_genero(beneficiarios):
    pipeline = [
        {'$group': {'_id': '$genero', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    return list(beneficiarios.aggregate(pipeline))

def obtener_estadistica_nivel_educativo(beneficiarios):
    pipeline = [
        {'$group': {'_id': '$nivel_educativo', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    return list(beneficiarios.aggregate(pipeline))

@dashboard_bp.route('/exportar-grafico/<tipo>', methods=['GET'])
def exportar_grafico(tipo):
    if not GRAFICOS_DISPONIBLES:
        return jsonify({
            'error': 'Funcionalidad de gráficos no disponible. Instale matplotlib, pandas y numpy.',
            'dependencias_faltantes': {
                'matplotlib': 'matplotlib' not in sys.modules,
                'pandas': 'pandas' not in sys.modules,
                'numpy': 'numpy' not in sys.modules
            }
        }), 501

    try:
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        
        # Definir consultas para cada categoría con agregación más precisa
        pipeline_estadisticas = [
            {
                '$facet': {
                    'Total Víctimas de Conflicto': [{'$match': {'victima_conflicto': True}}, {'$count': 'total'}],
                    'Con Discapacidad': [{'$match': {'tiene_discapacidad': True}}, {'$count': 'total'}],
                    'Ayuda Humanitaria': [{'$match': {'recibe_ayuda_humanitaria': True}}, {'$count': 'total'}],
                    'Menores de 13': [{'$match': {'rango_edad': 'Menor de 13'}}, {'$count': 'total'}],
                    'Entre 13 y 25': [{'$match': {'rango_edad': 'Entre 13 y 25'}}, {'$count': 'total'}],
                    'Mayores de 25': [{'$match': {'rango_edad': 'Mayor de 25'}}, {'$count': 'total'}],
                    'Alfabetizados': [{'$match': {'alfabetizado': True}}, {'$count': 'total'}],
                    'Analfabetas': [{'$match': {'alfabetizado': False}}, {'$count': 'total'}],
                    'Mujeres Menores con Hijos': [
                        {'$match': {
                            'genero': 'Mujer', 
                            'rango_edad': 'Menor de 25', 
                            'numero_hijos': {'$gt': 0}
                        }}, 
                        {'$count': 'total'}
                    ],
                    'Menores Estudiando': [
                        {'$match': {
                            'rango_edad': 'Menor de 25', 
                            'estudia_actualmente': True
                        }}, 
                        {'$count': 'total'}
                    ],
                    'Beneficiarios Trabajando': [{'$match': {'trabajando': True}}, {'$count': 'total'}],
                    'Vivienda Propia': [{'$match': {'tipo_vivienda': 'Propia'}}, {'$count': 'total'}],
                    'Vivienda Arrendada': [{'$match': {'tipo_vivienda': 'Arrendada'}}, {'$count': 'total'}],
                    'Vivienda Familiar': [{'$match': {'tipo_vivienda': 'Familiar'}}, {'$count': 'total'}],
                    'Vivienda Compartida': [{'$match': {'tipo_vivienda': 'Compartida'}}, {'$count': 'total'}],
                    # 'Cuida Casa': [{'$match': {'cuida_casa': True}}, {'$count': 'total'}],
                    'Total Beneficiarios': [{'$count': 'total'}]
                }
            }
        ]
        
        # Ejecutar pipeline de agregación
        resultado = list(beneficiarios.aggregate(pipeline_estadisticas))[0]
        
        # Procesar resultados
        total_beneficiarios = resultado['Total Beneficiarios'][0]['total'] if resultado['Total Beneficiarios'] else 0
        
        # Preparar estadísticas
        estadisticas = {}
        for categoria, datos in resultado.items():
            if categoria != 'Total Beneficiarios':
                total = datos[0]['total'] if datos else 0
                porcentaje = (total / total_beneficiarios * 100) if total_beneficiarios > 0 else 0
                estadisticas[categoria] = {
                    'total': total,
                    'porcentaje': round(porcentaje, 2)
                }
        
        # Crear múltiples visualizaciones
        plt.figure(figsize=(20, 25))
        plt.subplots_adjust(hspace=0.6, wspace=0.3)
        
        # Definir tipos de gráficos
        tipos_graficos = {
            # Binarios (Sí/No) - Pie
            'Total Víctimas de Conflicto': ('pie', '#FF6B6B'),
            'Con Discapacidad': ('pie', '#4ECDC4'),
            'Ayuda Humanitaria': ('pie', '#45B7D1'),
            'Alfabetizados': ('pie', '#FDCB6E'),
            'Analfabetas': ('pie', '#6C5CE7'),
            'Beneficiarios Trabajando': ('pie', '#A8E6CF'),
            'Cuida Casa': ('pie', '#FF8ED4'),
            
            # Rangos de Edad - Barras Verticales
            'Menores de 13': ('bar', '#FF6B6B'),
            'Entre 13 y 25': ('bar', '#4ECDC4'),
            'Mayores de 25': ('bar', '#45B7D1'),
            
            # Casos Especiales - Barras Horizontales
            'Mujeres Menores con Hijos': ('barh', '#FDCB6E'),
            'Menores Estudiando': ('barh', '#6C5CE7'),
            
            # Tipos de Vivienda - Barras Verticales
            'Vivienda Propia': ('bar', '#A8E6CF'),
            'Vivienda Arrendada': ('bar', '#FF8ED4'),
            'Vivienda Familiar': ('bar', '#5F27CD')
        }
        
        # Crear subplots
        for i, (categoria, datos) in enumerate(estadisticas.items(), 1):
            plt.subplot(5, 3, i)
            
            # Preparar datos
            valores = [datos['total'], total_beneficiarios - datos['total']]
            etiquetas = [categoria, 'Otros']
            
            # Obtener tipo de gráfico y color
            tipo_grafico, color = tipos_graficos.get(categoria, ('bar', '#3498DB'))
            
            # Seleccionar tipo de gráfico
            if tipo_grafico == 'pie':
                plt.pie(valores, labels=etiquetas, autopct='%1.1f%%', 
                        startangle=90, colors=[color, '#E0E0E0'])
            elif tipo_grafico == 'bar':
                plt.bar(etiquetas, valores, color=[color, '#E0E0E0'])
            else:  # barh
                plt.barh(etiquetas, valores, color=[color, '#E0E0E0'])
            
            # Título con información
            plt.title(f'{categoria}\n({datos["total"]} / {total_beneficiarios})', fontsize=8)
            plt.xticks(rotation=45, ha='right', fontsize=6)
        
        # Título general
        plt.suptitle('Estadísticas de Beneficiarios', fontsize=16)
        
        # Guardar gráfico
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=200, bbox_inches='tight')
        buffer.seek(0)
        
        # Crear DataFrame para Excel
        df = pd.DataFrame.from_dict(estadisticas, orient='index')
        df.index.name = 'Categoría'
        df.reset_index(inplace=True)
        df.columns = ['Categoría', 'Total', 'Porcentaje (%)']
        
        # Crear archivo Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Hoja de Estadísticas
            df.to_excel(writer, sheet_name='Estadisticas', index=False)
            
            # Hoja de Detalles
            detalles_df = pd.DataFrame([
                ['Total de Beneficiarios', total_beneficiarios],
                ['Año de Registro', datetime.now().year]
            ], columns=['Descripción', 'Valor'])
            detalles_df.to_excel(writer, sheet_name='Detalles', index=False)
            
            # Hoja de Gráficos
            workbook = writer.book
            worksheet = workbook.add_worksheet('Gráficos')
            
            # Insertar imagen del gráfico
            worksheet.insert_image('B2', 'grafico.png', {'image_data': buffer})
            
            # Formatear hojas de Excel
            formato_titulo = workbook.add_format({'bold': True, 'bg_color': '#D3D3D3'})
            formato_numero = workbook.add_format({'num_format': '#,##0'})
            formato_porcentaje = workbook.add_format({'num_format': '0.00%'})
            
            for worksheet_name in ['Estadisticas', 'Detalles']:
                worksheet = writer.sheets[worksheet_name]
                worksheet.set_column('A:A', 30)
                worksheet.set_column('B:B', 15, formato_numero)
                worksheet.set_column('C:C', 15, formato_porcentaje)
                worksheet.write(0, 0, 'Categoría', formato_titulo)
                worksheet.write(0, 1, 'Total', formato_titulo)
                worksheet.write(0, 2, 'Porcentaje (%)', formato_titulo)
        
        output.seek(0)
        
        return jsonify({
            'imagen': base64.b64encode(buffer.getvalue()).decode('utf-8'),
            'datos_excel': base64.b64encode(output.getvalue()).decode('utf-8')
        })
    
    except Exception as e:
        current_app.logger.error(f"Error al exportar gráfico: {str(e)}", exc_info=True)
        return jsonify({'error': 'No se pudo exportar el gráfico', 'detalle': str(e)}), 500
