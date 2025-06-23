// Modificación para Dashboard.js
import React, { useState, useEffect } from 'react';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LineaTrabajoFiltro from '../../components/LineaTrabajoFiltro';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { exportarDatosYGraficasAExcel } from './exportUtils';
import { 
    Grid, 
    Typography, 
    Box, 
    Card, 
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,   
} from '@mui/material';

// Importaciones de iconos
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import GroupAdd from '@mui/icons-material/GroupAdd';
import FamilyRestroom from '@mui/icons-material/FamilyRestroom';
import House from '@mui/icons-material/House';
import Download from '@mui/icons-material/Download';
import {
    Accessibility,
    ChildCare,
    School,
    PersonSearch,
    People,
    Work
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import usuarioService from '../../services/usuarioService';
import estadisticasService from '../../services/estadisticasService';
import funcionarioService from '../../services/funcionarioService';
import beneficiarioService from '../../services/beneficiarioService';

import { PieChart, LineChart, Pie, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import MapaRegistros from '../../components/MapaRegistros';
import ComunasSidebar from '../../components/ComunasSidebar';

import { agruparPorComunaYBarrio, COMUNA_COLORS } from '../../components/MapaRegistros';

const Dashboard = () => {
    // Estado para los registros de beneficiarios (asegúrate de que SOLO esté aquí)
    const [registros, setRegistros] = useState([]);

    // ...otros estados y hooks

const exportarMapaYListadoPDF = async () => {
  // Tamaño oficio: 8.5 x 13 pulgadas = 612 x 936 pt
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [612, 936] });
  const pageWidth = 612;
  const pageHeight = 936;
  const margin = 36;
  const rowHeight = 22;
  const col1 = margin + 20;
  const col2 = pageWidth / 2 + 20;
  let y = margin + 60;

  // --- 1. LISTADO COMO TABLA TEXTO ---
  pdf.setFontSize(22);
  pdf.text('Listado de barrios x comunas y cantidad', pageWidth / 2, margin + 20, { align: 'center' });
  pdf.setFontSize(13);
  const agrupado = agruparPorComunaYBarrio(registros);
  const comunas = Object.keys(agrupado).sort();
  let columna = 0;
  let itemsPorColumna = Math.floor((pageHeight - 120) / rowHeight);
  let itemsEnColumna = 0;
  let x = col1;
  for (const comuna of comunas) {
    const color = COMUNA_COLORS[comuna] || '#333';
    if (itemsEnColumna > itemsPorColumna - 4) {
      columna++;
      if (columna > 1) {
        pdf.addPage([pageWidth, pageHeight], 'portrait');
        pdf.setFontSize(22);
        pdf.text('Listado de barrios x comunas y cantidad', pageWidth / 2, margin + 20, { align: 'center' });
        pdf.setFontSize(13);
        columna = 0;
      }
      x = columna === 0 ? col1 : col2;
      y = margin + 60;
      itemsEnColumna = 0;
    }
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(color);
    pdf.text(comuna, x, y);
    y += rowHeight;
    pdf.setFont(undefined, 'normal');
    for (const [barrio, cantidad] of Object.entries(agrupado[comuna])) {
      if (itemsEnColumna > itemsPorColumna - 2) {
        columna++;
        if (columna > 1) {
          pdf.addPage([pageWidth, pageHeight], 'portrait');
          pdf.setFontSize(22);
          pdf.text('Listado de barrios x comunas y cantidad', pageWidth / 2, margin + 20, { align: 'center' });
          pdf.setFontSize(13);
          columna = 0;
        }
        x = columna === 0 ? col1 : col2;
        y = margin + 60;
        itemsEnColumna = 0;
      }
      pdf.setTextColor('#222');
      pdf.text(barrio, x, y);
      pdf.setTextColor(color);
      pdf.text(String(cantidad), x + 180, y);
      y += rowHeight;
      itemsEnColumna++;
    }
    itemsEnColumna++;
    pdf.setTextColor('#222');
  }

  pdf.save('listado_barrios_x_comunas.pdf');
  enqueueSnackbar('¡Exportación exitosa! El PDF se ha descargado.', { variant: 'success' });
};




    const { enqueueSnackbar } = useSnackbar();

    // Imprimir solo el mapa o mapa+lista
    const imprimirMapa = (conLista = false) => {
      const mapa = document.getElementById('mapa-svg');
      if (!mapa) return;
      let htmlImprimir = '';
      if (conLista) {
        // Toma el HTML del div oculto (sidebar-comunas-print)
        const sidebar = document.getElementById('sidebar-comunas-print');
        htmlImprimir += sidebar ? sidebar.innerHTML : '';
        htmlImprimir += '<hr style="margin:32px 0;">';
      }
      // Agrega el SVG del mapa
      htmlImprimir += mapa.outerHTML;
      // Ventana de impresión
      const ventana = window.open('', '_blank');
      ventana.document.write(`
        <html>
          <head>
            <title>Imprimir Mapa y Listado</title>
            <style>
              @media print {
                html, body {
                  width: 100vw;
                  height: 100vh;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                  background: #fff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #mapa-svg {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100vw !important;
                  height: 100vh !important;
                  margin: 0 !important;
                  background: #fff !important;
                  border: none !important;
                  box-shadow: none !important;
                  z-index: 9999 !important;
                  page-break-after: avoid !important;
                  page-break-before: avoid !important;
                }
                body > *:not(#mapa-svg):not(#sidebar-comunas-print) {
                  display: none !important;
                }
                @page {
                  size: landscape;
                  margin: 0;
                }
              }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              #sidebar-comunas-print { margin-bottom: 32px; }
              hr { border: none; border-top: 2px solid #ccc; margin: 32px 0; }
            </style>
          </head>
          <body>
            ${htmlImprimir}
          </body>
        </html>
      `);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => {
        ventana.print();
        ventana.close();
      }, 500);
    };


    const [loading, setLoading] = useState(true); // 2. Estado para controlar la carga
    const [lineaSeleccionada, setLineaSeleccionada] = useState('');
    const [stats, setStats] = useState({
        totalFuncionarios: 0,
        totalLineasTrabajo: 0,
        totalBeneficiarios: 0
    });

    const [estadisticasBeneficiarios, setEstadisticasBeneficiarios] = useState({
        total_beneficiarios: 0,
        total_victimas: 0,
        total_discapacidad: 0,
        total_ayuda_humanitaria: 0,
        total_menores_13: 0,
        total_13_25: 0,
        total_mayores_25: 0,
        total_alfabetizados: 0,
        total_analfabetas: 0,
        total_mujeres_menores_con_hijos: 0
    });

    const [estadisticasGlobales, setEstadisticasGlobales] = useState({
        total_comunas: {},
        menores_estudian: 0,
        beneficiarios_trabajan: 0,
        vivienda_propia: 0,
        vivienda_arrendada: 0,
        vivienda_familiar: 0,
        vivienda_compartida: 0
    });

    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [datosGraficos, setDatosGraficos] = useState({});
    const [mostrarGraficos, setMostrarGraficos] = useState(false);
    const [loadingExportGraph, setLoadingExportGraph] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // Añadimos un estado para los datos mensuales
    const [datosMensuales, setDatosMensuales] = useState([]);
    // Paleta de colores más vivos
    const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F7', '#F7FF33', '#33FFF7', '#7D33FF', '#FF7D33'];

    // Paletas de colores específicas para cada gráfico (tonos más oscuros y contrastantes)
    const COLORS_VICTIMAS = ['#b71c1c', '#e53935']; // rojos intensos
    const COLORS_DISCAPACIDAD = ['#1b5e20', '#388e3c']; // verdes intensos
    const COLORS_AYUDA = ['#ff8f00', '#ffb300']; // amarillos/naranja fuertes
    const COLORS_ALFABETIZACION = ['#1a237e', '#3949ab']; // azules oscuros
    const COLORS_MUJERES_HIJOS = ['#4a148c', '#8e24aa']; // morados intensos
    const COLORS_LABORAL = ['#006064', '#00838f']; // cian oscuros

    // Paleta de colores oscuros para comunas (única y diferente a las demás)
    const COLORS_COMUNAS = [
        '#ad1457', '#6a1b9a', '#283593', '#1565c0', '#00838f', '#00695c', '#2e7d32', '#558b2f', '#f9a825',
        '#ef6c00', '#d84315', '#4e342e', '#424242', '#263238', '#212121', '#b71c1c', '#ff6f00', '#00bfae', '#3949ab'
    ];

    // Estado para los registros de beneficiarios
    const [loadingRegistros, setLoadingRegistros] = useState(true);
    const [errorRegistros, setErrorRegistros] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true); // 3. Activar carga al inicio

                const funcionarios = await funcionarioService.obtenerFuncionarios();
                const lineasTrabajoCount = await usuarioService.obtenerLineasTrabajo();

                let estadisticasBeneficiarios = {};
                let estadisticasMensuales = [];

                try {
                    estadisticasBeneficiarios = lineaSeleccionada
                        ? await estadisticasService.obtenerEstadisticasPorLinea(lineaSeleccionada)
                        : await estadisticasService.obtenerEstadisticasGlobalesAdmin();
                } catch (error) {
                    console.error('Error al obtener estadísticas globales admin:', error);
                }

                // Obtener datos mensuales
                try {
                    estadisticasMensuales = await estadisticasService.obtenerEstadisticasMensuales();
                    // CORRECCIÓN: Si la API devuelve null o undefined, usar []
                    if (!estadisticasMensuales) estadisticasMensuales = [];
                    const datosMensualesTransformados = Array.isArray(estadisticasMensuales)
    ? estadisticasMensuales.map(item => ({
        name: item.mes || item.nombre || item.label || '',
        beneficiarios: item.cantidad ?? item.total ?? item.value ?? 0
    }))
    : [];
setDatosMensuales(datosMensualesTransformados);
                } catch (error) {
                    setDatosMensuales([]);
                    console.error('Error al obtener estadísticas mensuales:', error);
                }

                setStats({
                    totalFuncionarios: funcionarios.length,
                    totalLineasTrabajo: lineasTrabajoCount.length,
                    totalBeneficiarios: estadisticasBeneficiarios.total_beneficiarios
                });

                setEstadisticasBeneficiarios(estadisticasBeneficiarios);
                setEstadisticasGlobales(estadisticasBeneficiarios);
                
                // Procesar datos para gráficos
                procesarDatosGraficos(estadisticasBeneficiarios);
            } catch (err) {
                console.error('Error al cargar estadísticas:', err);
            }finally {
                setLoading(false); // 4. Desactivar carga al finalizar (éxito o error)
            }
        };
        fetchStats();
    }, [lineaSeleccionada]);

    useEffect(() => {
        const cargarRegistros = async () => {
            try {
                setLoadingRegistros(true);
                const filtros = {};
                if (lineaSeleccionada) {
                    filtros.linea_trabajo = lineaSeleccionada;
                }
                filtros.por_pagina = 10000;
                const data = await beneficiarioService.obtenerBeneficiarios(filtros);
                let registros = [];
                if (Array.isArray(data)) {
                    registros = data;
                } else if (Array.isArray(data?.beneficiarios)) {
                    registros = data.beneficiarios;
                } else {
                    registros = [];
                }
                setRegistros(registros);
            } catch (err) {
                console.error('Error al cargar registros para el mapa:', err);
                setErrorRegistros('Error al cargar registros para el mapa: ' + (err?.message || JSON.stringify(err)));
            } finally {
                setLoadingRegistros(false);
            }
        };
        cargarRegistros();
    }, [lineaSeleccionada]);
    // ...
    // Handler para exportar todas las gráficas como una sola imagen PNG
    const handleExportarGraficasComoImagen = async () => {
    setLoadingExportGraph(true);
    setExportProgress(0);
    try {
        // Captura todas las gráficas (contenedor principal)
        const container = document.getElementById('graficos-container');
        if (!container) {
            enqueueSnackbar('No se encontró el contenedor de gráficas', { variant: 'error' });
            setLoadingExportGraph(false);
            return;
        }
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 300));
        const canvas = await html2canvas(container, { backgroundColor: '#fff', scale: 2 });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = 'graficas_dashboard.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportProgress(100);
        enqueueSnackbar('¡Gráficas exportadas como imagen!', { variant: 'success' });
    } catch (error) {
        enqueueSnackbar('Error al exportar la imagen', { variant: 'error' });
    } finally {
        setTimeout(() => setLoadingExportGraph(false), 600);
    }
};

    // ...
    // Handler para exportar estadísticas y gráficas a Excel
    const handleExportarEstadisticasExcel = async () => {
    setLoadingExportGraph(true);
    setExportProgress(0);
    try {
        // 1. Preparar datos tabulares
        const datosTabulares = [
            { Título: 'Total Funcionarios', Valor: stats.totalFuncionarios },
            { Título: 'Total Líneas de Trabajo', Valor: stats.totalLineasTrabajo },
            { Título: 'Total Beneficiarios', Valor: stats.totalBeneficiarios },
            { Título: 'Total Víctimas', Valor: estadisticasBeneficiarios.total_victimas },
            { Título: 'Total Discapacidad', Valor: estadisticasBeneficiarios.total_discapacidad },
            { Título: 'Total Ayuda Humanitaria', Valor: estadisticasBeneficiarios.total_ayuda_humanitaria },
            { Título: 'Total Menores de 13', Valor: estadisticasBeneficiarios.total_menores_13 },
            { Título: 'Total 13-25', Valor: estadisticasBeneficiarios.total_13_25 },
            { Título: 'Total Mayores de 25', Valor: estadisticasBeneficiarios.total_mayores_25 },
            { Título: 'Total Alfabetizados', Valor: estadisticasBeneficiarios.total_alfabetizados },
            { Título: 'Total Analfabetas', Valor: estadisticasBeneficiarios.total_analfabetas },
            { Título: 'Total Mujeres Menores con Hijos', Valor: estadisticasBeneficiarios.total_mujeres_menores_con_hijos },
        ];
        // 2. Exportar solo datos a Excel
        await exportarDatosYGraficasAExcel({ estadisticasTabulares: datosTabulares, graficas: [], nombreArchivo: 'estadisticas_de_beneficiarios.xlsx' });
        setExportProgress(100);
        enqueueSnackbar('Estadísticas exportadas a Excel', { variant: 'success' });
    } catch (error) {
        enqueueSnackbar('Error al exportar a Excel', { variant: 'error' });
    } finally {
        setTimeout(() => setLoadingExportGraph(false), 600);
    }
};

    // Función para procesar datos y crear estructura para gráficos
    const procesarDatosGraficos = (datos) => {
        const totalBeneficiarios = datos.total_beneficiarios || 0;
        
        // Crear datos procesados para cada categoría
        const datosVictimas = [
            { name: 'Son víctimas', value: datos.total_victimas || 0 },
            { name: 'No son víctimas', value: totalBeneficiarios - (datos.total_victimas || 0) }
        ];
        
        const datosDiscapacidad = [
            { name: 'Con discapacidad', value: datos.total_discapacidad || 0 },
            { name: 'Sin discapacidad', value: totalBeneficiarios - (datos.total_discapacidad || 0) }
        ];
        
        const datosAyudaHumanitaria = [
            { name: 'Recibieron ayuda', value: datos.total_ayuda_humanitaria || 0 },
            { name: 'No recibieron', value: totalBeneficiarios - (datos.total_ayuda_humanitaria || 0) }
        ];
        
        const datosEdad = [
            { name: 'Menores de 13', value: datos.total_menores_13 || 0 },
            { name: 'Entre 13 y 25', value: datos.total_13_25 || 0 },
            { name: 'Mayores de 25', value: datos.total_mayores_25 || 0 }
        ];
        
        const datosAlfabetizacion = [
            { name: 'Alfabeta', value: datos.total_alfabetizados || 0 },
            { name: 'Analfabetas', value: datos.total_analfabetas || 0 }
        ];
        
        const datosMujeresMenores = [
            { name: 'Con hijos', value: datos.total_mujeres_menores_con_hijos || 0 },
            { name: 'No tiene', value: totalBeneficiarios - (datos.total_mujeres_menores_con_hijos || 0) }
        ];
        
        const datosEstudian = [
            { name: 'Estudian', value: datos.menores_estudian || 0 },
            { name: 'No estudian', value: totalBeneficiarios - (datos.menores_estudian || 0) }
        ];
        
        const datosTrabajo = [
            { name: 'Trabajan', value: datos.beneficiarios_trabajan || 0 },
            { name: 'No trabajan', value: totalBeneficiarios - (datos.beneficiarios_trabajan || 0) }
        ];
        
        const datosVivienda = [
            { name: 'Propia', value: datos.vivienda_propia || 0 },
            { name: 'Arrendada', value: datos.vivienda_arrendada || 0 },
            { name: 'Familiar', value: datos.vivienda_familiar || 0 },
            { name: 'Compartida', value: datos.vivienda_compartida || 0 }
        ];
        
        // Procesar datos de comunas
        const datosComunas = Object.entries(datos.total_comunas || {}).map(([nombre, cantidad]) => ({
            name: nombre,
            value: cantidad
        }));

        setDatosGraficos({
            victimas: datosVictimas,
            discapacidad: datosDiscapacidad,
            ayudaHumanitaria: datosAyudaHumanitaria,
            edad: datosEdad,
            alfabetizacion: datosAlfabetizacion,
            mujeresMenores: datosMujeresMenores,
            estudian: datosEstudian,
            trabajo: datosTrabajo,
            vivienda: datosVivienda,

            comunas: datosComunas
        });
        
        setMostrarGraficos(true);
    };

    // Handler para exportar TODAS las gráficas (como antes, pero con loader centrado)
    const handleExportarGrafica = async () => {
    setLoadingExportGraph(true);
    setExportProgress(0);
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        // --- Exportar TODAS las gráficas en el mismo orden visual (incluida la mensual) ---
        const graficosContainer = document.getElementById('graficos-container');
        const graficos = Array.from(graficosContainer.querySelectorAll('.grafico-card'));
        let pageCount = 1;
        for (let i = 0; i < graficos.length; i += 2) {
            setExportProgress(Math.round((i / graficos.length) * 100));
            if (i > 0) pdf.addPage();
            // Primer gráfico (arriba)
            const canvas1 = await html2canvas(graficos[i], { backgroundColor: '#fff', scale: 2 });
            const imgData1 = canvas1.toDataURL('image/png');
            // --- Calcular tamaño proporcional ---
            let imgW1 = pageWidth - 20;
            let imgH1 = (imgW1 * canvas1.height) / canvas1.width;
            if (imgH1 > (pageHeight / 2) - 20) {
                imgH1 = (pageHeight / 2) - 20;
                imgW1 = (imgH1 * canvas1.width) / canvas1.height;
            }
            pdf.addImage(imgData1, 'PNG', (pageWidth - imgW1) / 2, 10, imgW1, imgH1);
            // Título
            pdf.setFontSize(10);
            pdf.text(graficos[i].querySelector('.MuiTypography-root')?.textContent || `Gráfica ${i + 1}`, 14, 10 + imgH1 + 8);
            // Segundo gráfico (abajo)
            if (i + 1 < graficos.length) {
                const canvas2 = await html2canvas(graficos[i + 1], { backgroundColor: '#fff', scale: 2 });
                const imgData2 = canvas2.toDataURL('image/png');
                let imgW2 = pageWidth - 20;
                let imgH2 = (imgW2 * canvas2.height) / canvas2.width;
                if (imgH2 > (pageHeight / 2) - 20) {
                    imgH2 = (pageHeight / 2) - 20;
                    imgW2 = (imgH2 * canvas2.width) / canvas2.height;
                }
                const y2 = (pageHeight / 2) + 5;
                pdf.addImage(imgData2, 'PNG', (pageWidth - imgW2) / 2, y2, imgW2, imgH2);
                pdf.setFontSize(10);
                pdf.text(graficos[i + 1].querySelector('.MuiTypography-root')?.textContent || `Gráfica ${i + 2}`, 14, y2 + imgH2 + 8);
            }
            pdf.setFontSize(10);
            pdf.text(`Página ${pageCount}`, pageWidth - 30, pageHeight - 10);
            pageCount++;
        }
        setExportProgress(100);
        pdf.save('graficos_dashboard.pdf');
        enqueueSnackbar('Gráficas exportadas con éxito', { variant: 'success' });
        setOpenExportDialog(false);
    } catch (error) {
        enqueueSnackbar('Error al exportar gráficas', { variant: 'error' });
    } finally {
        setTimeout(() => {
            setLoadingExportGraph(false);
            setExportProgress(0);
        }, 600);
    }
};

    // Función para renderizar gráficos con porcentaje y cantidad
    const renderPieChart = (data, title, colors) => {
        // Calcular total para mostrar valores absolutos
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        return (
            <Grid item xs={12} md={6} className="grafico-card">
                <Card elevation={3} sx={{ height: 350, p: 2, width: '100%', maxWidth: 550, mx: 'auto' }}>
                    <Typography variant="h6" gutterBottom>{title} (Total: {total})</Typography>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
    data={data}
    cx="50%"
    cy="50%"
    labelLine={false}
    outerRadius={80}
    label={({ percent, cx, cy, midAngle, outerRadius } = {}) => {
        // Calcula una posición más cercana al centro
        const RADIAN = Math.PI / 180;
        const radius = outerRadius - 20; // 20px más cerca del centro
        const xPos = cx + radius * Math.cos(-midAngle * RADIAN);
        const yPos = cy + radius * Math.sin(-midAngle * RADIAN);
        const percentage = (percent * 100).toFixed(1);
        return (
            <text x={xPos} y={yPos} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13}>
                {`${percentage}%`}
            </text>
        );
    }}
    fill="#8884d8"
    dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value, name) => [
                                    `${value} (${((value / total) * 100).toFixed(1)}%)`,
                                    name
                                ]}
                            />
                            <Legend 
                                formatter={(value, entry, index) => {
                                    const item = data[index];
                                    const percentage = ((item.value / total) * 100).toFixed(1);
                                    return `${value}: ${item.value} (${percentage}%)`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>
        );
    };


    const renderTarjetaEstadistica = (titulo, valor, icono, color = 'primary') => (
        <Grid item xs={12} md={4}>
            <Card elevation={3}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" color="textSecondary">
                                {titulo}
                            </Typography>
                            <Typography variant="h4" color={color}>
                                {valor}
                            </Typography>
                        </Box>
                        {icono}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    return (
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
            {/* Overlay de carga circular centrada con porcentaje */}
            {loading && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.35)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress size={100} thickness={5} value={100} variant="determinate" color="secondary" />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <Typography variant="h5" component="div" color="white">Cargando...</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            {loadingExportGraph && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.35)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress size={100} thickness={5} value={exportProgress} variant="determinate" color="secondary" />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <Typography variant="h5" component="div" color="white">{`${exportProgress}%`}</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            <Box>
                <Typography variant="h5" gutterBottom>
                    Dashboard Administrativo
                </Typography>
                <LineaTrabajoFiltro
                    lineaSeleccionada={lineaSeleccionada}
                    setLineaSeleccionada={setLineaSeleccionada}
                    incluirTodos={true}
                    disabled={loadingExportGraph}
                />
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Download />}
                    onClick={handleExportarEstadisticasExcel}
                    sx={{ my: 2 }}
                    disabled={loadingExportGraph}
                >
                    Exportar Estadísticas a Excel
                </Button>
            </Box>
            
            <Grid container spacing={3} sx={{ marginBottom: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h6" color="textSecondary">
                                        Funcionarios
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        {stats.totalFuncionarios}
                                    </Typography>
                                </Box>
                                <People color="primary" sx={{ fontSize: 50 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h6" color="textSecondary">
                                        Líneas de Trabajo
                                    </Typography>
                                    <Typography variant="h4" color="error">
                                        {stats.totalLineasTrabajo}
                                    </Typography>
                                </Box>
                                <AssessmentOutlined color="error" sx={{ fontSize: 50 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h6" color="textSecondary">
                                        Total Registros
                                    </Typography>
                                    <Typography variant="h4" color="success">
                                        {stats.totalBeneficiarios}
                                    </Typography>
                                </Box>
                                <GroupAdd color="success" sx={{ fontSize: 50 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h5" gutterBottom sx={{ marginTop: 3 }}>
                Estadísticas de Registros
            </Typography>
            
            <Grid container spacing={3}>
                {renderTarjetaEstadistica(
                    'Total Víctimas de Conflicto', 
                    estadisticasBeneficiarios.total_victimas, 
                    <PersonSearch color="warning" sx={{ fontSize: 50 }} />,
                    "warning"
                )}
                {renderTarjetaEstadistica(
                    'Con Discapacidad', 
                    estadisticasBeneficiarios.total_discapacidad, 
                    <Accessibility color="secondary" sx={{ fontSize: 50 }} />,
                    "secondary"
                )}
                {renderTarjetaEstadistica(
                    'Ayuda Humanitaria', 
                    estadisticasBeneficiarios.total_ayuda_humanitaria, 
                    <ChildCare color="success" sx={{ fontSize: 50 }} />,
                    "success"
                )}
                {renderTarjetaEstadistica(
                    'Menores de 13', 
                    estadisticasBeneficiarios.total_menores_13, 
                    <ChildCare color="info" sx={{ fontSize: 50 }} />,
                    "info"
                )}
                {renderTarjetaEstadistica(
                    'Entre 13 y 25', 
                    estadisticasBeneficiarios.total_13_25, 
                    <School color="info" sx={{ fontSize: 50 }} />,
                    "info"
                )}
                {renderTarjetaEstadistica(
                    'Mayores de 25', 
                    estadisticasBeneficiarios.total_mayores_25, 
                    <School color="secondary" sx={{ fontSize: 50 }} />,
                    "secondary"
                )}
                {renderTarjetaEstadistica(
                    'Alfabetizados', 
                    estadisticasBeneficiarios.total_alfabetizados, 
                    <School color="primary" sx={{ fontSize: 50 }} />,
                    "primary"
                )}
                {renderTarjetaEstadistica(
                    'Analfabetas', 
                    estadisticasBeneficiarios.total_analfabetas, 
                    <School color="error" sx={{ fontSize: 50 }} />,
                    "error"
                )}
                {renderTarjetaEstadistica(
                    'Mujeres Menores con Hijos', 
                    estadisticasBeneficiarios.total_mujeres_menores_con_hijos, 
                    <ChildCare color="warning" sx={{ fontSize: 50 }} />,
                    "warning"
                )}
            </Grid>

            <Typography variant="h5" gutterBottom sx={{ marginTop: 3 }}>
                Estadísticas Globales
            </Typography>
            
            <Grid container spacing={3}>
                {renderTarjetaEstadistica(
                    'Menores Estudiando', 
                    estadisticasGlobales.menores_estudian, 
                    <School color="primary" sx={{ fontSize: 50 }} />,
                    "primary"
                )}
                {renderTarjetaEstadistica(
                    'Beneficiarios Trabajando', 
                    estadisticasGlobales.beneficiarios_trabajan, 
                    <Work color="secondary" sx={{ fontSize: 50 }} />,
                    "secondary"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Propia', 
                    estadisticasGlobales.vivienda_propia, 
                    <House color="success" sx={{ fontSize: 50 }} />,
                    "success"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Arrendada', 
                    estadisticasGlobales.vivienda_arrendada, 
                    <House color="warning" sx={{ fontSize: 50 }} />,
                    "warning"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Familiar', 
                    estadisticasGlobales.vivienda_familiar, 
                    <FamilyRestroom color="info" sx={{ fontSize: 50 }} />,
                    "info"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Compartida', 
                    estadisticasGlobales.vivienda_compartida, 
                    <FamilyRestroom color="error" sx={{ fontSize: 50 }} />,
                    "error"
                )}
            </Grid>

            {mostrarGraficos && (
    <>
        <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
            Gráficos Estadísticos
        </Typography>
        
        <Grid container spacing={3} id="graficos-container">
    {/* Ajuste responsivo: cada gráfica ocupa toda la fila en móvil (xs=12) y media fila en desktop (md=6) */}
            {/* Primera fila de gráficos circulares */}
            {renderPieChart(datosGraficos.victimas, 'Víctimas de Conflicto', COLORS_VICTIMAS)}
            {renderPieChart(datosGraficos.discapacidad, 'Personas con Discapacidad', COLORS_DISCAPACIDAD)}

            {/* Segunda fila de gráficos circulares */}
            {renderPieChart(datosGraficos.ayudaHumanitaria, 'Ayuda Humanitaria', COLORS_AYUDA)}
            {renderPieChart(datosGraficos.alfabetizacion, 'Alfabetización', COLORS_ALFABETIZACION)}

            {/* Tercera fila de gráficos circulares */}
            {renderPieChart(datosGraficos.mujeresMenores, 'Mujeres Menores con Hijos', COLORS_MUJERES_HIJOS)}
            {renderPieChart(datosGraficos.trabajo, 'Situación Laboral', COLORS_LABORAL)}

            {/* Cuarta fila de gráficos circulares */}
            {renderPieChart(datosGraficos.edad, 'Distribución por Edad', COLORS)}
            {renderPieChart(datosGraficos.vivienda, 'Tipo de Vivienda', COLORS)}

            {/* Gráfica de Comunas */}
            <Grid item xs={12} md={6} className="grafico-card">
                <Card elevation={3} sx={{ height: 350, p: 2, width: '100%', maxWidth: 550, mx: 'auto' }}>
                    <Typography variant="h6" gutterBottom>Beneficiarios por Comuna</Typography>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
                                data={datosGraficos.comunas}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent, cx, cy, midAngle, outerRadius }) => {
    // Calcula una posición más cercana al centro
    const RADIAN = Math.PI / 180;
    const radius = outerRadius - 20; // 20px más cerca del centro
    const xPos = cx + radius * Math.cos(-midAngle * RADIAN);
    const yPos = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = (percent * 100).toFixed(0);
    return (
        <text x={xPos} y={yPos} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13}>
            {`${percentage}%`}
        </text>
    );
}}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {datosGraficos.comunas && datosGraficos.comunas.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_COMUNAS[index % COLORS_COMUNAS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value, name) => [
                                    `${value} beneficiarios`, 
                                    name
                                ]} 
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>
            
            {/* Gráfica de crecimiento mensual/anual */}
            {/* --- Filtro y gráfica de crecimiento mensual/anual con filtro de año --- */}
{Array.isArray(datosMensuales) && datosMensuales.length > 0 && (
    (() => {
        // Obtener los años únicos
        const aniosDisponibles = Array.from(new Set(datosMensuales.map(d => (d.name ? d.name.split('-')[0] : '')))).filter(Boolean);
        // Estado y efecto deben estar fuera del callback
        return (
    <>
        <Grid item xs={12} className="grafico-card" id="grafica-mensual-visible">
            <Card elevation={3} sx={{ p: 2, width: '100%', maxWidth: 700, mx: 'auto', height: 'auto' }}>
                <FiltroGraficaAnio
                    aniosDisponibles={aniosDisponibles}
                    datosMensuales={datosMensuales}
                    exportMode={false}
                />
            </Card>
        </Grid>
        {/* Contenedor oculto para exportación tamaño grande */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 1200, height: 600, pointerEvents: 'none', zIndex: -1 }} id="grafica-mensual-export">
            <div style={{ width: 1200, height: 600, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiltroGraficaAnio
                    aniosDisponibles={aniosDisponibles}
                    datosMensuales={datosMensuales}
                    exportMode={true}
                />
            </div>
        </div>
    </>
);
    })()
)}
        </Grid>
    </>
)}

<Button 
    variant="contained" 
    color="primary" 
    startIcon={<Download />}
    onClick={() => setOpenExportDialog(true)}
    sx={{ my: 2, mr: 2 }}
    disabled={loadingExportGraph}
>
    Exportar Gráficas
</Button>
<Button
    variant="contained"
    color="primary"
    onClick={exportarMapaYListadoPDF}
    startIcon={<PictureAsPdfIcon />}
>
    Exportar Barrios x Comunas PDF
</Button>
{/*
<Button
    variant="outlined"
    color="secondary"
    style={{ marginLeft: 12 }}
    onClick={copiarMapaAlPortapapeles}
>
    Copiar mapa al portapapeles
</Button>
*/}
<Button
    variant="outlined"
    color="secondary"
    sx={{ display: 'block', ml: 0, mt: 2 }}
    onClick={imprimirMapa}
>
    Imprimir mapa
</Button>

<Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)}>
    <DialogTitle>Exportar Gráficas</DialogTitle>
    <DialogContent>
        <Typography variant="body1" gutterBottom>
            Esta opción exportará todas las gráficas estadísticas mostradas en el dashboard
            en formato PDF o como una sola imagen PNG para su posterior análisis.
        </Typography>
        <Button 
            fullWidth 
            variant="contained" 
            color="primary"
            onClick={handleExportarGrafica}
            sx={{ mt: 2 }}
            disabled={loadingExportGraph}
        >
            Exportar Gráficas a PDF
        </Button>
        <Button 
            fullWidth 
            variant="outlined" 
            color="secondary"
            onClick={handleExportarGraficasComoImagen}
            sx={{ mt: 2 }}
            disabled={loadingExportGraph}
        >
            Exportar Gráficas como Imagen
        </Button>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setOpenExportDialog(false)} color="primary">
            Cancelar
        </Button>
    </DialogActions>
</Dialog>
        {/* --- MAPA DE REGISTROS DE BENEFICIARIOS --- */}
        <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                Mapa de registros de beneficiarios
            </Typography>
            {loadingRegistros ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <CircularProgress />
                </Box>
            ) : errorRegistros ? (
                <Typography color="error">{errorRegistros}</Typography>
            ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 4,
                    alignItems: 'stretch',
                    overflowX: 'auto',
                  }}
                >
                  <Box sx={{ width: { xs: '100%', md: 320 }, mb: { xs: 2, md: 0 } }}>
                    {/* Sidebar de comunas */}
                    <ComunasSidebar agrupadoPorComuna={require('../../components/MapaRegistros').agruparPorComunaYBarrio(registros)} />
                  </Box>
                  <Box id="mapa-svg" sx={{ flex: 1, mt: { xs: 2, md: 0 } }}>
                    {console.log('Registros para el mapa:', registros)}
                    {registros && registros.length > 0 && registros.some(r => r.barrio_lat && r.barrio_lng) ? (
                      <MapaRegistros registros={registros} />
                    ) : (
                      <Typography color="text.secondary" sx={{ mt: 4 }}>
                        No hay datos georreferenciados para mostrar en el mapa.
                      </Typography>
                    )}
                  </Box>
                </Box>
            )}
        </Box>
        </Box>
    );
};

// --- FiltroGraficaAnio: componente auxiliar para filtrar y mostrar la gráfica por año ---
function FiltroGraficaAnio({ aniosDisponibles, datosMensuales, exportMode = false, registros = [] }) {
    const [anioSeleccionado, setAnioSeleccionado] = React.useState(
        aniosDisponibles.length > 0 ? aniosDisponibles[aniosDisponibles.length - 1] : ''
    );
    React.useEffect(() => {
        if (aniosDisponibles.length > 0 && !aniosDisponibles.includes(anioSeleccionado)) {
            setAnioSeleccionado(aniosDisponibles[aniosDisponibles.length - 1]);
        }
    }, [aniosDisponibles, anioSeleccionado]);
    const datosFiltrados = datosMensuales.filter(d => d.name && d.name.startsWith(anioSeleccionado));
    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" gutterBottom>Crecimiento mensual de registros</Typography>
                <Box>
                    <label htmlFor="select-anio" style={{ marginRight: 8 }}>Año:</label>
                    <select
                        id="select-anio"
                        value={anioSeleccionado}
                        onChange={e => setAnioSeleccionado(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 4 }}
                    >
                        {aniosDisponibles.map(anio => (
                            <option key={anio} value={anio}>{anio}</option>
                        ))}
                    </select>
                </Box>
            </Box>
            {datosFiltrados.length > 0 ? (
                <ResponsiveContainer width={exportMode ? 1200 : "100%"} height={exportMode ? 600 : 350}>
                    <LineChart data={datosFiltrados} margin={{ top: 40, right: 60, left: 40, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="name"
                            tickFormatter={(str) => {
                                if (!str) return '';
                                const [year, month] = str.split("-");
                                const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                                if (!year || !month) return str;
                                return `${meses[parseInt(month, 10) - 1]} ${year}`;
                            }}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={value => [`${value}`, 'Cantidad']} labelFormatter={label => `Mes: ${label}`}/>
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="beneficiarios" 
                            stroke="#1976d2" 
                            strokeWidth={3} 
                            dot={{ r: 8, stroke: "#1976d2", strokeWidth: 3, fill: "#fff" }} 
                            activeDot={{ r: 12 }} 
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No hay datos mensuales para mostrar la gráfica en el año seleccionado.
                    </Typography>
                </Box>
            )}
        {/* Div oculto para impresión/exportación de la lista colorida */}
        <div id="sidebar-comunas-print" style={{display: 'none'}}>
          <ComunasSidebar agrupadoPorComuna={agruparPorComunaYBarrio(registros)} />
        </div>
        </>
    );
}

export default Dashboard;