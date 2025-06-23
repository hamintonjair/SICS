import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  FormHelperText,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Grid,
  Typography,
  Paper,
  Container,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  RadioGroup,
  Radio,
  InputAdornment
} from '@mui/material';
import { crearPoblacionMigrante, actualizarPoblacionMigrante } from '../../services/poblacionMigranteService';

// Importaciones de contexto
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import lineaTrabajoService from '../../services/lineaTrabajoService';
import { obtenerComunas } from '../../services/comunaService';

// Importaciones de estilos y componentes de layout
import PageLayout from '../../components/layout/PageLayout';

const RegistroPoblacionMigrante = () => {
  const location = useLocation(); // Agregar useLocation
  const { state } = location;
  const navigate = useNavigate();
  const pageTitle = 'Registro de Población Migrante';
  const pageDescription = 'Formulario para caracterización de población migrante en Quibdó';

  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [nombreLineaTrabajo, setNombreLineaTrabajo] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [comunas, setComunas] = useState([]);
  const currentDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    const cargarComunas = async () => {
      try {
        const comunasObtenidas = await obtenerComunas();
        setComunas(comunasObtenidas);
      } catch (error) {
        enqueueSnackbar('Error al cargar comunas', { variant: 'error' });
      }
    };

    cargarComunas();
  }, [enqueueSnackbar]);

  useEffect(() => {
    const cargarNombreLineaTrabajo = async () => {
      try {
        if (user?.linea_trabajo) {
          setNombreLineaTrabajo(user.linea_trabajo_nombre || '');
          try {
            const lineaTrabajoId = await lineaTrabajoService.obtenerNombreLineaTrabajo(user.linea_trabajo);
            setFormData((prevData) => ({ ...prevData, linea_trabajo: lineaTrabajoId }));
          } catch (idError) {
            console.warn('No se pudo obtener el ID de la línea de trabajo:', idError);
          }
        }
      } catch (error) {
        console.error('Error al cargar línea de trabajo:', error);
      }
    };

    cargarNombreLineaTrabajo();
  }, [user]);

  const initialFormState = useMemo(() => ({
    // Información personal
    funcionarioNombre: user?.nombre || '',
    nombreCompleto: '',
    correoElectronico: '',
    edad: '',
    fechaNacimiento: '',
    telefono: '',
    lugarOrigen: '',
    barrioResidencia: '',
    comunaResidencia: '',
    fechaRegistro: currentDate,
    fechaLlegadaColombia: '', // Fecha de llegada a Colombia
    sexo: '', // Añadido

    // Documentación
    tipoDocumento: '',
    numeroDocumento: '',
    otroDocumento: '',
    tienePPT: false,
    tieneDocumentoMigratorio: '',
    tipoDocumentoMigratorio: '',
    situacionMigratoria: '',

    // Trabajo
    workingStatus: 'No', // Se mantiene para saber si trabaja o no
    // workType: '', // Reemplazado por fuentePrincipalIngresos
    monthlyIncome: '', // Se mantiene por ahora, se revisará si es redundante después
    fuentePrincipalIngresos: '',
    fuentePrincipalIngresosOtro: '',
    procesoAcompanamientoMunicipal: [], // Array para selección múltiple
    necesidadApoyoConvalidacionTitulos: '',
    jefeHogarExperienciaDemostrable: '', // NUEVO (SI/NO)
    jefeHogarExperienciaCual: '', // NUEVO (Condicional)

    // Educación
    nivelEducativo: '', // Se mantienen. Opciones se actualizarán en el JSX.
    institucionEducativa: '', // Se mantienen.
    paisAdquisicionTituloProfesional: '', // NUEVO
    tituloHomologadoColombia: '', // NUEVO (SI/NO)
    razonNoHomologacionTitulo: '', // NUEVO (Condicional)

    // Familia
    cantidadHijos: '', // Se mantiene por ahora
    ocupacionHijos: '', // Se mantiene por ahora
    composicionNucleoFamiliar: { // NUEVO OBJETO
      hombres_0_17: '',
      hombres_18_59: '',
      hombres_60_mas: '',
      mujeres_0_17: '',
      mujeres_18_59: '',
      mujeres_60_mas: '',
      gestantes_0_17: '',
      gestantes_18_59: '',
      gestantes_60_mas: '',
      noBinarios_0_17: '',
      noBinarios_18_59: '',
      noBinarios_60_mas: '',
      // totalPersonasNucleo: '' // Podría calcularse dinámicamente
    },

    // Salud
    cuentaConAfiliacionPS: '', // Se mantiene
    sistemaSalud: '', // Se mantiene
    nombreSistemaSalud: '', // Se mantiene
    presentaFuncionalidadesDiferentes: '', // De la sección de diversidad funcional
    tipoDiversidadFuncionalAfectaciones: [], // De la sección de diversidad funcional
    tieneAntecedentesFamiliaresEnfermedades: '', // NUEVO (SI/NO)
    antecedentesFamiliaresEnfermedadesCuales: [], // NUEVO (Array de strings)
    presentaCondicionEspecificaSalud: '', // NUEVO (SI/NO)
    condicionEspecificaSaludCuales: [], // NUEVO (Array de strings)
    estaEnTratamientoMedico: '', // Se mantiene (Para tratamiento actual)
    treatmentDetails: '', // Se mantiene (Detalle del tratamiento actual)
    numeroPersonasConDiscapacidadHogar: '', // NUEVO: Cuántas personas con discapacidad en el hogar

    // Nutrición (NUEVA SECCIÓN)
    nutricion: {
      preocupacionPorAlimentos: '',
      noComioSaludablePorRecursos: '',
      comioPocosTiposAlimentosPorRecursos: '',
      saltoComidaPorRecursos: '',
      comioMenosPorRecursos: '',
      hogarSinAlimentosPorRecursos: '',
      hambreNoComioPorRecursos: '',
      diaSinComerPorRecursos: ''
    },
    condicionesVulnerabilidad: {
      victimaVBGUltimoAno: '', // Corregido
      requiereAcompanamientoVBG: '', // Añadido
      acompanamientoTemasVBG: [], // Ya estaba (es un array de checkboxes)
      acompanamientoTemasVBGOtro: '', // Ya estaba
      familiarReconocidoRUV: '', // Corregido
      dificultadesAccesoServicios: [], // Ya estaba (es un array de checkboxes)
      otroDificultadesAccesoServicios: '', // Ya estaba
      asistenciaHumanitariaRecibida: '', // Ya estaba
      tipoAsistenciaHumanitaria: [], // Ya estaba (es un array de checkboxes)
      otroTipoAsistenciaHumanitaria: '', // Ya estaba
      quienBrindoAsistenciaHumanitaria: [], // AÑADIDO PARA INICIALIZAR COMO ARRAY
      obligadoContraVoluntadAsistencia: '', // Ya estaba
      comodoTratoRecibidoAsistencia: '' // Ya estaba
    },
    // Situaciones especiales
    haEstadoVictimaViolencia: '',
    victimOfArmedConflict: '',
    haEstadoVictimaConflictoArmado: '',
    tipoVictimaConflictoArmado: '',

    // Necesidades de Acompañamiento (NUEVA SECCIÓN)
    necesidadesAcompanamientoNNA: [], // ACTUALIZADO para consistencia
    necesidadesAcompanamientoDerechosOtro: '', // NUEVO (Condicional si hay 'Otro')

    // Asistencia Humanitaria (NUEVA SECCIÓN)
    asistenciaHumanitaria: {
      recibioAsistencia: '', // SI/NO
      tiposAsistencia: [], // Selección múltiple (Alimento, Alojamiento, etc.)
      tiposAsistenciaOtra: '', // Condicional
      tratoRecibido: '' // Muy bueno, Bueno, Regular, Malo
    },

    // Medios de Comunicación (NUEVA SECCIÓN)
    mediosComunicacion: {
      mediosUtilizados: [], // Selección múltiple
      medioUtilizadoOtro: '' // Condicional
    },

    // Información adicional
    cuentaConSisben: '',
    sisbenStatus: '',
    necesitaActualizarSisben: '',
    needSisbenUpdate: '',
    healthSystem: '',

    // Medios de Comunicación y Observaciones
    observacionesAdicionales: '',
    healthSystemName: '',
    dondeAcudeCuandoNecesitaRegularizar: '',
    rutaRegularizacion: '',

    // Caracterización del Grupo Familiar
    caracterizacionGrupo: {
      numPersonasHogar: '',
      tieneNinosAdolescentes: '',
      ninos0a5: '',
      ninas0a5: '',
      hombresAdultos: '',
      mujeresAdultas: '',
      personasGestantes: '',
      tieneDiscapacidad: ''
    },

    // Información del funcionario
    lineaTrabajo: user?.linea_trabajo || ''
  }), [user, currentDate]);

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    console.groupEnd();
  }, [formData.workingStatus, formData.workType, formData.monthlyIncome]);

  // Lógica para modo edición
  useEffect(() => {
    // Mostrar todos los campos del formulario inicial

    if (state?.migrante && state?.modoEdicion) {
      const { migrante } = state;
      const camposFormulario = {
        // Campos de contacto
        correoElectronico: migrante.correo_electronico || user?.email || '',
        // Campos identificadores
        _id: migrante._id || '',
        funcionario_id: migrante.funcionario_id || user?.id || '',
        funcionario_nombre: migrante.funcionario_nombre || user?.nombre || '',

        // Información de llegada
        fechaLlegadaColombia: migrante.fecha_llegada || '',

        // Datos personales
        nombreCompleto: migrante.nombre_completo || '',
        edad: migrante.edad || '',
        fechaRegistro: migrante.fecha_registro || currentDate,
        telefono: migrante.telefono || '',
        lugarOrigen: migrante?.pais_origen || '',
        fecha_llegada: migrante?.fecha_llegada || currentDate,
        barrioResidencia: migrante.barrio || '',
        comunaResidencia: migrante.comunaResidencia || '',
        fechaNacimiento: migrante.fecha_nacimiento || '',
        etnia: migrante.etnia || '',
        sexo: migrante.sexo || '', // Añadido

        // Documentación
        tienePPT: migrante.tipoDocumentoMigratorio === 'PPT',
        tieneDocumentoMigratorio: migrante.tipoDocumentoMigratorio ? 'Sí' : 'No',
        tipoDocumento: migrante.tipo_documento || '',
        tipoDocumentoMigratorio: migrante.tipoDocumentoMigratorio || '',
        numeroDocumento: migrante.numero_documento || '',
        situacionMigratoria: migrante.situacion_migratoria || '',

        // Educación y trabajo
        nivelEducativo: migrante.nivelEducativo || '',
        institucionEducativa: migrante.institucionEducativa || '',
        workingStatus: migrante.workingStatus || 'No',
        workType: migrante.workingStatus === 'Sí' ? (migrante.workType || '') : '',
        // monthlyIncome: migrante.workingStatus === 'Sí' ? (migrante.ingresos_mensuales || '') : '',
        monthlyIncome: (() => {
          if (migrante.workingStatus === 'Sí' && typeof migrante.ingresos_mensuales === 'number') {
            const income = migrante.ingresos_mensuales;
            if (income < 500000) return 'Menos de $500,000';
            if (income >= 500001 && income <= 1000000) return '$500,001 - $1,000,000';
            if (income >= 1000001 && income <= 1500000) return '$1,000,001 - $1,500,000';
            if (income > 1500000) return 'Más de $1,500,000';
            return ''; // Debería cubrir todos los casos numéricos, pero por si acaso.
          } else if (migrante.workingStatus === 'Sí') {
            return migrante.ingresos_mensuales || ''; // Si ya es un string (aunque no debería serlo desde la DB)
          }
          return ''; // Si no está trabajando o no hay ingresos
        })(),

        // Servicios básicos
        servicioAgua: migrante.servicioAgua,
        servicioElectricidad: migrante.servicioElectricidad,
        servicioAlcantarillado: migrante.servicioAlcantarillado,
        servicioSalud: migrante.servicioSalud,
        healthSystem: migrante.healthSystem || '',
        sistemaSalud: migrante.healthSystem || '',
        healthSystemName: migrante.healthSystemName || '',
        nombreSistemaSalud: migrante.healthSystemName || '',
        // Estado SISBEN consolidado
        sisbenStatus: migrante.sisbenStatus || '',
        needSisbenUpdate: migrante.needSisbenUpdate || (migrante.sisbenStatus === 'No' ? 'Sí' : 'No'),

        // Vivienda
        tipoVivienda: migrante.tipoVivienda || '',
        condicionVivienda: migrante.condicionVivienda || '',

        // Familia
        // Información familiar consolidada
        tamanoNucleoFamiliar: migrante.tamanoNucleoFamiliar || '',
        cantidadNinosAdolescentes: migrante.cantidadNinosAdolescentes || '',
        rangoEdadNinosAdolescentes: migrante.rangoEdadNinosAdolescentes || '',
        ocupacionNinosAdolescentes: migrante.ocupacionNinosAdolescentes || '',

        // Salud
        hasDisability: migrante.disabilityType ? 'Sí' : 'No',
        discapacidad: migrante.disabilityType ? 'Sí' : 'No',
        tieneDiscapacidad: migrante.disabilityType ? 'Sí' : 'No',
        disabilityType: migrante.disabilityType || '',
        tipoDiscapacidad: migrante.disabilityType || '',
        familyDisability: migrante.familyDisability || '', // Usar directamente el valor de la DB ('Sí'/'No')
        discapacidadFamiliar: migrante.familyDisability || '', // Asumiendo que quieres el mismo valor aquí
        hasDiseases: migrante.diseaseDetails ? 'Sí' : 'No',
        enfermedad: migrante.diseaseDetails ? 'Sí' : 'No',
        tieneEnfermedad: migrante.diseaseDetails ? 'Sí' : 'No',
        diseaseDetails: migrante.diseaseDetails || '',
        detallesEnfermedad: migrante.diseaseDetails || '',
        permanentTreatment: migrante.permanentTreatment || '',
        tratamientoPermanente: migrante.permanentTreatment || '',
        estaEnTratamientoMedico: migrante.permanentTreatment === 'Sí' ? 'Sí' : 'No',
        treatmentDetails: migrante.treatmentDetails || '',
        detallesTratamiento: migrante.treatmentDetails || '',

        // Situaciones especiales
        victimaViolencia: migrante.victimOfViolence || '',
        haEstadoVictimaViolencia: migrante.victimOfViolence === 'Sí' ? 'Sí' : 'No',
        victimOfViolence: migrante.victimOfViolence || '',
        victimOfArmedConflict: migrante.victima_conflicto ? 'Sí' : 'No',
        victimaCOnflitoArmado: migrante.victima_conflicto ? 'Sí' : 'No',
        haEstadoVictimaConflictoArmado: migrante.victima_conflicto ? 'Sí' : 'No',
        victima_conflicto: migrante.victima_conflicto || false,
        tipoVictimaCOnflitoArmado: migrante.conflictVictimType || '',
        tipoVictimaConflictoArmado: migrante.conflictVictimType || '',
        conflictVictimType: migrante.conflictVictimType || '',

        // Información adicional
        // Tiempo en Colombia consolidado
        tiempoPermanenciaColombia: migrante.tiempoPermanenciaColombia || '',

        // Ruta de regularización consolidada
        supportRoute: migrante.supportRoute || '',

        // Línea de trabajo consolidada
        lineaTrabajo: migrante.linea_trabajo || user?.linea_trabajo || ''
      };


      setFormData({
        ...initialFormState,
        ...camposFormulario
      });
    }
  }, [state, user, currentDate, initialFormState]);

  const TIPOS_DOCUMENTO = [
    'Cédula de ciudadanía',
    'Cédula de extranjería',
    'Pasaporte',
    'Permiso especial de permanencia',
    'Sin documento',
    'PPT',
    'Otro'
  ];

  const SITUACIONES_MIGRATORIAS = [
    'Solicitante de refugio',
    'Refugiado',
    'Residente temporal',
    'En proceso de regularización',
    'Indocumentado',
    'Otro'
  ];

  // Agregar campo de documento migratorio en sección de situación migratoria
  useEffect(() => {
    // Lógica para manejar cambios en PPT
    if (formData.tienePPT === true && formData.tieneDocumentoMigratorio !== 'Sí') {
      setFormData(prevState => ({
        ...prevState,
        tieneDocumentoMigratorio: 'Sí',
        tipoDocumentoMigratorio: prevState.tipoDocumentoMigratorio || 'PPT',
        tipoDocumento: prevState.tipoDocumento || 'Cédula de Extranjería'
      }));
    }
  }, [formData.tienePPT, formData.tieneDocumentoMigratorio]);

  const renderDocumentoMigratorio = () => {
    // Condiciones de renderizado más explícitas
    const tienePPT = formData.tienePPT === true;
    const tieneDocumentoMigratorio = formData.tieneDocumentoMigratorio === 'Sí';

    const mostrarCamposDocumento = tienePPT || tieneDocumentoMigratorio;

    if (mostrarCamposDocumento) {
      return renderCamposDocumentoMigratorio();
    }

    return null;

    function renderCamposDocumentoMigratorio() {

      return (
        <React.Fragment>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="tieneDocumentoMigratorio-label">¿Tiene documento migratorio?</InputLabel>
              <Select
                labelId="tieneDocumentoMigratorio-label"
                name="tieneDocumentoMigratorio"
                value={formData.tieneDocumentoMigratorio || ''}
                label="¿Tiene documento migratorio?"
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="Sí">Sí</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="tipoDocumentoMigratorio-label">Tipo de Documento Migratorio</InputLabel>
              <Select
                labelId="tipoDocumentoMigratorio-label"
                name="tipoDocumentoMigratorio"
                value={formData.tipoDocumentoMigratorio || ''}
                label="Tipo de Documento Migratorio"
                onChange={handleChange}
                error={!!errors.tipoDocumentoMigratorio}
                fullWidth
              >
                <MenuItem value="PPT">Permiso de Permanencia Temporal (PPT)</MenuItem>
                <MenuItem value="PEP">Permiso Especial de Permanencia (PEP)</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="tipoDocumento-label">Tipo de Documento</InputLabel>
              <Select
                labelId="tipoDocumento-label"
                name="tipoDocumento"
                value={formData.tipoDocumento || ''}
                label="Tipo de Documento"
                onChange={handleChange}
                error={!!errors.tipoDocumento}
                fullWidth
              >
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Número de Documento"
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              error={!!errors.numeroDocumento}
              helperText={errors.numeroDocumento}
            />
          </Grid>

          {formData.tipoDocumento === 'Otro' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Especifique otro documento"
                name="otroDocumento"
                value={formData.otroDocumento}
                onChange={handleChange}
              />
            </Grid>
          )}
        </React.Fragment>
      );
    }
  };

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  console.log('[handleChange] Event:', { name, value, type, checked });

  const arrayCheckboxFields = [
    'procesoAcompanamientoMunicipal',
    'tipoDiversidadFuncionalAfectaciones',
    'antecedentesFamiliaresEnfermedadesCuales',
    'condicionEspecificaSaludCuales',
  ];

  const arrayCheckboxFieldsCondVul = [
    'acompanamientoTemasVBG',
    'dificultadesAccesoServicios',
    'tipoAsistenciaHumanitaria',
    'quienBrindoAsistenciaHumanitaria',
    'necesidadesAcompanamientoNNA'
  ];

  const arrayCheckboxFieldsAsistenciaHumanitaria = [
    'tiposAsistencia'
  ];

  // Nombres de los campos que son arrays de checkboxes en mediosComunicacion
  const arrayCheckboxFieldsMediosCom = [
    'mediosUtilizados' // Para el campo mediosComunicacion.mediosUtilizados
  ];
  
  // --- Lógica específica para campos especiales ---
  if (name === 'isPPT') {
    const boolValue = Boolean(checked);
    setFormData(prevState => ({
      ...prevState,
      [name]: boolValue,
      tieneDocumentoMigratorio: boolValue ? 'Sí' : 'No',
      ...(boolValue ? {
        tipoDocumentoMigratorio: prevState.tipoDocumentoMigratorio || 'PPT',
        tipoDocumento: prevState.tipoDocumento || 'Cédula de Extranjería'
      } : {
        tipoDocumentoMigratorio: '',
        tipoDocumento: '',
        numeroDocumento: ''
      })
    }));
    return;
  }

  if (name === 'tieneDocumentoMigratorio') {
    const isNo = value === 'No';
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
      tipoDocumento: isNo ? 'Sin documento' : (prevState.tipoDocumento === 'Sin documento' ? '' : prevState.tipoDocumento),
      numeroDocumento: isNo ? '' : (prevState.numeroDocumento === '' && prevState.tipoDocumento === 'Sin documento' ? '' : prevState.numeroDocumento),
      tipoDocumentoMigratorio: isNo ? '' : (prevState.tipoDocumentoMigratorio === '' ? '' : prevState.tipoDocumentoMigratorio),
    }));
    return;
  }

  if (name === 'workingStatus') {
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
      ...(value === 'No' ? {
        workType: '', 
        monthlyIncome: ''
      } : {})
    }));
    return;
  }

  if (name === 'ocupacionNinosAdolescentes') { 
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
      ...(value === 'programas_icbf' || value === 'ninguna' ? { institucionEducativa: '' } : {})
    }));
    return;
  }

  // Manejar campos anidados de caracterización de grupo
  if (name.startsWith('caracterizacionGrupo.')) {
    const fieldName = name.split('.')[1];
    setFormData(prevState => ({
      ...prevState,
      caracterizacionGrupo: {
        ...prevState.caracterizacionGrupo,
        [fieldName]: value
      }
    }));
    return;
  }
  // --- Fin de lógica específica para campos especiales ---

  if (name.includes('.')) {
    const [objectName, fieldName] = name.split('.', 2); 
    console.log('[handleChange] Parsed name (anidado):', { objectName, fieldName });

    if (objectName === 'condicionesVulnerabilidad' && arrayCheckboxFieldsCondVul.includes(fieldName) && type === 'checkbox') {
      console.log(`[handleChange] Campo anidado '${objectName}.${fieldName}' ES un array de checkboxes (condicionesVulnerabilidad).`);
      setFormData(prevData => {
        const currentArray = prevData[objectName]?.[fieldName] || [];
        let newArray;
        if (checked) {
          newArray = currentArray.includes(value) ? currentArray : [...currentArray, value];
        } else {
          newArray = currentArray.filter(item => item !== value);
        }
        return {
          ...prevData,
          [objectName]: {
            ...(prevData[objectName] || {}),
            [fieldName]: newArray
          }
        };
      });
    } else if (objectName === 'asistenciaHumanitaria' && arrayCheckboxFieldsAsistenciaHumanitaria.includes(fieldName) && type === 'checkbox') {
      console.log(`[handleChange] Campo anidado '${objectName}.${fieldName}' ES un array de checkboxes (asistenciaHumanitaria).`);
      setFormData(prevData => {
        const currentArray = prevData[objectName]?.[fieldName] || [];
        let newArray;
        if (checked) {
          newArray = currentArray.includes(value) ? currentArray : [...currentArray, value];
        } else {
          newArray = currentArray.filter(item => item !== value);
        }
        return {
          ...prevData,
          [objectName]: { 
            ...(prevData[objectName] || {}), 
            [fieldName]: newArray 
          }
        };
      });
    } else if (objectName === 'mediosComunicacion' && arrayCheckboxFieldsMediosCom.includes(fieldName) && type === 'checkbox') {
      console.log(`[handleChange] Campo anidado '${objectName}.${fieldName}' ES un array de checkboxes (mediosComunicacion).`);
      setFormData(prevData => {
        const currentArray = prevData[objectName]?.[fieldName] || [];
        let newArray;
        if (checked) {
          newArray = currentArray.includes(value) ? currentArray : [...currentArray, value];
        } else {
          newArray = currentArray.filter(item => item !== value);
        }
        return {
          ...prevData,
          [objectName]: { // mediosComunicacion
            ...(prevData[objectName] || {}), 
            [fieldName]: newArray // mediosUtilizados
          }
        };
      });
    } else {
      console.log(`[handleChange] Campo anidado '${objectName}.${fieldName}' NO es un array de checkboxes especial o no es checkbox.`);
      setFormData(prevData => ({
        ...prevData,
        [objectName]: {
          ...(prevData[objectName] || {}),
          [fieldName]: type === 'checkbox' ? checked : value
        }
      }));
    }
  } else if (type === 'checkbox') { 
    if (arrayCheckboxFields.includes(name)) {
      console.log(`[handleChange] Campo de nivel superior '${name}' ES un array de checkboxes.`);
      setFormData(prevData => {
        const currentArray = prevData[name] || [];
        let newArray;
        if (checked) {
          newArray = currentArray.includes(value) ? currentArray : [...currentArray, value];
        } else {
          newArray = currentArray.filter(item => item !== value);
        }
        return {
          ...prevData,
          [name]: newArray
        };
      });
    } else { 
      console.log(`[handleChange] Campo de nivel superior '${name}' NO es un array de checkboxes (es booleano).`);
      setFormData(prevData => ({
        ...prevData,
        [name]: checked
      }));
    }
  } else { 
    console.log(`[handleChange] Campo de nivel superior '${name}' es tipo '${type}'.`);
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  }
};

  const validateForm = () => {
    const newErrors = {};

    // Validaciones de campos personales
    if (!formData.nombreCompleto) {
      newErrors.nombreCompleto = 'El nombre completo es obligatorio';
    }
    if (!formData.correoElectronico) {
      newErrors.correoElectronico = 'Correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correoElectronico)) {
      newErrors.correoElectronico = 'Correo electrónico no es válido';
    }
    if (!formData.sexo) {
      newErrors.sexo = 'Sexo es requerido.';
    }
    // Puedes añadir más validaciones para otros campos personales aquí (fechaNacimiento, etc.)

    // Validaciones de situación migratoria
    if (!formData.fecha_llegada) {
      newErrors.fecha_llegada = 'La fecha de llegada es obligatoria';
    }
    if (!formData.situacionMigratoria) { // Corregido de situacion_migratoria
      newErrors.situacionMigratoria = 'La situación migratoria es obligatoria';
    }

    // Validaciones de Salud y Seguridad Social
    if (!formData.healthSystem) {
      newErrors.healthSystem = 'Debe indicar si cuenta con afiliación a EPS';
    } else if (formData.healthSystem === 'Sí' && !formData.healthSystemName) {
      newErrors.healthSystemName = 'El nombre de la EPS es obligatorio si cuenta con afiliación';
    }

    if (!formData.sisbenStatus) {
      newErrors.sisbenStatus = 'Debe indicar si cuenta con SISBÉN';
    } else if (formData.sisbenStatus === 'Sí' && !formData.needSisbenUpdate) {
      newErrors.needSisbenUpdate = 'Debe indicar si necesita actualizar la encuesta del SISBÉN';
    }

    if (!formData.tieneAntecedentesFamiliaresEnfermedades) {
      newErrors.tieneAntecedentesFamiliaresEnfermedades = 'Debe indicar si tiene antecedentes familiares de enfermedades';
    } else if (formData.tieneAntecedentesFamiliaresEnfermedades === 'Sí' && (!formData.antecedentesFamiliaresEnfermedadesCuales || formData.antecedentesFamiliaresEnfermedadesCuales.length === 0)) {
      newErrors.antecedentesFamiliaresEnfermedadesCuales = 'Debe especificar los antecedentes familiares';
    }

    if (!formData.presentaCondicionEspecificaSalud) {
      newErrors.presentaCondicionEspecificaSalud = 'Debe indicar si presenta alguna condición específica de salud';
    } else if (formData.presentaCondicionEspecificaSalud === 'Sí' && (!formData.condicionEspecificaSaludCuales || formData.condicionEspecificaSaludCuales.length === 0)) {
      newErrors.condicionEspecificaSaludCuales = 'Debe especificar las condiciones de salud';
    }
    
    // Validaciones para la sección de Nutrición (5 preguntas actuales)
    if (!formData.nutricion.preocupacionPorAlimentos) {
      newErrors['nutricion.preocupacionPorAlimentos'] = 'Respuesta requerida';
    }
    // Se eliminó la validación para nutricion.noComioSaludablePorRecursos
    // Se eliminó la validación para nutricion.comioPocoPorRecursos
    // Se eliminó la validación para nutricion.seQuedoSinAlimentosPorRecursos
    if (!formData.nutricion.soloComioAlgunasVecesPorRecursos) {
      newErrors['nutricion.soloComioAlgunasVecesPorRecursos'] = 'Respuesta requerida';
    }
    if (!formData.nutricion.dejoDeComerPorRecursos) {
      newErrors['nutricion.dejoDeComerPorRecursos'] = 'Respuesta requerida';
    }
    if (!formData.nutricion.tuvoHambreNoComioPorRecursos) {
      newErrors['nutricion.tuvoHambreNoComioPorRecursos'] = 'Respuesta requerida';
    }
    if (!formData.nutricion.perdioPesoPorRecursos) {
      newErrors['nutricion.perdioPesoPorRecursos'] = 'Respuesta requerida';
    }

    // Validaciones para Condiciones de Vulnerabilidad
    if (!formData.condicionesVulnerabilidad?.victimaVBGUltimoAno) {
      newErrors['condicionesVulnerabilidad.victimaVBGUltimoAno'] = 'Respuesta requerida.';
    }
    if (formData.condicionesVulnerabilidad?.victimaVBGUltimoAno === 'Sí') {
      if (!formData.condicionesVulnerabilidad?.requiereAcompanamientoVBG) {
        newErrors['condicionesVulnerabilidad.requiereAcompanamientoVBG'] = 'Respuesta requerida.';
      }
      if (formData.condicionesVulnerabilidad?.requiereAcompanamientoVBG === 'Sí') {
        if (!formData.condicionesVulnerabilidad?.acompanamientoTemasVBG || formData.condicionesVulnerabilidad.acompanamientoTemasVBG.length === 0) {
          newErrors['condicionesVulnerabilidad.acompanamientoTemasVBG'] = 'Debe seleccionar al menos un tema de acompañamiento.';
        }
        if (formData.condicionesVulnerabilidad?.acompanamientoTemasVBG?.includes('Otro') && !formData.condicionesVulnerabilidad?.acompanamientoTemasVBGOtro) {
          newErrors['condicionesVulnerabilidad.acompanamientoTemasVBGOtro'] = 'Por favor, especifique el otro tema de acompañamiento.';
        }
      }
    }
    if (!formData.condicionesVulnerabilidad?.familiarReconocidoRUV) {
      newErrors['condicionesVulnerabilidad.familiarReconocidoRUV'] = 'Respuesta requerida.';
    }
    if (formData.condicionesVulnerabilidad?.dificultadesAccesoServicios?.includes('Otro') && !formData.condicionesVulnerabilidad?.otroDificultadesAccesoServicios) {
      newErrors['condicionesVulnerabilidad.otroDificultadesAccesoServicios'] = 'Por favor, especifique la otra dificultad de acceso.';
    }
    if (!formData.condicionesVulnerabilidad?.asistenciaHumanitariaRecibida) {
      newErrors['condicionesVulnerabilidad.asistenciaHumanitariaRecibida'] = 'Respuesta requerida.';
    }
    if (formData.condicionesVulnerabilidad?.asistenciaHumanitariaRecibida === 'Sí') {
      if (!formData.condicionesVulnerabilidad?.tipoAsistenciaHumanitaria || formData.condicionesVulnerabilidad.tipoAsistenciaHumanitaria.length === 0) {
        newErrors['condicionesVulnerabilidad.tipoAsistenciaHumanitaria'] = 'Debe seleccionar al menos un tipo de asistencia.';
      }
      if (formData.condicionesVulnerabilidad?.tipoAsistenciaHumanitaria?.includes('Otro') && !formData.condicionesVulnerabilidad?.otroTipoAsistenciaHumanitaria) {
        newErrors['condicionesVulnerabilidad.otroTipoAsistenciaHumanitaria'] = 'Por favor, especifique el otro tipo de asistencia.';
      }
      if (!formData.condicionesVulnerabilidad?.obligadoContraVoluntadAsistencia) {
        newErrors['condicionesVulnerabilidad.obligadoContraVoluntadAsistencia'] = 'Respuesta requerida.';
      }
      if (!formData.condicionesVulnerabilidad?.comodoTratoRecibidoAsistencia) {
        newErrors['condicionesVulnerabilidad.comodoTratoRecibidoAsistencia'] = 'Respuesta requerida.';
      }
    }

    // Validación de campos condicionales (ejemplo existente)
    if (formData.hasDisability === 'Sí' && !formData.disabilityType) {
      newErrors.disabilityType = 'Debe seleccionar un tipo de discapacidad';
    }

    setErrors(newErrors);
    return newErrors; // Devuelve el objeto de errores para ser usado en handleSubmit
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const formErrors = validateForm();

  if (Object.keys(formErrors).length === 0) {
    setOpenConfirmDialog(true);
  } else {
    setErrors(formErrors);
    setOpenSnackbar(true);
    setSnackbarMessage('Por favor, corrija los errores en el formulario');
    setSnackbarSeverity('error');
  }
};

const handleConfirmSubmit = async () => {
  console.log('Estado formData al inicio de handleConfirmSubmit:', formData); // <-- Línea añadida
  try {
    setIsSubmitting(true);

    // Validación final antes del envío
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      throw new Error('Formulario tiene errores de validación');
    }

    // Limpiar datos antes del envío
    const cleanData = {
      ...formData,
      // Usar replaceAll para asegurar que se quiten todos los pipes
      nombreCompleto: formData.nombreCompleto ? formData.nombreCompleto.replaceAll('|', '').trim() : '',
      ingresosMensuales: formData.ingresosMensuales || formData.monthlyIncome ?
        (typeof (formData.ingresosMensuales || formData.monthlyIncome) === 'string'
          ? (formData.ingresosMensuales || formData.monthlyIncome).replace('$', '').replace(/,/g, '')
          : formData.ingresosMensuales || formData.monthlyIncome
        ) : null,
      fechaNacimiento: formData.fechaNacimiento || new Date().toISOString().split('T')[0],
      edad: formData.edad ? parseInt(formData.edad, 10) : null,
      telefono: formData.telefono ? formData.telefono.replace(/\s+/g, '').replace(/^0+/, '') : '',
    };

    // Tipos de documento
    const tiposDocumento = {
      'Cédula de ciudadanía': 'Cédula de ciudadanía',
      'Cédula de extranjería': 'Cédula de ciudadanía',
      'Pasaporte': 'Pasaporte',
      'Permiso especial de permanencia': 'Permiso Especial de Permanencia (PEP)',
      'Sin documento': 'Otro',
      'PPT': 'Otro'
    };

    // Convertir ingresos mensuales a rango numérico
    const convertIngresos = (ingreso) => {
      if (!ingreso) return null;
      // Simple average for ranges, adjust logic if needed
      const ranges = {
        '$0 - $500,000': 250000.0,
        '$500,001 - $1,000,000': 750000.0,
        '$1,000,001 - $1,500,000': 1250000.0,
        '$1,500,001 - $2,000,000': 1750000.0,
        'Más de $2,000,000': 2500000.0 // Or some representative value
      };
      const value = ranges[ingreso];
      // Retornar null si no es un número válido encontrado en ranges
      return typeof value === 'number' ? value : null;
    };

    // Función para extraer el país de lugarOrigen
    const getPaisFromLugar = (lugar) => {
      if (!lugar || typeof lugar !== 'string') return ''; // Devuelve vacío si no hay lugar o no es string
      const parts = lugar.split(',');
      // Toma la última parte y quita espacios extra
      return parts.length > 0 ? parts[parts.length - 1].trim() : lugar.trim();
    };

    // --- Helper para convertir 'Sí'/'No' o 'on'/undefined a booleanos ---
    const toBoolean = (value) => {
      if (typeof value === 'boolean') return value;
      if (value === 'Sí' || value === 'on') return true;
      if (value === 'No' || value === undefined || value === null || value === '') return false;
      return Boolean(value); // Intento genérico para otros casos
    };

    // Construir el objeto final mapeando TODO formData al schema
    const formDataToSend = {
      // --- Metadatos Requeridos ---
      funcionario_id: user?.id || 'ID_POR_DEFECTO',
      funcionario_nombre: user?.nombre || 'NOMBRE_POR_DEFECTO',
      linea_trabajo: formData.lineaTrabajo,
      fecha_registro: new Date().toISOString().split('T')[0],

      // --- Datos Personales (Requeridos y Opcionales) ---
      nombre_completo: formData.nombreCompleto,
      tipo_documento: formData.tipoDocumento, // Siempre se envía, handleChange maneja 'Sin documento'
      numero_documento: formData.numeroDocumento, // Siempre se envía, handleChange maneja ''
      fecha_nacimiento: formData.fechaNacimiento || null,
      pais_origen: getPaisFromLugar(formData.lugarOrigen),
      edad: formData.edad ? parseInt(formData.edad, 10) : null,
      sexo: formData.sexo || null,
      etnia: formData.etnia,
      telefono: formData.telefono || null,

      // --- Datos Migratorios ---
      fecha_llegada: formData.fecha_llegada || null,
      tiempoPermanenciaColombia: formData.tiempoPermanenciaColombia,
      // tipoDocumentoMigratorio se añade condicionalmente más abajo
      situacion_migratoria: formData.situacionMigratoria || null,

      // ... (resto de los campos como estaban definidos antes, hasta el bloque condicional)
      // --- Ubicación ---
      comunaResidencia: formData.comunaResidencia,
      barrio: formData.barrioResidencia,

      // --- Datos Socioculturales ---
      nivelEducativo: formData.nivelEducativo,
      servicioAgua: toBoolean(formData.servicioAgua),
      servicioElectricidad: toBoolean(formData.servicioElectricidad),
      servicioAlcantarillado: toBoolean(formData.servicioAlcantarillado),
      servicioSalud: toBoolean(formData.servicioSalud),
      tipoVivienda: formData.tipoVivienda || null,
      condicionVivienda: formData.condicionVivienda || null,

      // --- Información Familiar ---
      tamanoNucleoFamiliar: formData.tamanoNucleoFamiliar,
      cantidadNinosAdolescentes: formData.cantidadNinosAdolescentes,
      rangoEdadNinosAdolescentes: formData.rangoEdadNinosAdolescentes || null,
      ocupacionNinosAdolescentes: formData.ocupacionNinosAdolescentes || null,
      institucionEducativa: formData.institucionEducativa || '',

      // --- Situación Socioeconómica ---
      ingresos_mensuales: convertIngresos(formData.monthlyIncome),
      workType: formData.workType || null,
      workingStatus: formData.workingStatus || null,

      // --- Salud ---
      healthSystem: formData.healthSystem || null,
      healthSystemName: formData.healthSystemName || null,
      sisbenStatus: formData.sisbenStatus || null,
      needSisbenUpdate: formData.needSisbenUpdate || null,
      disability: formData.hasDisability || null,
      disabilityType: formData.disabilityType || null,
      familyDisability: formData.familyDisability || null,
      disease: formData.hasDiseases || null,
      diseaseDetails: formData.diseaseDetails || null,
      permanentTreatment: formData.permanentTreatment || null,
      treatmentDetails: formData.treatmentDetails || null,

      // --- Nutrición ---
      nutricion_preocupacion_por_alimentos: toBoolean(formData.nutricion.preocupacionPorAlimentos),
      // Se eliminó nutricion_no_comio_saludable_por_recursos
      // Se eliminó nutricion_comio_poco_por_recursos
      // Se eliminó nutricion_se_quedo_sin_alimentos_por_recursos
      nutricion_solo_comio_algunas_veces_por_recursos: toBoolean(formData.nutricion.soloComioAlgunasVecesPorRecursos),
      nutricion_dejo_de_comer_por_recursos: toBoolean(formData.nutricion.dejoDeComerPorRecursos),
      nutricion_tuvo_hambre_no_comio_por_recursos: toBoolean(formData.nutricion.tuvoHambreNoComioPorRecursos),
      nutricion_perdio_peso_por_recursos: toBoolean(formData.nutricion.perdioPesoPorRecursos),

      // --- Conflicto y Violencia ---
      victima_conflicto: toBoolean(formData.victimOfArmedConflict),
      conflictVictimType: formData.conflictVictimType || null,
      victimOfViolence: formData.victimOfViolence || null,

      // --- Otros --- 
      supportRoute: formData.supportRoute || null
    };

    // Añadir tipoDocumentoMigratorio condicionalmente
    if (formData.tieneDocumentoMigratorio === 'Sí') {
      formDataToSend.tipoDocumentoMigratorio = formData.tipoDocumentoMigratorio;
    }
    // No hay 'else' para tipoDocumentoMigratorio; si no es 'Sí', simplemente no se envía.


    console.log('Datos a enviar (formDataToSend) ANTES de convertir nulls:', JSON.stringify(formDataToSend, null, 2));

    // --- Convertir null a "" para campos específicos ANTES de enviar a la API ---
    let finalPayload = { ...formDataToSend };

    // Limpieza de campos dependientes antes de cualquier otra transformación
    if (finalPayload.healthSystem === 'No') {
      finalPayload.healthSystemName = null;
    }
    if (finalPayload.disability === 'No') {
      finalPayload.disabilityType = null;
    }
    if (finalPayload.disease === 'No') {
      finalPayload.diseaseDetails = null;
    }
    if (finalPayload.permanentTreatment === 'No') {
      finalPayload.treatmentDetails = null;
    }
    // victima_conflicto es booleano (false si victimOfViolence es 'No')
    if (finalPayload.victima_conflicto === false) {
      finalPayload.conflictVictimType = null;
    }
    if (finalPayload.workingStatus === 'No') {
      finalPayload.workType = null;
    }
    if (finalPayload.ocupacionNinosAdolescentes === 'ninguna') {
      finalPayload.institucionEducativa = null;
    }
    if (finalPayload.sisbenStatus === 'No') {
      finalPayload.needSisbenUpdate = null;
    }

    // Convertir ciertos campos null a string vacío si es necesario.
    // Se deja vacío para asegurar que los campos limpiados a 'null' se envíen como 'null'.
    const fieldsToConvertToEmptyString = [];

    fieldsToConvertToEmptyString.forEach(field => {
      if (finalPayload.hasOwnProperty(field) && finalPayload[field] === null) {
        finalPayload[field] = "";
      }
    });
    // Asegurar que la edad sea número o null, no string vacío si el backend espera número
    if (finalPayload.edad === "") {
      finalPayload.edad = null; // OJO: Si el backend espera número y no string vacío para edad
    }

    // Lógica específica para campos problemáticos con 'null':
    // Ya no se eliminan campos como ingresos_mensuales si son null, se envían como null.
    const fieldsToDeleteIfNull = []; // Mantener vacío para enviar nulls explícitamente
    fieldsToDeleteIfNull.forEach(field => {
      if (finalPayload.hasOwnProperty(field) && finalPayload[field] === null) {
        delete finalPayload[field];
      }
    });

    console.log('Datos a enviar (finalPayload) DESPUÉS de limpieza y conversiones:', JSON.stringify(finalPayload, null, 2));

    // --- Determinar si es una actualización o creación ---
    const esActualizacion = state?.modoEdicion && state?.migrante?._id;

    // --- Enviar datos del formulario --- 
    const response = esActualizacion
      ? await actualizarPoblacionMigrante(state.migrante._id, finalPayload)
      : await crearPoblacionMigrante(finalPayload);

    // --- Normalizar la respuesta --- 
    const responseData = esActualizacion ? response : response.data;

    // --- Logs detallados de la respuesta de la API (AHORA CORRECTAMENTE UBICADOS) --- 
    console.log('Respuesta de la API (variable \'response\'):', JSON.stringify(response, null, 2));
    console.log('Datos normalizados (responseData) para procesar:', JSON.stringify(responseData, null, 2));

    console.log('INSPECCIÓN DIRECTA ANTES DEL IF:');
    console.log('typeof responseData:', typeof responseData);
    if (responseData) {
      console.log('responseData existe.');
      console.log('Tiene la propiedad "success"?', responseData.hasOwnProperty('success'));
      console.log('Valor de responseData.success:', responseData.success);
      console.log('Tipo de responseData.success:', typeof responseData.success);
      console.log('responseData.success === true ?', responseData.success === true);
    } else {
      console.log('responseData NO existe (es null o undefined).');
    }

    // Manejar respuesta exitosa
    if (responseData && responseData.msg) { // Se considera éxito si hay un mensaje en la respuesta y no hubo error HTTP
      setOpenConfirmDialog(false);
      setOpenSnackbar(true);
      setSnackbarMessage(
        responseData.msg || (esActualizacion ? 'Migrante actualizado exitosamente.' : 'Formulario enviado exitosamente.') // Usar responseData.msg
      );
      setSnackbarSeverity('success');

      // Resetear formulario si es creación, o redirigir y mostrar mensaje si es actualización
      if (!esActualizacion) {
        setFormData(initialFormState);
        setErrors({});
        // Opcional: si quieres navegar al listado después de un NUEVO registro, puedes hacerlo aquí.
        // navigate('/funcionario/poblacion-migrante'); 
      } else {
        // En caso de actualización, mostrar Snackbar y luego redirigir CON RETRASO.
        // El Snackbar ya está configurado para mostrarse.
        setTimeout(() => {
          navigate('/funcionario/poblacion-migrante');
        }, 2000); // Retraso de 2 segundos
      }
    } else {
      // Esto se ejecuta si responseData.success no es true, o si responseData no existe/estructura inesperada
      let messageFromServer = 'Error desconocido al procesar la respuesta del servidor.';
      if (responseData && responseData.msg) {
        messageFromServer = responseData.msg; // Usar el mensaje del backend si está disponible
      } else if (responseData && typeof responseData === 'string') {
        messageFromServer = responseData; // Si el backend envía un error como string simple
      } else if (response && response.statusText && !responseData) { // Chequear response original para errores HTTP
        messageFromServer = `Error del servidor: ${response.status || ''} ${response.statusText}`;
      }

      console.error('Respuesta no exitosa o malformada (responseData en handleConfirmSubmit):', JSON.stringify(responseData, null, 2));
      console.error('Respuesta original de la API en caso de error (response):', JSON.stringify(response, null, 2));
      throw new Error(messageFromServer);
    }
  } catch (error) {

    // Manejar diferentes tipos de errores
    let errorMessage = 'Error al enviar el formulario';

    if (error.response) {
      // El servidor respondió con un error

      // Priorizar errores de validación
      if (error.response.data.errors) {
        const errorDetails = error.response.data.errors;
        errorMessage = Object.entries(errorDetails)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      } else if (error.response.data.msg) {
        errorMessage = error.response.data.msg;
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      errorMessage = 'No se recibió respuesta del servidor';
    } else if (error.message) {
      // Error en la configuración de la solicitud
      errorMessage = error.message;
    }

    console.log('Error detallado:', errorMessage);

    setErrorMessage(errorMessage);
    setShowErrorModal(true);
  } finally {
    setIsSubmitting(false);
  }
};

const handleCloseSnackbar = (event, reason) => {
  if (reason === 'clickaway') {
    return;
  }
  setOpenSnackbar(false);
};

return (
  <PageLayout title={pageTitle} description={pageDescription}>
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        {/* <Typography variant="h4" gutterBottom>
            {pageTitle}
          </Typography> */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Sección: Información del Funcionario */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nombre del Funcionario"
                name="funcionarioNombre"
                value={formData.funcionarioNombre}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Línea de Trabajo"
                name="lineaTrabajo"
                value={nombreLineaTrabajo}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha de Registro"
                name="fechaRegistro"
                value={formData.fechaRegistro}
                InputProps={{ readOnly: true }}
              />
            </Grid>


            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Datos Personales
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombres y Apellidos Completos"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                error={!!errors.nombreCompleto}
                helperText={errors.nombreCompleto}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Edad"
                name="edad"
                type="number"
                value={formData.edad}
                onChange={handleChange}
                error={!!errors.edad}
                helperText={errors.edad}
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>
            {/* Sexo */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth error={!!errors.sexo} required>
                <InputLabel id="sexo-label">Sexo *</InputLabel>
                <Select
                  labelId="sexo-label"
                  id="sexo"
                  name="sexo"
                  value={formData.sexo || ''} // Usar || '' para Select controlado
                  label="Sexo *"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Seleccione...</em></MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
                {errors.sexo && <FormHelperText>{errors.sexo}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                error={!!errors.fechaNacimiento}
                helperText={errors.fechaNacimiento}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="correoElectronico"
                type="email"
                value={formData.correoElectronico}
                onChange={handleChange}
                error={!!errors.correoElectronico}
                helperText={errors.correoElectronico}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Número de Teléfono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                error={!!errors.telefono}
                helperText={errors.telefono}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lugar de Origen"
                name="lugarOrigen"
                value={formData.lugarOrigen}
                onChange={handleChange}
                error={!!errors.lugarOrigen}
                helperText={errors.lugarOrigen}
                placeholder="Ciudad, País"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Barrio de Residencia"
                name="barrioResidencia"
                value={formData.barrioResidencia}
                onChange={handleChange}
                error={!!errors.barrioResidencia}
                helperText={errors.barrioResidencia}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Comuna</InputLabel>
                <Select
                  name="comunaResidencia"
                  value={formData.comunaResidencia || ''}
                  label="Comuna"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione una comuna</MenuItem>
                  {comunas.map((comuna) => (
                    <MenuItem key={comuna.id} value={comuna.nombre}>
                      {comuna.nombre} - {comuna.zona}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Información sobre el Núcleo Familiar */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Información sobre el Núcleo Familiar
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>¿Cuántas personas conforman su núcleo familiar?</InputLabel>
                <Select
                  name="tamanoNucleoFamiliar"
                  value={formData.tamanoNucleoFamiliar || ''}
                  onChange={handleChange}
                  label="¿Cuántas personas conforman su núcleo familiar?"
                >
                  <MenuItem value="1-3">1 a 3</MenuItem>
                  <MenuItem value="4-6">4 a 6</MenuItem>
                  <MenuItem value="7-10">7 a 10</MenuItem>
                  <MenuItem value="10+">Más de 10</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>¿Cuántos niños, niñas y/o adolescentes conforman su núcleo familiar?</InputLabel>
                <Select
                  name="cantidadNinosAdolescentes"
                  value={formData.cantidadNinosAdolescentes || ''}
                  onChange={handleChange}
                  label="¿Cuántos niños, niñas y/o adolescentes conforman su núcleo familiar?"
                >
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="4+">4 o más</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rango de edades de los niños, niñas y/o adolescentes</InputLabel>
                <Select
                  name="rangoEdadNinosAdolescentes"
                  value={formData.rangoEdadNinosAdolescentes || ''}
                  onChange={handleChange}
                  label="Rango de edades de los niños, niñas y/o adolescentes"
                >
                  <MenuItem value="0-5">0 a 5 años</MenuItem>
                  <MenuItem value="6-10">6 a 10 años</MenuItem>
                  <MenuItem value="11-15">11 a 15 años</MenuItem>
                  <MenuItem value="16-17">16 a 17 años</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ocupación de los niños, niñas y/o adolescentes</InputLabel>
                <Select
                  name="ocupacionNinosAdolescentes"
                  value={formData.ocupacionNinosAdolescentes || ''}
                  onChange={handleChange}
                  label="Ocupación de los niños, niñas y/o adolescentes"
                >
                  <MenuItem value="estudiantes">Estudiantes</MenuItem>
                  <MenuItem value="programas_icbf">Programas del ICBF</MenuItem>
                  <MenuItem value="ninguna">Ninguna de las anteriores</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.ocupacionNinosAdolescentes === 'estudiantes' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de la institución educativa"
                  name="institucionEducativa"
                  value={formData.institucionEducativa || ''}
                  onChange={handleChange}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Situación Migratoria
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>¿Cuánto tiempo lleva viviendo en Colombia?</InputLabel>
                <Select
                  name="tiempoPermanenciaColombia"
                  value={formData.tiempoPermanenciaColombia || ''}
                  onChange={handleChange}
                  label="¿Cuánto tiempo lleva viviendo en Colombia?"
                >
                  <MenuItem value="0-6">0-6 meses</MenuItem>
                  <MenuItem value="7-12">7-12 meses</MenuItem>
                  <MenuItem value="1-2">1-2 años</MenuItem>
                  <MenuItem value="2+">Más de 2 años</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha de Llegada a Colombia"
                name="fecha_llegada"
                type="date"
                value={formData.fecha_llegada || ''}
                onChange={handleChange}
                error={!!errors.fecha_llegada}
                helperText={errors.fecha_llegada}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Situación Migratoria"
                name="situacionMigratoria"
                value={formData.situacionMigratoria}
                onChange={handleChange}
                error={!!errors.situacionMigratoria}
                helperText={errors.situacionMigratoria}
                required
              >
                {SITUACIONES_MIGRATORIAS.map((situacion) => (
                  <MenuItem key={situacion} value={situacion}>
                    {situacion}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <FormLabel>¿Cuenta con documento migratorio en Colombia?</FormLabel>
                <RadioGroup
                  row
                  name="tienePPT"
                  value={formData.tienePPT}
                  onChange={(e) => {
                    const value = e.target.value === 'true';
                    handleChange({
                      target: {
                        name: 'tienePPT',
                        value: value
                      }
                    });
                    console.log('tienePPT changed:', value);
                  }}
                >
                  <FormControlLabel value={true} control={<Radio />} label="Sí" />
                  <FormControlLabel value={false} control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
            {renderDocumentoMigratorio()}

            {/* Datos Socioculturales */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Datos Socioculturales
              </Typography>
            </Grid>

            {/* Etnia o Grupo Étnico */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Etnia o Grupo Étnico</InputLabel>
                <Select
                  name="etnia"
                  value={formData.etnia || ''}
                  onChange={handleChange}
                  label="Etnia o Grupo Étnico"
                >
                  <MenuItem value="Ninguna">Ninguna</MenuItem>
                  <MenuItem value="Afrodescendiente">Afrodescendiente</MenuItem>
                  <MenuItem value="Mestizo">Mestizo</MenuItem>
                  <MenuItem value="Indigena">Indígena</MenuItem>
                  <MenuItem value="Raizal">Raizal</MenuItem>
                  <MenuItem value="Palenquero">Palenquero</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Nivel Educativo */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Nivel Educativo</InputLabel>
                <Select
                  name="nivelEducativo"
                  value={formData.nivelEducativo || ''}
                  onChange={handleChange}
                  label="Nivel Educativo"
                >
                  <MenuItem value="Primaria_Incompleta">Primaria Incompleta</MenuItem>
                  <MenuItem value="Primaria_Completa">Primaria Completa</MenuItem>
                  <MenuItem value="Secundaria_Incompleta">Secundaria Incompleta</MenuItem>
                  <MenuItem value="Secundaria_Completa">Secundaria Completa</MenuItem>
                  <MenuItem value="Tecnico">Técnico</MenuItem>
                  <MenuItem value="Tecnologico">Tecnológico</MenuItem>
                  <MenuItem value="Universitario_Incompleto">Universitario Incompleto</MenuItem>
                  <MenuItem value="Universitario_Completo">Universitario Completo</MenuItem>
                  <MenuItem value="Postgrado">Postgrado</MenuItem>
                  <MenuItem value="Ninguno">Ninguno</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Acceso a Servicios Básicos */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Acceso a Servicios Básicos</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.servicioAgua === true || String(formData.servicioAgua).toLowerCase() === 'true' || Number(formData.servicioAgua) === 1}
                        onChange={handleChange}
                        name="servicioAgua"
                      />
                    }
                    label="Agua Potable"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.servicioElectricidad === true || String(formData.servicioElectricidad).toLowerCase() === 'true' || Number(formData.servicioElectricidad) === 1}
                        onChange={handleChange}
                        name="servicioElectricidad"
                      />
                    }
                    label="Electricidad"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.servicioAlcantarillado === true || String(formData.servicioAlcantarillado).toLowerCase() === 'true' || Number(formData.servicioAlcantarillado) === 1}
                        onChange={handleChange}
                        name="servicioAlcantarillado"
                      />
                    }
                    label="Alcantarillado"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.servicioSalud === true || String(formData.servicioSalud).toLowerCase() === 'true' || Number(formData.servicioSalud) === 1}
                        onChange={handleChange}
                        name="servicioSalud"
                      />
                    }
                    label="Acceso a Salud"
                  />
                </FormGroup>
              </FormControl>
            </Grid>

            {/* Condiciones de Vivienda */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Vivienda</InputLabel>
                <Select
                  name="tipoVivienda"
                  value={formData.tipoVivienda || ''}
                  onChange={handleChange}
                  label="Tipo de Vivienda"
                >
                  <MenuItem value="Propia">Propia</MenuItem>
                  <MenuItem value="Alquilada">Alquilada</MenuItem>
                  <MenuItem value="Prestada">Prestada</MenuItem>
                  <MenuItem value="Albergue">Albergue</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Condiciones de la Vivienda</InputLabel>
                <Select
                  name="condicionVivienda"
                  value={formData.condicionVivienda || ''}
                  onChange={handleChange}
                  label="Condiciones de la Vivienda"
                >
                  <MenuItem value="Buenas">Buenas</MenuItem>
                  <MenuItem value="Regulares">Regulares</MenuItem>
                  <MenuItem value="Precarias">Precarias</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sección: Condiciones Socioeconómicas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Condiciones Socioeconómicas
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="workingStatus-label">¿Desempeña actividad laboral?</InputLabel>
                <Select
                  labelId="workingStatus-label"
                  name="workingStatus"
                  value={formData.workingStatus || ''}
                  label="¿Desempeña actividad laboral?"
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="workType-label">Tipo de labor</InputLabel>
                <Select
                  labelId="workType-label"
                  name="workType"
                  value={formData.workType || ''}
                  label="Tipo de labor"
                  onChange={handleChange}
                  disabled={formData.workingStatus === 'No'}
                  fullWidth
                >
                  <MenuItem value="Independiente">Independiente</MenuItem>
                  <MenuItem value="Empleado">Empleado</MenuItem>
                  <MenuItem value="Rapimoto/mototaxi">Rapimoto/mototaxi</MenuItem>
                  <MenuItem value="Taxista">Taxista</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="monthlyIncome-label">Ingresos mensuales aproximados</InputLabel>
                <Select
                  labelId="monthlyIncome-label"
                  name="monthlyIncome" // Cambiado de ingresos_mensuales
                  value={(() => {
                    const incomeString = formData.monthlyIncome; // Leer de monthlyIncome
                    // La lógica para mostrar el valor numérico como string ya está aquí, se adapta si formData.monthlyIncome contiene un número (al cargar para editar)
                    // o la cadena de texto (al seleccionar del dropdown)
                    if (typeof incomeString === 'number') { // Si es número (viene de la carga para editar)
                      if (incomeString < 500000) return 'Menos de $500,000';
                      if (incomeString >= 500001 && incomeString <= 1000000) return '$500,001 - $1,000,000';
                      if (incomeString >= 1000001 && incomeString <= 1500000) return '$1,000,001 - $1,500,000';
                      if (incomeString > 1500000) return 'Más de $1,500,000';
                    }
                    return incomeString || ''; // Si es string (seleccionado del dropdown) o vacío
                  })()}
                  label="Ingresos mensuales aproximados"
                  onChange={handleChange}
                  disabled={formData.workingStatus === 'No'}
                  fullWidth
                >
                  <MenuItem value="Menos de $500,000">Menos de $500,000</MenuItem>
                  <MenuItem value="$500,001 - $1,000,000">Entre $500,001 y $1,000,000</MenuItem>
                  <MenuItem value="$1,000,001 - $1,500,000">Entre $1,000,001 y $1,500,000</MenuItem>
                  <MenuItem value="Más de $1,500,000">Más de $1,500,000</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Checkboxes para procesoAcompanamientoMunicipal */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth margin="normal">
                <FormLabel component="legend">
                  De acuerdo con lo anterior señale el proceso a acompañar por parte del municipio que le permitiría mejorar sus posibilidades de vinculación laboral si cuenta con un proceso de regularización y/o de generación de ingresos propios:
                </FormLabel>
                <FormGroup row>
                  {[
                    'Certificación de competencias laborales',
                    'Formación complementaria (cursos cortos para empleo o emprendimiento)',
                    'Formación técnica',
                    'Registro de Hoja de Vida en la plataforma del Servicio Público de Empleo',
                    'Validación de bachillerato',
                    'Ninguno',
                  ].map((opcion) => (
                    <FormControlLabel
                      key={opcion}
                      control={
                        <Checkbox
                          checked={formData.procesoAcompanamientoMunicipal.includes(opcion)}
                          onChange={handleChange}
                          name="procesoAcompanamientoMunicipal"
                          value={opcion}
                        />
                      }
                      label={opcion}
                    />
                  ))}
                </FormGroup>
                {errors.procesoAcompanamientoMunicipal && <FormHelperText error>{errors.procesoAcompanamientoMunicipal}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Sección: Salud y Seguridad Social */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Salud y Seguridad Social
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="healthSystem-label">¿Cuenta con afiliación a EPS?</InputLabel>
                <Select
                  labelId="healthSystem-label"
                  name="healthSystem"
                  value={formData.healthSystem || ''}
                  label="¿Cuenta con afiliación a EPS?"
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de EPS"
                name="healthSystemName"
                value={formData.healthSystemName}
                onChange={handleChange}
                disabled={formData.healthSystem === 'No'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="sisbenStatus-label">¿Cuenta con SISBÉN?</InputLabel>
                <Select
                  labelId="sisbenStatus-label"
                  name="sisbenStatus"
                  value={formData.sisbenStatus || ''}
                  label="¿Cuenta con SISBÉN?"
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="needSisbenUpdate-label">¿Necesita actualizar encuesta del SISBÉN?</InputLabel>
                <Select
                  labelId="needSisbenUpdate-label"
                  name="needSisbenUpdate"
                  value={formData.needSisbenUpdate || ''}
                  label="¿Necesita actualizar encuesta del SISBÉN?"
                  onChange={handleChange}
                  disabled={formData.sisbenStatus === 'No'}
                  fullWidth
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Nuevos campos de Salud */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="tieneAntecedentesFamiliaresEnfermedades-label">¿Tiene antecedentes familiares de enfermedades?</InputLabel>
                <Select
                  labelId="tieneAntecedentesFamiliaresEnfermedades-label"
                  name="tieneAntecedentesFamiliaresEnfermedades"
                  value={formData.tieneAntecedentesFamiliaresEnfermedades || ''}
                  onChange={handleChange}
                  label="¿Tiene antecedentes familiares de enfermedades?"
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.tieneAntecedentesFamiliaresEnfermedades === 'Sí' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="¿Cuáles antecedentes familiares?"
                  name="antecedentesFamiliaresEnfermedadesCuales"
                  value={formData.antecedentesFamiliaresEnfermedadesCuales.join(', ')}
                  onChange={(e) => {
                    const newValues = e.target.value.split(',').map(item => item.trim());
                    // Filtrar cadenas vacías si el campo está vacío después de dividir
                    const filteredValues = newValues.length === 1 && newValues[0] === '' ? [] : newValues;
                    handleChange({ target: { name: "antecedentesFamiliaresEnfermedadesCuales", value: filteredValues } });
                  }}
                  helperText="Separar con comas si son varios"
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="presentaCondicionEspecificaSalud-label">¿Presenta alguna condición específica de salud?</InputLabel>
                <Select
                  labelId="presentaCondicionEspecificaSalud-label"
                  name="presentaCondicionEspecificaSalud"
                  value={formData.presentaCondicionEspecificaSalud || ''}
                  onChange={handleChange}
                  label="¿Presenta alguna condición específica de salud?"
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.presentaCondicionEspecificaSalud === 'Sí' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="¿Cuáles condiciones específicas de salud?"
                  name="condicionEspecificaSaludCuales"
                  value={formData.condicionEspecificaSaludCuales.join(', ')}
                  onChange={(e) => {
                    const newValues = e.target.value.split(',').map(item => item.trim());
                    const filteredValues = newValues.length === 1 && newValues[0] === '' ? [] : newValues;
                    handleChange({ target: { name: "condicionEspecificaSaludCuales", value: filteredValues } });
                  }}
                  helperText="Separar con comas si son varias"
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth margin="normal">
                <FormLabel component="legend">¿Usted o alguien de su núcleo familiar cercano presenta funcionalidades diferentes?</FormLabel>
                <RadioGroup
                  row
                  name="diversidadFuncional"
                  value={formData.diversidadFuncional || ''}
                  onChange={handleChange}
                >
                  <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                </RadioGroup>
                {errors.diversidadFuncional && <FormHelperText error>{errors.diversidadFuncional}</FormHelperText>}
              </FormControl>
            </Grid>

            {formData.diversidadFuncional === 'Sí' && (
              <Grid item xs={12}> {/* Ocupa todo el ancho para mejor visualización de checkboxes */}
                <FormControl component="fieldset" fullWidth margin="normal">
                  <FormLabel component="legend">Indique el tipo de diversidad funcional o afectaciones a la salud que Ud. o alguien de su núcleo familiar cercano presente:</FormLabel>
                  <FormGroup row>
                    {[
                      'Física o Motriz (dificultad para realizar movimientos, desplazamientos, habla o manipular objetos)',
                      'Sensorial o multi sensorial (déficit visual, auditivo o ambas)',
                      'Intelectual y psíquica (dificultades cognitivas, en el aprendizaje, la comunicación o las interacciones sociales)',
                      'Problemas de salud',
                    ].map((opcion) => (
                      <FormControlLabel
                        key={opcion}
                        control={
                          <Checkbox
                            checked={formData.tipoDiversidadFuncionalAfectaciones.includes(opcion)}
                            onChange={handleChange}
                            name="tipoDiversidadFuncionalAfectaciones"
                            value={opcion}
                          />
                        }
                        label={opcion}
                      />
                    ))}
                  </FormGroup>
                  {errors.tipoDiversidadFuncionalAfectaciones && <FormHelperText error>{errors.tipoDiversidadFuncionalAfectaciones}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de personas con discapacidad en el hogar"
                name="numeroPersonasConDiscapacidadHogar"
                type="number"
                value={formData.numeroPersonasConDiscapacidadHogar || ''}
                onChange={handleChange}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            
            {/* Sección de Condiciones de Salud */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
                Condiciones de Salud
              </Typography>
            </Grid>

            {/* Condición de Salud Específica */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>¿Presenta alguna condición específica de salud?</InputLabel>
                <Select
                  name="presentaCondicionEspecificaSalud"
                  value={formData.presentaCondicionEspecificaSalud || ''}
                  label="¿Presenta alguna condición específica de salud?"
                  onChange={handleChange}
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.presentaCondicionEspecificaSalud === 'Sí' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel>Detalles de la condición de salud</FormLabel>
                  <FormGroup>
                    {[
                      'Hipertensión', 'Diabetes', 'Enfermedades cardíacas', 
                      'Problemas renales', 'Sobrepeso/Obesidad', 'Otra'
                    ].map(condicion => (
                      <FormControlLabel
                        key={condicion}
                        control={
                          <Checkbox
                            checked={formData.condicionEspecificaSaludCuales?.includes(condicion)}
                            onChange={handleChange}
                            name="condicionEspecificaSaludCuales"
                            value={condicion}
                          />
                        }
                        label={condicion}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Grid>
            )}

            {/* Tratamiento Médico */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>¿Está actualmente en tratamiento médico?</InputLabel>
                <Select
                  name="estaEnTratamientoMedico"
                  value={formData.estaEnTratamientoMedico || ''}
                  label="¿Está actualmente en tratamiento médico?"
                  onChange={handleChange}
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.estaEnTratamientoMedico === 'Sí' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Detalles del tratamiento médico"
                  name="treatmentDetails"
                  value={formData.treatmentDetails || ''}
                  onChange={handleChange}
                />
              </Grid>
            )}

            {/* Antecedentes Familiares */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>¿Tiene antecedentes familiares de enfermedades?</InputLabel>
                <Select
                  name="tieneAntecedentesFamiliaresEnfermedades"
                  value={formData.tieneAntecedentesFamiliaresEnfermedades || ''}
                  label="¿Tiene antecedentes familiares de enfermedades?"
                  onChange={handleChange}
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tieneAntecedentesFamiliaresEnfermedades === 'Sí' && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel>Tipos de enfermedades en antecedentes familiares</FormLabel>
                    <FormGroup>
                      {[
                        'Hipertensión', 'Diabetes', 'Enfermedades cardíacas', 
                        'Problemas renales', 'Cáncer', 'Otra'
                      ].map((enfermedad, index) => (
                        <FormControlLabel
                          key={`enfermedad-${index}`}
                          control={
                            <Checkbox
                              checked={formData.antecedentesFamiliaresEnfermedadesCuales?.includes(enfermedad) || false}
                              onChange={(e) => {
                                const { value, checked } = e.target;
                                setFormData(prevData => ({
                                  ...prevData,
                                  antecedentesFamiliaresEnfermedadesCuales: checked
                                    ? [...(prevData.antecedentesFamiliaresEnfermedadesCuales || []), value]
                                    : (prevData.antecedentesFamiliaresEnfermedadesCuales || []).filter(item => item !== value)
                                }));
                              }}
                              name="antecedentesFamiliaresEnfermedadesCuales"
                              value={enfermedad}
                            />
                          }
                          label={enfermedad}
                        />
                      ))}
                    </FormGroup>
                    {formData.antecedentesFamiliaresEnfermedadesCuales?.includes('Otra') && (
                      <TextField
                        label="Otra enfermedad, ¿cuál?"
                        name="antecedentesFamiliaresEnfermedadesCualesOtra"
                        value={formData.antecedentesFamiliaresEnfermedadesCualesOtra || ''}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                      />
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                    <FormLabel component="legend">4. En los últimos 3 meses por falta de dinero u otros recursos alguna vez ¿Usted se preocupó de que los alimentos se acabarán en el hogar?</FormLabel>
                    <RadioGroup row name="nutricion.tuvoHambreNoComioPorRecursos" value={formData.nutricion.tuvoHambreNoComioPorRecursos || ''} onChange={handleChange}>
                      <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                      <FormControlLabel value="No" control={<Radio />} label="No" />
                    </RadioGroup>
                    {errors['nutricion.tuvoHambreNoComioPorRecursos'] && <FormHelperText error>{errors['nutricion.tuvoHambreNoComioPorRecursos']}</FormHelperText>}
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">5. En los últimos 30 días, ¿usted o algún miembro de su hogar pasaron un día y una noche enteros sin comer porque no había suficiente dinero u otros recursos para obtener alimentos?</FormLabel>
                <RadioGroup row name="nutricion.perdioPesoPorRecursos" value={formData.nutricion.perdioPesoPorRecursos || ''} onChange={handleChange}>
                  <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                </RadioGroup>
                {errors['nutricion.perdioPesoPorRecursos'] && <FormHelperText error>{errors['nutricion.perdioPesoPorRecursos']}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones adicionales sobre la situación alimentaria"
                name="nutricion.observaciones"
                value={formData.nutricion?.observaciones || ''}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>

          {/* Sección: Condiciones de Vulnerabilidad */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Condiciones de Vulnerabilidad
            </Typography>
          </Grid>

            {/* Violencia Basada en Género (VBG) */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">1. ¿Ha sido víctima de violencia basada en género durante el último año?</FormLabel>
                <RadioGroup
                  row
                  name="condicionesVulnerabilidad.victimaVBGUltimoAno"
                  value={formData.condicionesVulnerabilidad?.victimaVBGUltimoAno || ''}
                  onChange={handleChange}
                >
                  <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                </RadioGroup>
                {errors['condicionesVulnerabilidad.victimaVBGUltimoAno'] && <FormHelperText error>{errors['condicionesVulnerabilidad.victimaVBGUltimoAno']}</FormHelperText>}
              </FormControl>
            </Grid>

            {formData.condicionesVulnerabilidad?.victimaVBGUltimoAno === 'Sí' && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                    <FormLabel component="legend">1a. ¿Requiere acompañamiento para tramitar esta situación?</FormLabel>
                    <RadioGroup
                      row
                      name="condicionesVulnerabilidad.requiereAcompanamientoVBG"
                      value={formData.condicionesVulnerabilidad?.requiereAcompanamientoVBG || ''}
                      onChange={handleChange}
                    >
                      <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                      <FormControlLabel value="No" control={<Radio />} label="No" />
                    </RadioGroup>
                    {errors['condicionesVulnerabilidad.requiereAcompanamientoVBG'] && <FormHelperText error>{errors['condicionesVulnerabilidad.requiereAcompanamientoVBG']}</FormHelperText>}
                  </FormControl>
                </Grid>

                {formData.condicionesVulnerabilidad?.requiereAcompanamientoVBG === 'Sí' && (
                  <Grid item xs={12}>
                    <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                      <FormLabel component="legend">1b. Como víctima de VBG necesita acompañamiento en temas de:</FormLabel>
                      <FormGroup row>
                        <FormControlLabel
                          control={<Checkbox checked={formData.condicionesVulnerabilidad?.acompanamientoTemasVBG?.includes('Justicia') || false} onChange={handleChange} name="condicionesVulnerabilidad.acompanamientoTemasVBG" value="Justicia" />}
                          label="Justicia"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={formData.condicionesVulnerabilidad?.acompanamientoTemasVBG?.includes('Salud Física') || false} onChange={handleChange} name="condicionesVulnerabilidad.acompanamientoTemasVBG" value="Salud Física" />}
                          label="Salud Física"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={formData.condicionesVulnerabilidad?.acompanamientoTemasVBG?.includes('Salud Mental') || false} onChange={handleChange} name="condicionesVulnerabilidad.acompanamientoTemasVBG" value="Salud Mental" />}
                          label="Salud Mental"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={formData.condicionesVulnerabilidad?.acompanamientoTemasVBG?.includes('Otro') || false} onChange={handleChange} name="condicionesVulnerabilidad.acompanamientoTemasVBG" value="Otro" />}
                          label="Otro"
                        />
                      </FormGroup>
                      {errors['condicionesVulnerabilidad.acompanamientoTemasVBG'] && <FormHelperText error>{errors['condicionesVulnerabilidad.acompanamientoTemasVBG']}</FormHelperText>}
                    </FormControl>
                    {formData.condicionesVulnerabilidad?.acompanamientoTemasVBG?.includes('Otro') && (
                      <TextField
                        label="Otro, ¿cuál?"
                        name="condicionesVulnerabilidad.acompanamientoTemasVBGOtro"
                        value={formData.condicionesVulnerabilidad?.acompanamientoTemasVBGOtro || ''}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        error={!!errors['condicionesVulnerabilidad.acompanamientoTemasVBGOtro']}
                        helperText={errors['condicionesVulnerabilidad.acompanamientoTemasVBGOtro']}
                      />
                    )}
                  </Grid>
                )}
              </>
            )}

            {/* Reconocimiento como Víctima (RUV) */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">2. ¿La familia o alguno de sus integrantes ha sido reconocida como víctima por el Registro Único de Víctimas?</FormLabel>
                <RadioGroup
                  row
                  name="condicionesVulnerabilidad.familiarReconocidoRUV"
                  value={formData.condicionesVulnerabilidad?.familiarReconocidoRUV || ''}
                  onChange={handleChange}
                >
                  <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                </RadioGroup>
                {errors['condicionesVulnerabilidad.familiarReconocidoRUV'] && <FormHelperText error>{errors['condicionesVulnerabilidad.familiarReconocidoRUV']}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Dificultades de Acceso a Servicios */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">3. De los siguientes servicios, seleccione aquellos en los que ha tenido dificultades para el acceso:</FormLabel>
                <FormGroup row>
                  {[ 'Educación', 'Empleo', 'Identificación', 'Salud – SGSSS', 'Protección Internacional',
                    'Trámites migratorios (Refugio/Regularización)', 'Trámites ante Consulado venezolano', 'Vivienda', 'Otro'].map((servicio) => (
                    <FormControlLabel
                      key={servicio}
                      control={<Checkbox checked={formData.condicionesVulnerabilidad?.dificultadesAccesoServicios?.includes(servicio) || false} onChange={handleChange} name="condicionesVulnerabilidad.dificultadesAccesoServicios" value={servicio} />}
                      label={servicio}
                    />
                  ))}
                </FormGroup>
                {errors['condicionesVulnerabilidad.dificultadesAccesoServicios'] && <FormHelperText error>{errors['condicionesVulnerabilidad.dificultadesAccesoServicios']}</FormHelperText>}
              </FormControl>
              {formData.condicionesVulnerabilidad?.dificultadesAccesoServicios?.includes('Otro') && (
                <TextField
                  label="Otro, ¿cuál?"
                  name="condicionesVulnerabilidad.dificultadesAccesoServiciosOtro"
                  value={formData.condicionesVulnerabilidad?.dificultadesAccesoServiciosOtro || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errors['condicionesVulnerabilidad.dificultadesAccesoServiciosOtro']}
                  helperText={errors['condicionesVulnerabilidad.dificultadesAccesoServiciosOtro']}
                />
              )}
            </Grid>

            {/* Necesidades de Acompañamiento NNA */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">4. ¿Qué necesidades identifica que requieren acompañamiento para el acceso a derechos de los(as) NNA refugiados y migrantes de su núcleo familiar cercano?</FormLabel>
                <FormGroup row>
                  {[ 'Acceso a educación', 'Acceso a rutas de atención y protección (violencia sexual, maltrato infantil, VBG, entre otros)',
                    'Acceso a servicios de salud física y mental', 'Acceso oferta complementaria (deporte, recreación, cultura)',
                    'Afiliación a Sistema General de Seguridad Social en Salud',
                    'Remisión al Ministerio Público por inobservancia de derechos',
                    'Trámites con documentos de identidad', 'No aplica'].map((necesidad) => (
                    <FormControlLabel
                      key={necesidad}
                      control={<Checkbox checked={formData.condicionesVulnerabilidad?.necesidadesAcompanamientoNNA?.includes(necesidad) || false} onChange={handleChange} name="condicionesVulnerabilidad.necesidadesAcompanamientoNNA" value={necesidad} />}
                      label={necesidad}
                    />
                  ))}
                </FormGroup>
                {/* {errors['condicionesVulnerabilidad.necesidadesAcompanamientoNNA'] && <FormHelperText error>{errors['condicionesVulnerabilidad.necesidadesAcompanamientoNNA']}</FormHelperText>} */}
              </FormControl>
            </Grid>

{/* 5. ¿Usted o alguna mujer de su núcleo familiar se encuentra actualmente en riesgo de VBG? */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">5. ¿Usted o alguna mujer de su núcleo familiar se encuentra actualmente en riesgo de VBG?</FormLabel>
                <RadioGroup
                  row
                  name="condicionesVulnerabilidad.riesgoVBGActual"
                  value={formData.condicionesVulnerabilidad?.riesgoVBGActual || ''}
                  onChange={handleChange}
                >
                  <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                  <FormControlLabel value="No responde" control={<Radio />} label="No responde" />
                </RadioGroup>
                {errors['condicionesVulnerabilidad.riesgoVBGActual'] && <FormHelperText error>{errors['condicionesVulnerabilidad.riesgoVBGActual']}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Sección: Asistencia Humanitaria y Prevención de Explotación */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
                Asistencia Humanitaria y Prevención de Explotación
              </Typography>
            </Grid>

            {/* 1. ¿Qué tipo de asistencia humanitaria ha recibido en Colombia? */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">1. ¿Qué tipo de asistencia humanitaria ha recibido en Colombia?</FormLabel>
                <FormGroup row>
                  {[
                    'Ninguna', 'Recepción de dinero en efectivo o bonos', 'Alimentos (kits de alimentos)',
                    'Kits de aseo/higiene/elementos de bioseguridad', 'Atención primaria de salud / medicamentos',
                    'Alojamiento temporal', 'Transporte humanitario', 'Información sobre sus derechos en Colombia o acerca de la ruta',
                    'Servicios de protección', 'Apoyo para el acceso a documentación', 'Conectividad (internet, teléfono)',
                    'Acceso a medios de vida', 'Otra'
                  ].map((asistencia) => (
                    <FormControlLabel
                      key={asistencia}
                      control={<Checkbox
                        checked={formData.asistenciaHumanitaria?.tiposAsistencia?.includes(asistencia) || false}
                        onChange={handleChange}
                        name="asistenciaHumanitaria.tiposAsistencia"
                        value={asistencia}
                      />}
                      label={asistencia}
                    />
                  ))}
                </FormGroup>
                {errors['asistenciaHumanitaria.tiposAsistencia'] && (
                  <FormHelperText error>{errors['asistenciaHumanitaria.tiposAsistencia']}</FormHelperText>
                )}
                {formData.asistenciaHumanitaria?.tiposAsistencia?.includes('Otra') && (
                  <TextField
                    label="Otra asistencia, ¿cuál?"
                    name="asistenciaHumanitaria.tiposAsistenciaOtro"
                    value={formData.asistenciaHumanitaria?.tiposAsistenciaOtro || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    error={!!errors['asistenciaHumanitaria.tiposAsistenciaOtro']}
                    helperText={errors['asistenciaHumanitaria.tiposAsistenciaOtro']}
                  />
                )}
              </FormControl>
            </Grid>

            {/* 2. ¿De quién recibió la asistencia humanitaria? */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">2. ¿De quién recibió la asistencia humanitaria?</FormLabel>
                <RadioGroup
                  row
                  name="asistenciaHumanitaria.quienBrindoAsistencia"
                  value={formData.asistenciaHumanitaria?.quienBrindoAsistencia || ''}
                  onChange={handleChange}
                >
                  {['ONGs/ONU', 'Gobierno', 'Amigos o familia', 'Iglesia', 'Población de acogida', 'No sabe'].map((actor) => (
                    <FormControlLabel key={actor} value={actor} control={<Radio />} label={actor} />
                  ))}
                </RadioGroup>
                {errors['asistenciaHumanitaria.quienBrindoAsistencia'] && <FormHelperText error>{errors['asistenciaHumanitaria.quienBrindoAsistencia']}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* 3. ¿Considera que tuvo que hacer algo en contra de su voluntad para recibir esta asistencia? */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">3. ¿Considera que tuvo que hacer algo en contra de su voluntad para recibir esta asistencia?</FormLabel>
                <RadioGroup
                  row
                  name="asistenciaHumanitaria.condicionParaAsistencia"
                  value={formData.asistenciaHumanitaria?.condicionParaAsistencia || ''}
                  onChange={handleChange}
                >
                  <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                  <FormControlLabel value="No responde" control={<Radio />} label="No responde" />
                </RadioGroup>
                {errors['asistenciaHumanitaria.condicionParaAsistencia'] && <FormHelperText error>{errors['asistenciaHumanitaria.condicionParaAsistencia']}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* 4. ¿Se sintió cómodo(a) con el trato recibido? */}
            <Grid item xs={12} md={6}> {/* Ajustado a md={6} para consistencia, si cabe */}
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">4. ¿Se sintió cómodo(a) con el trato recibido?</FormLabel>
                <RadioGroup
                  row
                  name="asistenciaHumanitaria.tratoComodoAsistencia"
                  value={formData.asistenciaHumanitaria?.tratoComodoAsistencia || ''}
                  onChange={handleChange}
                >
                  <FormControlLabel value="Sí" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                  <FormControlLabel value="No responde" control={<Radio />} label="No responde" />
                </RadioGroup>
                {errors['asistenciaHumanitaria.tratoComodoAsistencia'] && <FormHelperText error>{errors['asistenciaHumanitaria.tratoComodoAsistencia']}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Sección: Medios de Comunicación y Observaciones */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
                Medios de Comunicación y Observaciones
              </Typography>
            </Grid>

            {/* Medios de Comunicación Utilizados */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1, mb: 1 }}>
                <FormLabel component="legend">1. ¿Qué medios de comunicación utiliza habitualmente?</FormLabel>
                <FormGroup row>
                  {[
                    'WhatsApp', 'Facebook', 'Instagram', 'Llamada telefónica', 
                    'Mensaje de texto', 'Correo electrónico', 'Telegram', 'Otro'
                  ].map((medio, index) => (
                    <FormControlLabel
                      key={`medio-${index}`}
                      control={
                        <Checkbox
                          checked={formData.mediosComunicacion?.mediosUtilizados
                            ? formData.mediosComunicacion.mediosUtilizados.includes(medio)
                            : false
                          }
                          onChange={(e) => {
                            const { value, checked } = e.target;
                            setFormData(prevData => ({
                              ...prevData,
                              mediosComunicacion: {
                                ...prevData.mediosComunicacion,
                                mediosUtilizados: checked
                                  ? [...(prevData.mediosComunicacion?.mediosUtilizados || []), value]
                                  : (prevData.mediosComunicacion?.mediosUtilizados || []).filter(item => item !== value)
                              }
                            }));
                          }}
                          name="mediosComunicacion.mediosUtilizados"
                          value={medio}
                        />
                      }
                      label={medio}
                    />
                  ))}
                  {formData.mediosComunicacion?.mediosUtilizados?.includes('Otro') && (
                    <TextField
                      label="Otro medio de comunicación, ¿cuál?"
                      name="mediosComunicacion.medioUtilizadoOtro"
                      value={formData.mediosComunicacion?.medioUtilizadoOtro || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      error={!!errors['mediosComunicacion.medioUtilizadoOtro']}
                      helperText={errors['mediosComunicacion.medioUtilizadoOtro']}
                    />
                  )}
                </FormGroup>
              </FormControl>
            </Grid>

            {/* Observaciones Adicionales */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Observaciones adicionales"
                name="observacionesAdicionales"
                value={formData.observacionesAdicionales || ''}
                onChange={handleChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>

           

            {/* Sección: Caracterización del Grupo Familiar */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
                Caracterización del Grupo Familiar
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                label="Número total de personas en el hogar"
                name="caracterizacionGrupo.numPersonasHogar"
                value={formData.caracterizacionGrupo?.numPersonasHogar || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Hay niños, niñas o adolescentes en el hogar?</InputLabel>
                <Select
                  name="caracterizacionGrupo.tieneNinosAdolescentes"
                  value={formData.caracterizacionGrupo?.tieneNinosAdolescentes || ''}
                  label="¿Hay niños, niñas o adolescentes en el hogar?"
                  onChange={handleChange}
                >
                  <MenuItem value="Si">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="NoResponde">No responde</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Se requiere caracterización individual de los miembros del hogar?</InputLabel>
                <Select
                  name="caracterizacionGrupo.caracterizacionIndividual"
                  value={formData.caracterizacionGrupo?.caracterizacionIndividual || ''}
                  label="¿Se requiere caracterización individual de los miembros del hogar?"
                  onChange={handleChange}
                >
                  <MenuItem value="Si">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Composición por edad y género */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Composición del Hogar
              </Typography>
            </Grid>

            <Grid item xs={12} container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niños (0-5 años)"
                  name="caracterizacionGrupo.ninos0a5"
                  value={formData.caracterizacionGrupo?.ninos0a5 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niñas (0-5 años)"
                  name="caracterizacionGrupo.ninas0a5"
                  value={formData.caracterizacionGrupo?.ninas0a5 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niños (6-9 años)"
                  name="caracterizacionGrupo.ninos6a9"
                  value={formData.caracterizacionGrupo?.ninos6a9 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niñas (6-9 años)"
                  name="caracterizacionGrupo.ninas6a9"
                  value={formData.caracterizacionGrupo?.ninas6a9 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            </Grid>

            <Grid item xs={12} container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niños (10-14 años)"
                  name="caracterizacionGrupo.ninos10a14"
                  value={formData.caracterizacionGrupo?.ninos10a14 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niñas (10-14 años)"
                  name="caracterizacionGrupo.ninas10a14"
                  value={formData.caracterizacionGrupo?.ninas10a14 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niños (15-17 años)"
                  name="caracterizacionGrupo.ninos15a17"
                  value={formData.caracterizacionGrupo?.ninos15a17 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Niñas (15-17 años)"
                  name="caracterizacionGrupo.ninas15a17"
                  value={formData.caracterizacionGrupo?.ninas15a17 || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            </Grid>

            <Grid item xs={12} container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Hombres adultos"
                  name="caracterizacionGrupo.hombresAdultos"
                  value={formData.caracterizacionGrupo?.hombresAdultos || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  type="number"
                  label="Mujeres adultas"
                  name="caracterizacionGrupo.mujeresAdultas"
                  value={formData.caracterizacionGrupo?.mujeresAdultas || ''}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            </Grid>

            {/* Condiciones especiales */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Hay personas gestantes?</InputLabel>
                <Select
                  name="caracterizacionGrupo.personasGestantes"
                  value={formData.caracterizacionGrupo?.personasGestantes || ''}
                  label="¿Hay personas gestantes?"
                  onChange={handleChange}
                >
                  <MenuItem value="Si">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Hay niños, niñas o adolescentes en condición de discapacidad?</InputLabel>
                <Select
                  name="caracterizacionGrupo.tieneDiscapacidad"
                  value={formData.caracterizacionGrupo?.tieneDiscapacidad || ''}
                  label="¿Hay niños, niñas o adolescentes en condición de discapacidad?"
                  onChange={handleChange}
                >
                  <MenuItem value="Si">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Condiciones socioeconómicas del hogar */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Condiciones Socioeconómicas del Hogar
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Cuál es la principal fuente de ingresos del hogar?</InputLabel>
                <Select
                  name="caracterizacionGrupo.fuenteIngresos"
                  value={formData.caracterizacionGrupo?.fuenteIngresos || ''}
                  label="¿Cuál es la principal fuente de ingresos del hogar?"
                  onChange={handleChange}
                >
                  <MenuItem value="EmpleoFormal">Empleo Formal</MenuItem>
                  <MenuItem value="EmpleoInformal">Empleo Informal</MenuItem>
                  <MenuItem value="Emprendimiento">Emprendimiento</MenuItem>
                  <MenuItem value="Remesas">Remesas</MenuItem>
                  <MenuItem value="Ayudas">Ayudas Humanitarias</MenuItem>
                  <MenuItem value="Ninguno">Ninguno</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                type="number"
                label="Ingreso mensual aproximado del hogar"
                name="caracterizacionGrupo.ingresoMensual"
                value={formData.caracterizacionGrupo?.ingresoMensual || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                margin="normal"
                InputProps={{ inputProps: { min: 0 }, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Cuál es la condición de la vivienda?</InputLabel>
                <Select
                  name="caracterizacionGrupo.condicionVivienda"
                  value={formData.caracterizacionGrupo?.condicionVivienda || ''}
                  label="¿Cuál es la condición de la vivienda?"
                  onChange={handleChange}
                >
                  <MenuItem value="Arrendada">Arrendada</MenuItem>
                  <MenuItem value="Propia">Propia</MenuItem>
                  <MenuItem value="Prestada">Prestada</MenuItem>
                  <MenuItem value="Albergue">Albergue/Refugio</MenuItem>
                  <MenuItem value="Informal">Asentamiento Informal</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Cuántas personas dependen económicamente de este hogar?</InputLabel>
                <Select
                  name="caracterizacionGrupo.personasDependientes"
                  value={formData.caracterizacionGrupo?.personasDependientes || ''}
                  label="¿Cuántas personas dependen económicamente de este hogar?"
                  onChange={handleChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <MenuItem key={num} value={num.toString()}>
                      {num}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>¿Algún miembro del hogar ha sido beneficiario de programas sociales?</InputLabel>
                <Select
                  name="caracterizacionGrupo.beneficiarioProgramasSociales"
                  value={formData.caracterizacionGrupo?.beneficiarioProgramasSociales || ''}
                  label="¿Algún miembro del hogar ha sido beneficiario de programas sociales?"
                  onChange={handleChange}
                >
                  <MenuItem value="Si">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sección: Conflicto Armado y Rutas de Atención */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, textAlign: 'center', backgroundColor: '#f0f0f0', padding: '8px' }}>
              Conflicto Armado y Rutas de Atención
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="victimOfViolence-label">¿Ha sido víctima de violencia o discriminación en Colombia?</InputLabel>
                <Select
                  labelId="victimOfViolence-label"
                  name="victimOfViolence"
                  value={formData.victimOfViolence || ''}
                  label="¿Ha sido víctima de violencia o discriminación en Colombia?"
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="victimOfArmedConflict-label">¿Ha sido víctima del conflicto armado?</InputLabel>
                <Select
                  labelId="victimOfArmedConflict-label"
                  name="victimOfArmedConflict"
                  value={formData.victimOfArmedConflict || ''}
                  label="¿Ha sido víctima del conflicto armado?"
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="conflictVictimType-label">En el marco del conflicto armado, ¿de qué ha sido víctima?</InputLabel>
                <Select
                  labelId="conflictVictimType-label"
                  name="conflictVictimType"
                  value={formData.conflictVictimType || ''}
                  label="En el marco del conflicto armado, ¿de qué ha sido víctima?"
                  onChange={handleChange}
                  disabled={formData.victimOfArmedConflict === 'No'}
                  fullWidth
                >
                  <MenuItem value="Desplazamiento">Desplazamiento forzado</MenuItem>
                  <MenuItem value="Amenazas">Amenazas</MenuItem>
                  <MenuItem value="Reclutamiento">Reclutamiento forzado</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="conflictVictimDetails-label">¿Cuáles fueron los hechos específicos de los que fue víctima?</InputLabel>
                <Select
                  labelId="conflictVictimDetails-label"
                  name="conflictVictimDetails"
                  value={formData.conflictVictimDetails || ''}
                  label="¿Cuáles fueron los hechos específicos de los que fue víctima?"
                  onChange={handleChange}
                  disabled={formData.conflictVictimType === 'Ninguno'}
                  fullWidth
                >
                  <MenuItem value="Lesiones">Lesiones personales</MenuItem>
                  <MenuItem value="Desaparicion">Desaparición forzada</MenuItem>
                  <MenuItem value="Homicidio">Homicidio de familiar</MenuItem>
                  <MenuItem value="Tortura">Tortura</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="supportRoute-label">¿A dónde acude cuando necesita regularizar su situación?</InputLabel>
                <Select
                  labelId="supportRoute-label"
                  name="supportRoute"
                  value={formData.supportRoute || ''}
                  label="¿A dónde acude cuando necesita regularizar su situación?"
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="Migración Colombia">Migración Colombia</MenuItem>
                  <MenuItem value="Alcaldía">Alcaldía</MenuItem>
                  <MenuItem value="Personería">Personería</MenuItem>
                  <MenuItem value="Cancillería">Cancillería</MenuItem>
                  <MenuItem value="ONG">ONG</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                  <MenuItem value="PAO">PAO</MenuItem>
                  <MenuItem value="Personería municipal">Personería municipal</MenuItem>
                  <MenuItem value="Consultoría">Consultoría</MenuItem>
                  <MenuItem value="Defensoría">Defensoría</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} container spacing={2}>
              <Grid item xs={6}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => navigate('/funcionario/poblacion-migrante')}
                >
                  Finalizar Registro
                </Button>
              </Grid>
            </Grid>
        </form>
      </Paper>

      {/* Diálogo de Confirmación */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirmar Registro</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            ¿Está seguro que desea enviar el formulario de Población Migrante?
            Por favor, revise que toda la información sea correcta.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmSubmit} color="primary" autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Modal de Error */}
      <Dialog
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        aria-labelledby="error-dialog-title"
      >
        <DialogTitle id="error-dialog-title">Error</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowErrorModal(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  </PageLayout>
  );
}

export default RegistroPoblacionMigrante;
