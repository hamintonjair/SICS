import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import SignatureCanvas from 'react-signature-canvas';
import { useTheme, useMediaQuery } from '@mui/material';
import { 
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  FormLabel,
  FormGroup,
  FormHelperText,
  Checkbox,
  Switch,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonSearch as PersonSearchIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { barriosPorComuna } from "../../data/barriosPorComuna";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSnackbar } from "../../context/SnackbarContext";
import lineaTrabajoService from "../../services/lineaTrabajoService";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CircularProgress from '@mui/material/CircularProgress';
import {
  crearBeneficiario,
  actualizarBeneficiario,
  verificarDocumentoUnico,
  verificarCorreoUnico,
} from "../../services/beneficiarioService";
import { obtenerComunas } from "../../services/comunaService";

// Constantes para selección
const TIPOS_DOCUMENTO = [
  "Cédula",
  "Tarjeta de Identidad",
  "Pasaporte",
  "Registro Civil",
];
const GENEROS = ["Masculino", "Femenino", "Otro", "Prefiero no decir"];
const RANGOS_EDAD = [
  "0-12",
  "13-18",
  "19-25",
  "26-35",
  "36-45",
  "46-55",
  "56-65",
  "66 o más",
];
const ETNIAS = ["Afrodescendiente", "Indígena", "Raizal", "Palenquero", "Gitano", "Mestizo"];

// Función para manejar la lógica de la etnia
const getEtniaValue = (etnia, etniaPersonalizada = '') => {
  if (etnia === 'Otro') {
    return etniaPersonalizada || 'Otra';
  } else if (etnia === 'Ninguna') {
    return '';
  }
  return etnia || '';
};
const TIPOS_DISCAPACIDAD = [
  "Física",
  "Visual",
  "Auditiva",
  "Cognitiva",
  "Múltiple",
];
const NIVELES_EDUCATIVOS = [
  "Primaria",
  "Secundaria",
  "Técnico",
  "Tecnólogo",
  "Universitario",
  "Posgrado",
  "Ninguno",
];
const SITUACIONES_LABORALES = [
  "Empleado",
  "Desempleado",
  "Estudiante",
  "Independiente",
  "Jubilado",
];
const TIPOS_VIVIENDA = ["Propia", "Arrendada", "Familiar", "Compartida"];

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistroBeneficiarios() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [barriosDisponibles, setBarriosDisponibles] = useState([]);
  const [openFirmaDialog, setOpenFirmaDialog] = useState(false);
  const [signature, setSignature] = useState(null);
  const sigCanvas = useRef(null);
  
  // Estados para detección de dispositivo y orientación
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined' ? (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait') : 'portrait'
  );
  
  // Efecto para detectar cambios de orientación
  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  // Effect to keep signature state in sync with formData
  useEffect(() => {
    console.log('Signature state updated:', { 
      hasSignature: !!signature,
      type: typeof signature,
      length: signature ? signature.length : 0
    });
  }, [signature]);

  const [comunas, setComunas] = useState([]);
  const [currentComunaCentroide, setCurrentComunaCentroide] = useState(null); // NUEVO ESTADO para el centroide

  // Manejadores para el diálogo de firma
  const handleOpenFirmaDialog = () => {
    setOpenFirmaDialog(true);
  };

  const handleCloseFirmaDialog = () => {
    setOpenFirmaDialog(false);
  };

  const handleClearFirma = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignature(null);
      setFormData(prev => ({
        ...prev,
        firma: null
      }));
    }
  };

  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  // Verificar si el canvas está vacío cuando se abre el diálogo
  useEffect(() => {
    if (openFirmaDialog) {
      const timer = setTimeout(() => {
        if (sigCanvas.current) {
          setIsCanvasEmpty(sigCanvas.current.isEmpty());
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [openFirmaDialog]);

  const handleCanvasEnd = () => {
    if (sigCanvas.current) {
      setIsCanvasEmpty(sigCanvas.current.isEmpty());
    }
  };

  const handleSaveFirma = async () => {
    if (!sigCanvas.current) {
      console.error('Error: No se pudo acceder al canvas de firma');
      return;
    }

    // Verificar si el canvas está vacío
    if (isCanvasEmpty) {
      enqueueSnackbar('Por favor, realice una firma antes de guardar', { 
        variant: 'warning',
        autoHideDuration: 3000
      });
      return;
    }

    try {
      // Obtener la firma como base64
      const firmaData = sigCanvas.current.toDataURL('image/png');
      
      // Verificar que la firma sea válida
      if (!firmaData || typeof firmaData !== 'string' || !firmaData.startsWith('data:image/')) {
        throw new Error('Formato de firma no válido');
      }
      
      console.log('Guardando nueva firma:', { 
        tipo: typeof firmaData,
        longitud: firmaData.length,
        inicio: firmaData.substring(0, 30) + '...'
      });
      
      // Primero actualizamos el estado local
      setSignature(firmaData);
      
      // Luego actualizamos formData con el valor más reciente
      const nuevoFormData = {
        ...formData,
        firma: firmaData
      };
      
      console.log('Actualizando formData con firma:', { 
        tieneFirma: !!firmaData,
        tipo: typeof firmaData,
        longitud: firmaData.length
      });
      
      // Actualizamos el estado del formulario
      setFormData(nuevoFormData);
      
      // Pequeña pausa para asegurar la actualización
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificación después de la actualización
      console.log('Verificación después de actualizar:', {
        enEstado: !!signature,
        enFormData: !!nuevoFormData.firma,
        sonIguales: signature === nuevoFormData.firma
      });
      
      // Cerrar el diálogo y mostrar confirmación
      setOpenFirmaDialog(false);
      enqueueSnackbar('Firma guardada correctamente', { 
        variant: 'success',
        autoHideDuration: 2000
      });
      
    } catch (error) {
      console.error('Error al guardar la firma:', error);
      enqueueSnackbar('Error al guardar la firma. Por favor, intente nuevamente.', { 
        variant: 'error',
        autoHideDuration: 3000
      });
    }
  };

  // Función para obtener barrios por comuna (envuelta en useCallback)
  const obtenerBarriosPorComuna = useCallback((comunaNombre) => {
    // Función auxiliar para extraer solo 'Comuna X' del nombre
    const getComunaKey = (nombre) => {
      if (!nombre) return "";
      const match = nombre.match(/Comuna ?\d+/i);
      return match ? match[0].trim() : nombre.trim();
    };
    if (!comunaNombre) {
      console.warn("obtenerBarriosPorComuna: comunaNombre vacío o undefined");
      return [];
    }

    if (!Array.isArray(barriosPorComuna)) {
      console.warn(
        "obtenerBarriosPorComuna: barriosPorComuna no es un array",
        barriosPorComuna
      );
      return [];
    }

    const comunaKey = getComunaKey(comunaNombre);
    if (!comunaKey) {
      console.warn(
        "obtenerBarriosPorComuna: comunaKey no pudo generarse para",
        comunaNombre
      );
      return [];
    }

    const comunaEncontrada = barriosPorComuna.find(
      (c) => c && typeof c === "object" && c.comuna === comunaKey
    );

    if (!comunaEncontrada) {
      console.warn(
        `obtenerBarriosPorComuna: no se encontró la comuna "${comunaKey}" en barriosPorComuna`
      );
      return [];
    }

    return Array.isArray(comunaEncontrada.barrios)
      ? comunaEncontrada.barrios
      : [];
  }, []);

  // Valores iniciales con valores por defecto explícitos (envueltos en useMemo)
  const VALORES_INICIALES = useMemo(() => ({
    // Datos del funcionario
    funcionario_id: user?.id || "",
    funcionario_nombre: user?.nombre || "",
    linea_trabajo: user?.linea_trabajo || "",
    fecha_registro: new Date().toISOString().split("T")[0],
    
    // Firma digital
    firma: null,

    // Datos personales
    nombre_completo: "",
    tipo_documento: "", // Inicialmente vacío para forzar selección
    numero_documento: "",
    genero: "", // Inicialmente vacío para forzar selección
    rango_edad: "", // Inicialmente vacío para forzar selección

    // Habilidades básicas (campos opcionales con valor por defecto false)
    sabe_leer: false,
    sabe_escribir: false,

    // Contacto
    numero_celular: "",
    correo_electronico: "",

    // Datos socioculturales
    etnia: "", // Inicialmente vacío para forzar selección
    etniaPersonalizada: "", // NUEVO CAMPO para etnia personalizada
    comuna: "",
    barrio: "",
    otroBarrio: "",
    barrio_lat: null,
    barrio_lng: null,

    // Discapacidad
    tiene_discapacidad: false,
    tipo_discapacidad: "",
    nombre_cuidadora: "",
    labora_cuidadora: false,

    // Conflicto armado
    victima_conflicto: false,

    // Familia
    hijos_a_cargo: 0,
    // Datos educativos y laborales
    estudia_actualmente: false,
    nivel_educativo: "", // Inicialmente vacío para forzar selección
    situacion_laboral: "", // Inicialmente vacío para forzar selección
    tipo_vivienda: "", // Inicialmente vacío para forzar selección
    // Ayuda humanitaria
    ayuda_humanitaria: false,
    descripcion_ayuda_humanitaria: "",
  }), [user?.id, user?.nombre, user?.linea_trabajo]);

  const [formData, setFormData] = useState({
    ...VALORES_INICIALES,
    funcionario_id: user?.id || "",
    funcionario_nombre: user?.nombre || "",
    linea_trabajo: user?.linea_trabajo || "",
    fecha_registro: new Date().toISOString().split("T")[0],
    etnia: "",
    etniaPersonalizada: "",
    firma: null
  });

  const [nombreLineaTrabajo, setNombreLineaTrabajo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [beneficiarioId, setBeneficiarioId] = useState(null);

  // useEffect para manejar la carga inicial de barrios cuando se está editando
  useEffect(() => {
    if (location.state?.beneficiario) {
      const beneficiario = location.state.beneficiario;
      console.log('Cargando beneficiario para edición:', {
        ...beneficiario,
        firma: beneficiario.firma ? 'firma presente' : 'sin firma'
      });
      setModoEdicion(true);
      setBeneficiarioId(beneficiario.id);

      // Cargar la firma si existe
      if (beneficiario.firma) {
        const firmaData = beneficiario.firma;
        console.log('Cargando firma existente:', {
          longitud: firmaData.length,
          tipo: typeof firmaData,
          esValida: firmaData.startsWith('data:image/')
        });
        
        // Actualizar ambos estados de forma síncrona
        setSignature(firmaData);
        
        // Usar la función de actualización para asegurar que tenemos el estado más reciente
        setFormData(prev => {
          const nuevoEstado = {
            ...prev,
            firma: firmaData
          };
          console.log('Firma cargada en formData:', { 
            tieneFirma: !!nuevoEstado.firma,
            tipo: typeof nuevoEstado.firma,
            longitud: firmaData.length
          });
          return nuevoEstado;
        });
      }

      // Normalizar y encontrar la etnia en la lista de ETNIAS (búsqueda insensible a mayúsculas/minúsculas)
      const etniaEncontrada = ETNIAS.find(etnia => 
        etnia.toLowerCase() === (beneficiario.etnia || '').toLowerCase().trim()
      ) || (ETNIAS.length > 0 ? ETNIAS[0] : '');
      
      console.log('Cargando etnia:', {
        original: beneficiario.etnia,
        seleccionada: etniaEncontrada,
        etniasDisponibles: ETNIAS,
        firmaCargada: !!beneficiario.firma
      }, 'Tipo de etnia:', typeof beneficiario.etnia);

      // Si el beneficiario tiene una comuna, cargar sus barrios
      if (beneficiario.comuna) {
        const barriosDeComuna = obtenerBarriosPorComuna(beneficiario.comuna);
        setBarriosDisponibles(barriosDeComuna);

        // Obtener el centroide de la comuna
        const comunaSeleccionadaData = barriosPorComuna.find(
          (c) => c.comuna === beneficiario.comuna
        );
        setCurrentComunaCentroide(
          comunaSeleccionadaData ? comunaSeleccionadaData.centroide : null
        );

        // Verificar si el barrio del beneficiario está en la lista de barrios de la comuna
        const barrioEncontrado = barriosDeComuna.find(b => 
          b.nombre.toLowerCase() === (beneficiario.barrio || '').toLowerCase().trim()
        );
        
        // Determinar si es un barrio personalizado (no está en la lista de la comuna)
        const esBarrioPersonalizado = barriosDeComuna.length > 0 && 
          !barrioEncontrado && 
          beneficiario.barrio && 
          beneficiario.barrio.trim() !== "" && 
          beneficiario.barrio !== "No especificado" &&
          beneficiario.barrio !== "Zona Rural";
        
        // Preparar los valores para el formulario
        let barrioSeleccionado, barrioPersonalizado;
        
        if (esBarrioPersonalizado) {
          // Si es un barrio personalizado, seleccionar "otro" y guardar el valor en otroBarrio
          barrioSeleccionado = "otro";
          barrioPersonalizado = beneficiario.barrio;
        } else if (barrioEncontrado) {
          // Si el barrio está en la lista, usarlo directamente
          barrioSeleccionado = barrioEncontrado.nombre;
          barrioPersonalizado = "";
        } else {
          // Si no hay barrio o no está en la lista, dejar vacío
          barrioSeleccionado = "";
          barrioPersonalizado = "";
        }

        console.log('Barrio - Original:', beneficiario.barrio, 
                   'Seleccionado:', barrioSeleccionado, 
                   'Personalizado:', barrioPersonalizado,
                   'Es personalizado:', esBarrioPersonalizado,
                   'Barrios disponibles:', barriosDeComuna.map(b => b.nombre));

        // Crear un nuevo objeto con los valores actualizados
        const datosActualizados = {
          // Primero, establecer los valores iniciales
          ...VALORES_INICIALES,
          // Luego, sobrescribir con los valores del beneficiario
          ...beneficiario,
          // Establecer la etnia seleccionada (o la primera opción por defecto)
          etnia: etniaEncontrada,
          // Manejo de barrio personalizado
          barrio: barrioSeleccionado,
          otroBarrio: barrioPersonalizado,
          // Asegurar que los valores booleanos se manejen correctamente
          sabe_leer: beneficiario.sabe_leer !== undefined ? !!beneficiario.sabe_leer : true,
          sabe_escribir: beneficiario.sabe_escribir !== undefined ? !!beneficiario.sabe_escribir : true,
          tiene_discapacidad: !!beneficiario.tiene_discapacidad,
          labora_cuidadora: !!beneficiario.labora_cuidadora,
          victima_conflicto: !!beneficiario.victima_conflicto,
          estudia_actualmente: !!beneficiario.estudia_actualmente,
          ayuda_humanitaria: !!beneficiario.ayuda_humanitaria,
          // Asegurar que la firma se mantenga si existe
          firma: beneficiario.firma || null
        };

        console.log('Datos actualizados para el formulario:', datosActualizados);
        setFormData(datosActualizados);
      } else {
        // Si no hay comuna, actualizar formData con los datos del beneficiario
        // Actualizar datos del beneficiario
        const datosActualizados = {
          ...VALORES_INICIALES,
          ...beneficiario,

          // Asegurar que los valores booleanos se manejen correctamente
          sabe_leer: beneficiario.sabe_leer !== undefined ? !!beneficiario.sabe_leer : true,
          sabe_escribir: beneficiario.sabe_escribir !== undefined ? !!beneficiario.sabe_escribir : true,
          tiene_discapacidad: !!beneficiario.tiene_discapacidad,
          labora_cuidadora: !!beneficiario.labora_cuidadora,
          victima_conflicto: !!beneficiario.victima_conflicto,
          estudia_actualmente: !!beneficiario.estudia_actualmente,
          ayuda_humanitaria: !!beneficiario.ayuda_humanitaria,
          // Asegurar que la firma se mantenga si existe
          firma: beneficiario.firma || null
        };
        
        console.log('Datos actualizados (sin comuna):', datosActualizados);
        setFormData(datosActualizados);
      }
    }
  }, [location.state, VALORES_INICIALES, obtenerBarriosPorComuna]);

  // Función para obtener el valor de etnia para envío
  const getEtniaValue = (etnia, etniaPersonalizada = '') => {
    if (etnia === 'Otro') {
      return etniaPersonalizada || 'Otra';
    } else if (etnia === 'Ninguna') {
      return '';
    }
    return etnia || '';
  };

  // Estados del componentevalidación
  const [errores, setErrores] = useState({});
  const [validando, setValidando] = useState({
    documento: false,
    correo: false
  });
  const [estadoValidacion, setEstadoValidacion] = useState({
    documento: null, // null: no validado, true: válido, false: inválido
    correo: null
  });

  // Manejar cambio en campos del formulario con validación en tiempo real
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Validar que el campo de número de documento solo acepte números
    if (name === 'numero_documento' && value !== '') {
      // Expresión regular que solo permite números
      const soloNumeros = /^[0-9\b]+$/;
      if (!soloNumeros.test(value)) {
        return; // No actualizar el estado si no es un número
      }
    }

    // Manejo especial para el campo de etnia
    if (name === 'etnia') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Si se selecciona 'Otro', limpiamos el valor de etniaPersonalizada
        etniaPersonalizada: value === 'Otro' ? '' : prev.etniaPersonalizada
      }));
      return;
    }

    // Manejo especial para campos booleanos
    if (type === 'checkbox') {
      setFormData(prevData => ({
        ...prevData,
        [name]: checked
      }));
      
      // Limpiar errores de validación para los checkboxes opcionales
      if (name === 'sabe_leer' || name === 'sabe_escribir') {
        setErrores(prevErrores => ({
          ...prevErrores,
          [name]: null
        }));
      }
      return;
    }

    // Si cambia la comuna, actualizar los barrios disponibles
    if (name === "comuna") {
      const barrios = obtenerBarriosPorComuna(value);
      setBarriosDisponibles(barrios);

      // Buscar la comuna seleccionada en el array barriosPorComuna para obtener su centroide
      const comunaSeleccionadaData = barriosPorComuna.find(
        (c) => c.comuna === value
      );
      setCurrentComunaCentroide(comunaSeleccionadaData ? comunaSeleccionadaData.centroide : null);

      setFormData((prevData) => ({
        ...prevData,
        comuna: value,
        barrio: "",
        otroBarrio: "",
        barrio_lat: null,
        barrio_lng: null,
      }));
      return;
    }

    // Si cambia el select de barrio
    if (name === "barrio") {
      if (value === "otro") {
        let lat = null;
        let lng = null;

        if (barriosDisponibles && barriosDisponibles.length > 0) {
          const randomIndex = Math.floor(Math.random() * barriosDisponibles.length);
          const randomBarrio = barriosDisponibles[randomIndex];
          
          // Pequeño desplazamiento aleatorio (entre +/- 0.0001 y +/- 0.0005 grados)
          const latOffset = (Math.random() - 0.5) * 0.0008 + 0.0001;
          const lngOffset = (Math.random() - 0.5) * 0.0008 + 0.0001;
          
          lat = randomBarrio.lat + latOffset;
          lng = randomBarrio.lng + lngOffset;
        } else if (currentComunaCentroide) {
          // Fallback al centroide si no hay barrios disponibles
          lat = currentComunaCentroide.lat;
          lng = currentComunaCentroide.lng;
        }

        setFormData((prevData) => ({
          ...prevData,
          barrio: "otro",
          otroBarrio: "",
          barrio_lat: lat,
          barrio_lng: lng,
        }));
      } else {
        // Buscar el barrio seleccionado en barriosDisponibles
        const barrioObj = barriosDisponibles.find((b) => b.nombre === value);
        setFormData((prevData) => ({
          ...prevData,
          barrio: value,
          otroBarrio: "",
          barrio_lat: barrioObj ? barrioObj.lat : null,
          barrio_lng: barrioObj ? barrioObj.lng : null,
        }));
      }
      return;
    }

    // Manejar el input manual de "otro barrio"
    if (name === "otroBarrio") {
      setFormData((prevData) => ({
        ...prevData,
        otroBarrio: value,
      }));
      return;
    }

    // Para el resto de los campos
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    
    // Validación en tiempo real para campos específicos
    if (name === 'numero_documento' && value) {
      // Usar un pequeño retraso para evitar múltiples llamadas mientras el usuario escribe
      const timer = setTimeout(() => {
        validarDocumentoUnico(value);
      }, 500);
      return () => clearTimeout(timer);
    }
    
    if (name === 'correo_electronico') {
      const timer = setTimeout(() => {
        validarCorreoUnico(value);
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  // Función para validar campos requeridos
  const validarCamposRequeridos = () => {
    // Usar signature si está disponible, de lo contrario usar formData.firma
    const firmaAValidar = signature || formData.firma;
    const tieneFirma = !!firmaAValidar && 
                     typeof firmaAValidar === 'string' && 
                     firmaAValidar.startsWith('data:image/');
    
    console.log('Validando firma:', {
      tieneFirma,
      tipo: typeof firmaAValidar,
      longitud: firmaAValidar ? firmaAValidar.length : 0,
      fuente: signature ? 'signature' : formData.firma ? 'formData.firma' : 'ninguna'
    });
    
    // Validar que se haya capturado la firma
    if (!tieneFirma) {
      console.error('Error de validación: No se encontró firma válida', {
        signature: !!signature,
        formDataFirma: !!formData.firma,
        tipoSignature: typeof signature,
        tipoFormDataFirma: typeof formData.firma
      });
      
      enqueueSnackbar('Por favor, capture su firma antes de enviar el formulario', { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
      return true; // Hay errores
    }
    
    // Lista de campos requeridos con sus mensajes de error
    const camposRequeridos = [
  
      { 
        campo: 'nombre_completo', 
        etiqueta: 'Nombre Completo',
        mensaje: 'El nombre completo es requerido',
        tipo: 'texto'
      },
      { 
        campo: 'tipo_documento', 
        etiqueta: 'Tipo de Documento',
        mensaje: 'El tipo de documento es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'numero_documento', 
        etiqueta: 'Número de Documento',
        mensaje: 'El número de documento es requerido',
        tipo: 'texto'
      },
      { 
        campo: 'genero', 
        etiqueta: 'Género',
        mensaje: 'El género es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'rango_edad', 
        etiqueta: 'Rango de Edad',
        mensaje: 'El rango de edad es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      // Los campos 'sabe_leer' y 'sabe_escribir' son opcionales
      // y NO deben incluirse en la validación de campos requeridos
      { 
        campo: 'numero_celular', 
        etiqueta: 'Número de Celular',
        mensaje: 'El número de celular es requerido',
        tipo: 'texto'
      },
      { 
        campo: 'etnia', 
        etiqueta: 'Etnia',
        mensaje: 'La etnia es requerida',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'comuna', 
        etiqueta: 'Comuna',
        mensaje: 'La comuna es requerida',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'barrio', 
        etiqueta: 'Barrio',
        mensaje: 'El barrio es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...',
        condicion: () => formData.comuna // Solo es requerido si hay una comuna seleccionada
      },
      { 
        campo: 'tipo_vivienda', 
        etiqueta: 'Tipo de Vivienda',
        mensaje: 'El tipo de vivienda es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'nivel_educativo', 
        etiqueta: 'Nivel Educativo',
        mensaje: 'El nivel educativo es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      {
        campo: 'situacion_laboral',
        etiqueta: 'Situación Laboral',
        mensaje: 'La situación laboral es requerida',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      }
    ];

    const nuevosErrores = {};
    const camposIncompletos = [];
    let hayErrores = false;

    camposRequeridos.forEach(({ campo, etiqueta, mensaje, tipo, condicion, opcionInicial, validar: validarCampo }) => {
      // Si hay una condición y no se cumple, saltar la validación de este campo
      if (condicion && !condicion()) {
        return;
      }

      let esInvalido = false;
      const valor = formData[campo];
      
      // Si hay una función de validación personalizada, usarla
      if (validarCampo) {
        esInvalido = !validarCampo(valor);
      } else {
        // Validación específica por tipo de campo
        switch (tipo) {
          case 'select':
            // Un campo select es inválido si está vacío, es nulo, indefinido o igual a la opción inicial
            esInvalido = !valor || valor === '' || (opcionInicial && valor === opcionInicial);
            break;
          case 'numero':
            esInvalido = valor === null || valor === undefined || valor === '';
            break;
          case 'texto':
            esInvalido = !valor || valor.trim() === '';
            break;
          case 'booleano':
            // Los campos booleanos solo son inválidos si son null o undefined explícitamente
            // No son inválidos si son false, ya que false es un valor válido para campos booleanos
            esInvalido = valor === null || valor === undefined;
            // Si el campo es 'sabe_leer' o 'sabe_escribir', no es obligatorio
            if (campo === 'sabe_leer' || campo === 'sabe_escribir') {
              esInvalido = false; // Nunca marcar como inválido
            }
            break;

          default:
            esInvalido = !valor || (typeof valor === 'string' && valor.trim() === '');
        }
      }
      

      
      if (esInvalido) {
        nuevosErrores[campo] = mensaje;
        camposIncompletos.push(etiqueta);
        hayErrores = true;
      }
    });

    // Validar discapacidad
    if (formData.tiene_discapacidad && !formData.tipo_discapacidad) {
      nuevosErrores.tipo_discapacidad = 'Debe especificar el tipo de discapacidad';
      camposIncompletos.push('Tipo de Discapacidad');
      hayErrores = true;
    }

    // Validar ayuda humanitaria
    if (formData.ayuda_humanitaria && !formData.descripcion_ayuda_humanitaria) {
      nuevosErrores.descripcion_ayuda_humanitaria = 'Debe describir la ayuda humanitaria';
      camposIncompletos.push('Descripción de Ayuda Humanitaria');
      hayErrores = true;
    }
    
    // Asegurarse de que los campos opcionales no generen errores
    if (errores.sabe_leer) delete nuevosErrores.sabe_leer;
    if (errores.sabe_escribir) delete nuevosErrores.sabe_escribir;

    // Mostrar notificaciones para cada campo faltante
    if (camposIncompletos.length > 0) {
      // Mostrar una notificación general primero
      enqueueSnackbar(`Por favor complete los campos requeridos:`, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
      
      // Luego mostrar notificaciones individuales para cada campo faltante
      setTimeout(() => {
        camposIncompletos.forEach((campo, index) => {
          setTimeout(() => {
            enqueueSnackbar(`• ${campo} es requerido`, { 
              variant: 'error',
              autoHideDuration: 3000,
              anchorOrigin: { vertical: 'top', horizontal: 'right' }
            });
          }, index * 300); // Espaciar las notificaciones
        });
      }, 500);
    }

    setErrores(nuevosErrores);
    return hayErrores;
  };

  // Función para validar la firma
  const validarFirma = (firma = formData.firma) => {
    // Usar el estado local de signature si está disponible
    const firmaAValidar = firma || signature;
    
    const tieneFirma = !!firmaAValidar && 
                     typeof firmaAValidar === 'string' && 
                     firmaAValidar.startsWith('data:image/');
    
    if (!tieneFirma) {
      console.error('Error de validación: Firma no válida o faltante', {
        tieneFirma: !!firmaAValidar,
        tipo: typeof firmaAValidar,
        esString: typeof firmaAValidar === 'string',
        esImagen: firmaAValidar?.startsWith?.('data:image/'),
        enFormData: !!formData.firma,
        enEstado: !!signature
      });
      
      enqueueSnackbar('Por favor, capture su firma antes de continuar', {
        variant: 'error',
        autoHideDuration: 4000
      });
      
      return false;
    }
    
    return true;
  };

  // Función para sincronizar la firma
  const sincronizarFirma = async () => {
    if (signature && (!formData.firma || formData.firma !== signature)) {
      console.log('Sincronizando firma a formData');
      
      // Crear un nuevo objeto formData con la firma actualizada
      const nuevoFormData = {
        ...formData,
        firma: signature
      };
      
      // Actualizar el estado de formData
      setFormData(nuevoFormData);
      
      // Pequeña pausa para permitir la actualización
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Firma sincronizada:', {
        enFormData: !!nuevoFormData.firma,
        enEstado: !!signature,
        sonIguales: signature === nuevoFormData.firma
      });
      
      enqueueSnackbar('Firma actualizada correctamente', { 
        variant: 'info',
        autoHideDuration: 2000
      });
      
      return true; // Se realizó la sincronización
    }
    return false; // No se necesitó sincronización
  };

  // Modificar handleSubmit para incluir validaciones
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Usar signature si está disponible, de lo contrario usar formData.firma
    const firmaAUsar = signature || formData.firma;
    
    // Depuración: Mostrar el estado actual
    console.log('=== Validando formulario ===', {
      formDataFirma: {
        tiene: !!formData.firma,
        tipo: typeof formData.firma,
        longitud: formData.firma ? formData.firma.length : 0,
        esImagen: formData.firma?.startsWith?.('data:image/')
      },
      signatureState: {
        tiene: !!signature,
        tipo: typeof signature,
        longitud: signature ? signature.length : 0,
        esImagen: signature?.startsWith?.('data:image/')
      },
      firmaAUsar: {
        tiene: !!firmaAUsar,
        tipo: typeof firmaAUsar,
        longitud: firmaAUsar ? firmaAUsar.length : 0,
        esImagen: firmaAUsar?.startsWith?.('data:image/')
      }
    });
    
    // Validar la firma primero
    if (!validarFirma(firmaAUsar)) {
      console.error('Error: La firma no es válida o falta');
      return;
    }
    
    // Sincronizar la firma si es necesario
    const seSincronizo = await sincronizarFirma();
    if (seSincronizo) {
      // Volver a validar después de sincronizar
      const hayErrores = validarCamposRequeridos();
      if (hayErrores) {
        console.error('Error de validación después de sincronizar la firma');
        return;
      }
    }
    
    // Validar el resto de campos requeridos
    const hayErrores = validarCamposRequeridos();
    if (hayErrores) {
      console.error('Error de validación al enviar el formulario');
      return;
    }
    
    console.log('Todos los campos son válidos, procediendo con el envío...');
    

    
    // Validar documento único
    console.log('Validando documento:', {
      numero_documento: formData.numero_documento,
      modoEdicion,
      beneficiarioId,
      locationState: location.state
    });
    
    const esDocumentoValido = await validarDocumentoUnico(
      formData.numero_documento,
      modoEdicion ? (beneficiarioId || location.state?.beneficiario?.id) : null
    );
    
    
    if (!esDocumentoValido) {
      enqueueSnackbar("Por favor corrija el número de documento antes de continuar", { variant: "error" });
      return;
    }
    
    // Si hay correo electrónico, validarlo
    if (formData.correo_electronico) {
      const esCorreoValido = await validarCorreoUnico(
        formData.correo_electronico,
        modoEdicion ? beneficiarioId : null
      );
      if (!esCorreoValido) {
        enqueueSnackbar("Por favor corrija el correo electrónico antes de continuar", { variant: "error" });
        return;
      }
    }

    try {
      if (modoEdicion) {
        // Obtener el beneficiario actual para comparar
        const beneficiarioActual = location.state?.beneficiario;

        // Validaciones individuales para documento y correo
        if (
          formData.numero_documento !== beneficiarioActual?.numero_documento
        ) {
          const documentoValido = await validarDocumentoUnico(
            formData.numero_documento,
            beneficiarioId // Incluir el ID del beneficiario actual para excluirlo de la validación
          );
          if (!documentoValido) {
            enqueueSnackbar("Este número de documento ya está registrado en el sistema.", { variant: "error" });
            return; // Detener si el documento no es válido
          }
        }

        if (
          formData.correo_electronico !== beneficiarioActual?.correo_electronico
        ) {
          const correoValido = formData.correo_electronico
            ? await validarCorreoUnico(
                formData.correo_electronico,
                beneficiarioId // Incluir el ID del beneficiario actual para excluirlo de la validación
              )
            : true;

          if (!correoValido) {
            enqueueSnackbar("Este correo electrónico ya está registrado en el sistema.", { variant: "error" });
            return; // Detener si el correo no es válido
          }
        }

        // Preparar datos para actualización
        const datosParaEnviar = {
          // Datos del funcionario
          funcionario_id: user.id,
          funcionario_nombre: user.nombre,

          // Enviar el ID de línea de trabajo como linea_trabajo
          linea_trabajo: user.linea_trabajo,

          fecha_registro: formData.fecha_registro || new Date().toISOString(),

          // Datos personales
          nombre_completo: formData.nombre_completo,
          tipo_documento: formData.tipo_documento || "Cédula de ciudadanía",
          numero_documento: formData.numero_documento,
          genero: formData.genero || "Prefiere no decirlo",
          rango_edad: formData.rango_edad || "29-59",

          // Habilidades básicas
          sabe_leer: formData.sabe_leer !== undefined ? formData.sabe_leer : true,
          sabe_escribir: formData.sabe_escribir !== undefined ? formData.sabe_escribir : true,

          // Contacto
          numero_celular: formData.numero_celular || "",
          correo_electronico: formData.correo_electronico || "",

          // Datos socioculturales
          etnia: formData.etnia === "Otro" ? (formData.etniaPersonalizada || "Otra") : (formData.etnia || "Ninguna"),
          comuna: formData.comuna || "",
          barrio: formData.barrio === "otro" ? (formData.otroBarrio || "No especificado") : (formData.barrio || "No especificado"),
          barrio_lat: formData.barrio_lat || null,
          barrio_lng: formData.barrio_lng || null,

          // Discapacidad
          tiene_discapacidad:
            formData.tiene_discapacidad !== undefined
              ? formData.tiene_discapacidad
              : false,
          tipo_discapacidad: formData.tipo_discapacidad || "",
          nombre_cuidadora: formData.nombre_cuidadora || "",
          labora_cuidadora:
            formData.labora_cuidadora !== undefined
              ? formData.labora_cuidadora
              : false,

          // Conflicto armado
          victima_conflicto:
            formData.victima_conflicto !== undefined
              ? formData.victima_conflicto
              : false,

          // Familia
          hijos_a_cargo:
            formData.hijos_a_cargo !== undefined
              ? parseInt(formData.hijos_a_cargo, 10)
              : 0,

          // Datos educativos y laborales
          estudia_actualmente:
            formData.estudia_actualmente !== undefined
              ? formData.estudia_actualmente
              : false,
          nivel_educativo: formData.nivel_educativo || "Ninguno",
          situacion_laboral: formData.situacion_laboral || "Otro",
          tipo_vivienda: formData.tipo_vivienda || "Otra",

          // Ayuda Humanitaria
          ayuda_humanitaria:
            formData.ayuda_humanitaria !== undefined
              ? formData.ayuda_humanitaria
              : false,          descripcion_ayuda_humanitaria:
            formData.descripcion_ayuda_humanitaria || "",
            
          // Firma digital
          firma: formData.firma || null,
        };

        // Filtrar datos que realmente han cambiado
        const datosActualizacion = {};

        // Función para comparar valores
        const sonValoresIguales = (valorActual, valorNuevo) => {
          // Manejar casos especiales como booleanos y números
          if (
            typeof valorActual === "boolean" ||
            typeof valorNuevo === "boolean"
          ) {
            return Boolean(valorActual) === Boolean(valorNuevo);
          }
          if (
            typeof valorActual === "number" ||
            typeof valorNuevo === "number"
          ) {
            return Number(valorActual) === Number(valorNuevo);
          }
          // Para strings y otros tipos
          return (valorActual || "") === (valorNuevo || "");
        };

        // Manejar la firma de manera especial - asegurando que siempre se incluya si existe
        // Primero, determinar qué firma usar (nueva o existente)
        const firmaAIncluir = formData.firma || signature || (beneficiarioActual?.firma || null);
        
        console.log('Manejando firma en actualización:', {
          tieneFirmaEnFormData: !!formData.firma,
          tieneFirmaEnSignature: !!signature,
          tieneFirmaExistente: !!beneficiarioActual?.firma,
          firmaAIncluir: !!firmaAIncluir,
          tipo: typeof firmaAIncluir,
          longitud: firmaAIncluir ? firmaAIncluir.length : 0
        });
        
        // Siempre incluir la firma si existe en formData, signature o en el beneficiario actual
        if (firmaAIncluir) {
          console.log('Incluyendo firma en la actualización');
          datosActualizacion.firma = firmaAIncluir;
        } else if (beneficiarioActual?.firma) {
          console.log('Manteniendo firma existente');
          datosActualizacion.firma = beneficiarioActual.firma;
        } else {
          console.log('No hay firma para incluir');
          datosActualizacion.firma = null;
        }

        // Luego, manejar el resto de los campos
        Object.keys(datosParaEnviar).forEach((campo) => {
          // Ignorar campos específicos que no deben incluirse en la actualización
          const camposIgnorar = [
            "funcionario_id",
            "funcionario_nombre",
            "linea_trabajo",
            "fecha_registro",
            "firma" // Ya manejamos la firma por separado
          ];

          if (camposIgnorar.includes(campo)) return;

          // Si no hay beneficiario actual, agregar todos los campos
          if (!beneficiarioActual) {
            datosActualizacion[campo] = datosParaEnviar[campo];
            return;
          }

          // Para otros campos, comparar valores solo si son diferentes
          if (!sonValoresIguales(beneficiarioActual[campo], datosParaEnviar[campo])) {
            datosActualizacion[campo] = datosParaEnviar[campo];
          }
        });

        // Solo enviar si hay cambios
        if (Object.keys(datosActualizacion).length === 0) {
          enqueueSnackbar("No se detectaron cambios", { variant: "info" });
          return;
        }

        try {
          const respuesta = await actualizarBeneficiario(
            beneficiarioId,
            datosActualizacion
          );
          enqueueSnackbar("Beneficiario actualizado exitosamente", {
            variant: "success",
          });
          navigate("/funcionario/beneficiarios", {
            state: { beneficiarioActualizado: respuesta },
          });
        } catch (error) {
          // Manejar errores específicos de documento o correo
          if (error.campo === "numero_documento") {
            setErrores((prev) => ({
              ...prev,
              numero_documento: error.message,
            }));
          } else if (error.campo === "correo_electronico") {
            setErrores((prev) => ({
              ...prev,
              correo_electronico: error.message,
            }));
          } else {
            enqueueSnackbar("Error al actualizar beneficiario", {
              variant: "error",
            });
          }
        }
      } else {
        // Preparar datos para envío
        const datosParaEnviar = {
          // Datos del funcionario
          funcionario_id: user.id,
          funcionario_nombre: user.nombre,

          // Enviar el ID de línea de trabajo como linea_trabajo
          linea_trabajo: user.linea_trabajo,

          fecha_registro: new Date().toISOString(),

          // Datos personales
          nombre_completo: formData.nombre_completo,
          tipo_documento: formData.tipo_documento || "Cédula de ciudadanía",
          numero_documento: formData.numero_documento,
          genero: formData.genero || "Prefiere no decirlo",
          rango_edad: formData.rango_edad || "29-59",

          // Habilidades básicas
          sabe_leer: formData.sabe_leer !== undefined ? formData.sabe_leer : true,
          sabe_escribir: formData.sabe_escribir !== undefined ? formData.sabe_escribir : true,

          // Contacto
          numero_celular: formData.numero_celular || "",
          correo_electronico: formData.correo_electronico || "",

          // Datos socioculturales
          etnia: formData.etnia === "Otro" ? (formData.etniaPersonalizada || "Otra") : (formData.etnia || "Ninguna"),
          comuna: formData.comuna || "",
          barrio: formData.barrio === "otro" ? (formData.otroBarrio || "No especificado") : (formData.barrio || "No especificado"),
          barrio_lat: formData.barrio_lat || null,
          barrio_lng: formData.barrio_lng || null,

          // Discapacidad
          tiene_discapacidad:
            formData.tiene_discapacidad !== undefined
              ? formData.tiene_discapacidad
              : false,
          tipo_discapacidad: formData.tipo_discapacidad || "",
          nombre_cuidadora: formData.nombre_cuidadora || "",
          labora_cuidadora:
            formData.labora_cuidadora !== undefined
              ? formData.labora_cuidadora
              : false,

          // Conflicto armado
          victima_conflicto:
            formData.victima_conflicto !== undefined
              ? formData.victima_conflicto
              : false,

          // Familia
          hijos_a_cargo:
            formData.hijos_a_cargo !== undefined
              ? parseInt(formData.hijos_a_cargo, 10)
              : 0,

          // Datos educativos y laborales
          estudia_actualmente:
            formData.estudia_actualmente !== undefined
              ? formData.estudia_actualmente
              : false,
          nivel_educativo: formData.nivel_educativo || "Ninguno",
          situacion_laboral: formData.situacion_laboral || "Otro",
          tipo_vivienda: formData.tipo_vivienda || "Otra",

          // Ayuda Humanitaria
          ayuda_humanitaria:
            formData.ayuda_humanitaria !== undefined
              ? formData.ayuda_humanitaria
              : false,          descripcion_ayuda_humanitaria:
            formData.descripcion_ayuda_humanitaria || "",
            
          // Firma digital
          firma: formData.firma || null,
        };

        const respuesta = await crearBeneficiario(datosParaEnviar);

        enqueueSnackbar("Beneficiario registrado exitosamente", {
          variant: "success",
        });

        // Actualizar lista de beneficiarios
        const nuevosBeneficiarios = [
          ...beneficiarios,
          {
            nombre_completo: datosParaEnviar.nombre_completo,
            id: respuesta.beneficiario_id,
          },
        ];
        setBeneficiarios(nuevosBeneficiarios);

        // Limpiar formulario
        setFormData({
          ...VALORES_INICIALES, // Usar valores iniciales
          funcionario_id: user.id,
          funcionario_nombre: user.nombre,
          linea_trabajo: user.linea_trabajo,
          fecha_registro: new Date().toISOString().split("T")[0],
          // No limpiar la firma si se está en modo edición
          ...(modoEdicion ? { firma: formData.firma } : {})
        });

        // Limpiar errores
        setErrores({
          numero_documento: "",
          correo_electronico: "",
        });
      }
    } catch (error) {
      enqueueSnackbar("Error al guardar beneficiario", { variant: "error" });
    }
  };

  const handleFinalizarRegistro = () => {
    // Navegar a la lista de beneficiarios registrados
    navigate("/funcionario/beneficiarios");
  };

  useEffect(() => {
    const cargarComunas = async () => {
      try {
        const comunasObtenidas = await obtenerComunas();
        if (comunasObtenidas.length === 0) {
          enqueueSnackbar(
            "No se pudieron cargar las comunas. Intente nuevamente.",
            { variant: "warning" }
          );
        }
        setComunas(comunasObtenidas);
      } catch (error) {
        enqueueSnackbar("Error al cargar comunas. Verifique su conexión.", {
          variant: "error",
        });
      }
    };

    const cargarNombreLineaTrabajo = async () => {
      try {
        // Usar directamente el nombre de la línea de trabajo del usuario
        if (user.linea_trabajo) {
          // Obtener el nombre de la línea de trabajo
          setNombreLineaTrabajo(user.linea_trabajo_nombre);

          // Opcional: obtener el ID si es necesario
          try {
            const lineaTrabajoId =
              await lineaTrabajoService.obtenerNombreLineaTrabajo(
                user.linea_trabajo
              );
            setFormData((prevData) => ({
              ...prevData,
              linea_trabajo: lineaTrabajoId,
            }));
          } catch (idError) {
            console.warn(
              "No se pudo obtener el ID de la línea de trabajo:",
              idError
            );
          }
        }
      } catch (error) {
        console.error("Error al cargar línea de trabajo:", error);
      }
    };

    const verificarModoEdicion = async () => {
      const state = location.state || {};
      if (state.modoEdicion && state.beneficiario) {
        setModoEdicion(true);
        const beneficiario = state.beneficiario;
        setBeneficiarioId(beneficiario._id);

        // Determinar si el barrio es personalizado
        let barrio = beneficiario.barrio || "";
        let otroBarrio = "";
        
        // Si hay una comuna, verificar si el barrio está en la lista de barrios de la comuna
        if (beneficiario.comuna && beneficiario.comuna !== "Zonas Rurales") {
          const barriosComuna = obtenerBarriosPorComuna(beneficiario.comuna);
          const barrioEncontrado = barriosComuna.find(
            b => b.nombre.toLowerCase() === (barrio || '').toLowerCase().trim()
          );
          
          // Si el barrio no está en la lista de la comuna y no está vacío, es un barrio personalizado
          if (!barrioEncontrado && barrio && barrio !== "No especificado" && barrio !== "Zona Rural") {
            otroBarrio = barrio;
            barrio = "otro";
          }
        }

        // Mapear datos del beneficiario al formulario
        setFormData({
          // Datos del funcionario
          funcionario_id: user?.id || "",
          funcionario_nombre: user?.nombre || "",
          linea_trabajo: user?.linea_trabajo || "",
          fecha_registro: new Date().toISOString().split("T")[0],

          // Datos personales
          nombre_completo: beneficiario.nombre_completo || "",
          tipo_documento: beneficiario.tipo_documento || "Cédula",
          numero_documento: beneficiario.numero_documento || "",
          genero: beneficiario.genero || "Prefiero no decir",
          rango_edad: beneficiario.rango_edad || "26-35",

          // Habilidades básicas
          sabe_leer: beneficiario.sabe_leer !== undefined ? beneficiario.sabe_leer : false,
          sabe_escribir: beneficiario.sabe_escribir !== undefined ? beneficiario.sabe_escribir : false,

          // Contacto
          numero_celular: beneficiario.numero_celular || "",
          correo_electronico: beneficiario.correo_electronico || "",

          // Datos socioculturales
          etnia: beneficiario.etnia || "Ninguna",
          comuna: beneficiario.comuna || "",
          barrio: barrio,
          otroBarrio: otroBarrio,
          barrio_lat: beneficiario.barrio_lat || null,
          barrio_lng: beneficiario.barrio_lng || null,

          // Discapacidad
          tiene_discapacidad: beneficiario.tiene_discapacidad || false,
          tipo_discapacidad: beneficiario.tipo_discapacidad || "",
          nombre_cuidadora: beneficiario.nombre_cuidadora || "",
          labora_cuidadora: beneficiario.labora_cuidadora !== undefined ? beneficiario.labora_cuidadora : false,

          // Conflicto armado
          victima_conflicto: beneficiario.victima_conflicto || false,

          // Familia
          hijos_a_cargo: beneficiario.hijos_a_cargo || 0,

          // Datos educativos y laborales
          estudia_actualmente: beneficiario.estudia_actualmente || false,
          nivel_educativo: beneficiario.nivel_educativo || "Ninguno",
          situacion_laboral: beneficiario.situacion_laboral || "Otro",
          tipo_vivienda: beneficiario.tipo_vivienda || "Otra",

          // Ayuda humanitaria
          ayuda_humanitaria: beneficiario.ayuda_humanitaria || false,
          descripcion_ayuda_humanitaria: beneficiario.descripcion_ayuda_humanitaria || "",
        });
      }
    };

    cargarComunas();
    cargarNombreLineaTrabajo();
    verificarModoEdicion();
  }, [user, enqueueSnackbar, location.state]);

  // Validar documento único
  const validarDocumentoUnico = async (numero_documento, beneficiarioId = null) => {
    if (!numero_documento) {
      setErrores(prev => ({ ...prev, numero_documento: "El documento es requerido" }));
      setEstadoValidacion(prev => ({ ...prev, documento: false }));
      return false;
    }

    setValidando(prev => ({ ...prev, documento: true }));
    
    try {
      const { existe, msg } = await verificarDocumentoUnico(numero_documento, beneficiarioId);
      
      if (existe) {
        setErrores(prev => ({
          ...prev,
          numero_documento: msg || "Este documento ya está registrado en el sistema.",
        }));
        setEstadoValidacion(prev => ({ ...prev, documento: false }));
        return false;
      }
      
      setErrores(prev => ({
        ...prev,
        numero_documento: "",
      }));
      setEstadoValidacion(prev => ({ ...prev, documento: true }));
      return true;
      
    } catch (error) {
      console.error("Error al validar documento:", error);
      setErrores(prev => ({
        ...prev,
        numero_documento: "Error al validar el documento. Por favor, intente nuevamente.",
      }));
      setEstadoValidacion(prev => ({ ...prev, documento: false }));
      return false;
    } finally {
      setValidando(prev => ({ ...prev, documento: false }));
    }
  };

  // Validar correo único
  const validarCorreoUnico = async (correo_electronico, excluirId = null) => {
    // Si el campo está vacío, no mostrar error (es opcional)
    if (!correo_electronico) {
      setErrores(prev => ({ ...prev, correo_electronico: "" }));
      setEstadoValidacion(prev => ({ ...prev, correo: null }));
      return true;
    }

    // Validar formato de correo
    if (!EMAIL_REGEX.test(correo_electronico)) {
      setErrores(prev => ({
        ...prev,
        correo_electronico: "El formato del correo electrónico no es válido",
      }));
      setEstadoValidacion(prev => ({ ...prev, correo: false }));
      return false;
    }

    setValidando(prev => ({ ...prev, correo: true }));
    
    try {
      const { existe, msg } = await verificarCorreoUnico(correo_electronico, excluirId);
      
      if (existe) {
        setErrores(prev => ({
          ...prev,
          correo_electronico: msg || "Este correo electrónico ya está registrado en el sistema.",
        }));
        setEstadoValidacion(prev => ({ ...prev, correo: false }));
        return false;
      }
      
      setErrores(prev => ({
        ...prev,
        correo_electronico: "",
      }));
      setEstadoValidacion(prev => ({ ...prev, correo: true }));
      return true;
      
    } catch (error) {
      console.error("Error al validar correo:", error);
      setErrores(prev => ({
        ...prev,
        correo_electronico: "Error al validar el correo electrónico. Por favor, intente nuevamente.",
      }));
      setEstadoValidacion(prev => ({ ...prev, correo: false }));
      return false;
    } finally {
      setValidando(prev => ({ ...prev, correo: false }));
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Información del Funcionario */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nombre del Funcionario"
                value={formData.funcionario_nombre}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Línea de Trabajo"
                value={nombreLineaTrabajo}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} mb={2}>
              <TextField
                fullWidth
                label="Fecha de Registro"
                type="date"
                name="fecha_registro"
                value={formData.fecha_registro}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
          <Typography variant="h6" mb={2} gutterBottom>
            Datos de la persona
          </Typography>
          <Grid container spacing={3}>
            {/* Datos Personales */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre Completo *"
                name="nombre_completo"
                value={formData.nombre_completo || ''}
                onChange={handleChange}
                error={!!errores.nombre_completo}
                helperText={errores.nombre_completo}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.tipo_documento}>
                <InputLabel id="tipo-documento-label">Tipo de Documento *</InputLabel>
                <Select
                  name="tipo_documento"
                  value={formData.tipo_documento || ''}
                  labelId="tipo-documento-label"
                  label="Tipo de Documento *"
                  onChange={handleChange}
                  error={!!errores.tipo_documento}
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="numero_documento"
                type="tel"
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 20
                }}
                value={formData.numero_documento || ''}
                onChange={handleChange}
                onBlur={() => validarDocumentoUnico(formData.numero_documento)}
                required
                error={!!errores.numero_documento}
                helperText={errores.numero_documento || "Solo se permiten números"}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <>
                      {validando.documento && <CircularProgress size={20} />}
                      {estadoValidacion.documento === true && <CheckCircleIcon color="success" />}
                      {estadoValidacion.documento === false && <ErrorIcon color="error" />}
                    </>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.genero}>
                <InputLabel id="genero-label">Género *</InputLabel>
                <Select
                  name="genero"
                  value={formData.genero || ''}
                  labelId="genero-label"
                  label="Género *"
                  onChange={handleChange}
                  error={!!errores.genero}
                >
                  {GENEROS.map((genero) => (
                    <MenuItem key={genero} value={genero}>
                      {genero}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.rango_edad}>
                <InputLabel id="rango-edad-label">Rango de Edad *</InputLabel>
                <Select
                  name="rango_edad"
                  value={formData.rango_edad || ''}
                  labelId="rango-edad-label"
                  label="Rango de Edad *"
                  onChange={handleChange}
                  error={!!errores.rango_edad}
                >
                  {RANGOS_EDAD.map((rango) => (
                    <MenuItem key={rango} value={rango}>
                      {rango}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Habilidades Básicas */}
            <Grid item xs={12} sm={6}>
              <FormControl required error={!!errores.sabe_leer} component="fieldset" variant="standard">
                <FormLabel component="legend">¿Sabe leer?</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sabe_leer || false}
                        onChange={handleChange}
                        name="sabe_leer"
                      />
                    }
                    label={formData.sabe_leer ? "Sí" : "No"}

                    
                  />
                </FormGroup>
                {errores.sabe_leer && <FormHelperText error>{errores.sabe_leer}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required error={!!errores.sabe_escribir} component="fieldset" variant="standard">
                <FormLabel component="legend">¿Sabe escribir?</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sabe_escribir || false}
                        onChange={handleChange}
                        name="sabe_escribir"
                      />
                    }
                    label={formData.sabe_escribir ? "Sí" : "No"}
                  />
                </FormGroup>
                {errores.sabe_escribir && <FormHelperText error>{errores.sabe_escribir}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Contacto */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Celular *"
                name="numero_celular"
                value={formData.numero_celular || ''}
                onChange={handleChange}
                error={!!errores.numero_celular}
                helperText={errores.numero_celular}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="correo_electronico"
                type="email"
                value={formData.correo_electronico || ''}
                onChange={handleChange}
                onBlur={() => validarCorreoUnico(formData.correo_electronico)}
                error={!!errores.correo_electronico}
                helperText={errores.correo_electronico}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <>
                      {validando.correo && <CircularProgress size={20} />}
                      {estadoValidacion.correo === true && <CheckCircleIcon color="success" />}
                      {estadoValidacion.correo === false && <ErrorIcon color="error" />}
                    </>
                  ),
                }}
              />
            </Grid>

            {/* Datos Socioculturales */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.etnia}>
                <InputLabel id="etnia-label">Etnia *</InputLabel>
                <Select
                  name="etnia"
                  value={formData.etnia || ''}
                  labelId="etnia-label"
                  label="Etnia *"
                  onChange={handleChange}
                  error={!!errores.etnia}
                >
                  {ETNIAS.map((etnia) => (
                    <MenuItem key={etnia} value={etnia}>
                      {etnia}
                    </MenuItem>
                  ))}
                  <MenuItem value="Otro">Otro (especificar)</MenuItem>
                  <MenuItem value="Ninguna">Ninguna</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Campo para ingresar la etnia personalizada si se seleccionó "Otro" */}
            {formData.etnia === 'Otro' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Especifique la etnia"
                  name="etniaPersonalizada"
                  value={formData.etniaPersonalizada || ''}
                  onChange={handleChange}
                  error={!!errores.etniaPersonalizada}
                  helperText={errores.etniaPersonalizada}
                  required
                />
              </Grid>
            )}
            {/* Comuna */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.comuna}>
                <InputLabel id="comuna-label">Comuna *</InputLabel>
                <Select
                  name="comuna"
                  value={formData.comuna || ''}
                  labelId="comuna-label"
                  label="Comuna *"
                  onChange={(e) => {
                    // Si se selecciona Zonas Rurales, limpiar el barrio
                    if (e.target.value === 'Zonas Rurales') {
                      setFormData(prev => ({
                        ...prev,
                        comuna: e.target.value,
                        barrio: 'Zona Rural',
                        barrio_lat: null,
                        barrio_lng: null,
                        otroBarrio: ''
                      }));
                    } else {
                      handleChange(e);
                      // Si había un barrio de Zona Rural, limpiarlo
                      if (formData.comuna === 'Zonas Rurales') {
                        setFormData(prev => ({
                          ...prev,
                          barrio: '',
                          barrio_lat: null,
                          barrio_lng: null,
                          otroBarrio: ''
                        }));
                      }
                    }
                  }}
                  error={!!errores.comuna}
                >
                  <MenuItem value="">Seleccione una comuna o zona</MenuItem>
                  {comunas.map((comuna) => (
                    <MenuItem key={comuna.id} value={comuna.nombre}>
                      {comuna.nombre} - {comuna.zona}
                    </MenuItem>
                  ))}
                  <MenuItem value="Zonas Rurales">Zonas Rurales</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Barrio */}
            {formData.comuna === 'Zonas Rurales' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de la Vereda/Corregimiento *"
                  name="barrio"
                  value={formData.barrio || ''}
                  onChange={handleChange}
                  required
                  error={!!errores.barrio}
                  helperText={errores.barrio}
                />
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errores.barrio} disabled={!formData.comuna}>
                  <InputLabel id="barrio-label">Barrio *</InputLabel>
                  <Select
                    name="barrio"
                    value={formData.barrio || ''}
                    labelId="barrio-label"
                    label="Barrio *"
                    onChange={handleChange}
                    error={!!errores.barrio}
                  >
                    <MenuItem value="">Seleccione un barrio</MenuItem>
                    {barriosDisponibles.map((barrio, idx) => (
                      <MenuItem key={idx} value={barrio.nombre}>
                        {barrio.nombre}
                      </MenuItem>
                    ))}
                    <MenuItem value="otro">Otro (especificar)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Campo para ingresar el nombre del barrio manualmente si se eligió "otro" o es un barrio personalizado */}
            {(formData.barrio === "otro" || (formData.otroBarrio && formData.otroBarrio !== "")) && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={formData.comuna === 'Zonas Rurales' ? 'Nombre de la Vereda/Corregimiento *' : 'Especifique el Barrio *'}
                  name="otroBarrio"
                  value={formData.otroBarrio || ""}
                  onChange={handleChange}
                  required
                  error={!!errores.otroBarrio}
                  helperText={errores.otroBarrio || (formData.barrio === "otro" ? "Por favor ingrese el nombre del barrio" : "")}
                />
              </Grid>
            )}

            {/* Discapacidad */}
            <Grid item xs={12} sm={6}>
              <FormControl required error={!!errores.tiene_discapacidad} component="fieldset" variant="standard">
                <FormLabel component="legend">¿Tiene alguna discapacidad? *</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.tiene_discapacidad || false}
                        onChange={handleChange}
                        name="tiene_discapacidad"
                      />
                    }
                    label={formData.tiene_discapacidad ? "Sí" : "No"}
                  />
                </FormGroup>
                {errores.tiene_discapacidad && <FormHelperText error>{errores.tiene_discapacidad}</FormHelperText>}
              </FormControl>
              {formData.tiene_discapacidad && (
                <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                  <Grid item xs={12} sm={12}>
                    <FormControl fullWidth error={!!errores.tipo_discapacidad} disabled={!formData.tiene_discapacidad} required={formData.tiene_discapacidad}>
                      <InputLabel id="tipo-discapacidad-label">Tipo de Discapacidad {formData.tiene_discapacidad ? '*' : ''}</InputLabel>
                      <Select
                        name="tipo_discapacidad"
                        value={formData.tipo_discapacidad || ''}
                        labelId="tipo-discapacidad-label"
                        label="Tipo de Discapacidad"
                        onChange={handleChange}
                        error={!!errores.tipo_discapacidad}
                      >
                        {TIPOS_DISCAPACIDAD.map((tipo) => (
                          <MenuItem key={tipo} value={tipo}>
                            {tipo}
                          </MenuItem>
                        ))}
                      </Select>
                      {errores.tipo_discapacidad && (
                        <FormHelperText error>{errores.tipo_discapacidad}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <TextField
                      fullWidth
                      label="Nombre de la Cuidadora"
                      name="nombre_cuidadora"
                      value={formData.nombre_cuidadora}
                      onChange={handleChange}
                      sx={{ minWidth: 0 }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          name="labora_cuidadora"
                          checked={!!formData.labora_cuidadora}
                          onChange={handleChange}
                        />
                      }
                      label="¿Labora la Cuidadora?"
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            {/* Conflicto Armado */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">¿Es víctima del conflicto armado? (Opcional)</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.victima_conflicto || false}
                        onChange={handleChange}
                        name="victima_conflicto"
                      />
                    }
                    label={formData.victima_conflicto ? "Sí" : "No"}
                  />
                </FormGroup>
              </FormControl>
            </Grid>

            {/* Familia */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hijos a Cargo *"
                name="hijos_a_cargo"
                type="number"
                value={formData.hijos_a_cargo || 0}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                error={!!errores.hijos_a_cargo}
                helperText={errores.hijos_a_cargo}
                required
              />
            </Grid>

            {/* Datos Educativos y Laborales */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">¿Estudia actualmente? (Opcional)</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.estudia_actualmente || false}
                        onChange={handleChange}
                        name="estudia_actualmente"
                      />
                    }
                    label={formData.estudia_actualmente ? "Sí" : "No"}
                  />
                </FormGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.nivel_educativo}>
                <InputLabel id="nivel-educativo-label">Nivel Educativo *</InputLabel>
                <Select
                  name="nivel_educativo"
                  value={formData.nivel_educativo || ''}
                  labelId="nivel-educativo-label"
                  label="Nivel Educativo *"
                  onChange={handleChange}
                  error={!!errores.nivel_educativo}
                >
                  {NIVELES_EDUCATIVOS.map((nivel) => (
                    <MenuItem key={nivel} value={nivel}>
                      {nivel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.situacion_laboral}>
                <InputLabel id="situacion-laboral-label">Situación Laboral *</InputLabel>
                <Select
                  name="situacion_laboral"
                  value={formData.situacion_laboral || ''}
                  labelId="situacion-laboral-label"
                  label="Situación Laboral *"
                  onChange={handleChange}
                  error={!!errores.situacion_laboral}
                >
                  {SITUACIONES_LABORALES.map((situacion) => (
                    <MenuItem key={situacion} value={situacion}>
                      {situacion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.tipo_vivienda}>
                <InputLabel id="tipo-vivienda-label">Tipo de Vivienda *</InputLabel>
                <Select
                  name="tipo_vivienda"
                  value={formData.tipo_vivienda || ''}
                  labelId="tipo-vivienda-label"
                  label="Tipo de Vivienda *"
                  onChange={handleChange}
                  error={!!errores.tipo_vivienda}
                >
                  {TIPOS_VIVIENDA.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Ayuda Humanitaria */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">¿Recibe ayuda humanitaria? (Opcional)</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.ayuda_humanitaria || false}
                        onChange={handleChange}
                        name="ayuda_humanitaria"
                      />
                    }
                    label={formData.ayuda_humanitaria ? "Sí" : "No"}
                  />
                </FormGroup>
              </FormControl>
              {formData.ayuda_humanitaria && (
                <TextField
                  fullWidth
                  label="Descripción de la Ayuda Humanitaria"
                  name="descripcion_ayuda_humanitaria"
                  value={formData.descripcion_ayuda_humanitaria}
                  onChange={handleChange}
                />
              )}
            </Grid>

            {/* Sección de Firma */}
            <Grid item xs={12} sx={{ mt: 4, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Firma del Beneficiario
              </Typography>
              <Button
                variant="outlined"
                onClick={handleOpenFirmaDialog}
                startIcon={<EditIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {signature ? 'Editar Firma' : 'Agregar Firma'}
              </Button>
              {signature && (
                <Box
                  component="img"
                  src={signature}
                  alt="Firma del beneficiario"
                  sx={{
                    mt: 2,
                    maxHeight: 100,
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '8px',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              )}
            </Grid>

            {/* Botones de Acción */}
            <Grid item xs={12} container spacing={2}>
              <Grid item xs={6}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                >
                  {modoEdicion ? "Actualizar Persona" : "Guardar Registro"}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={handleFinalizarRegistro}
                >
                  Finalizar Registro
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </form>

        {/* Diálogo de Firma */}
        <Dialog 
          open={openFirmaDialog} 
          onClose={handleCloseFirmaDialog}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            style: {
              minHeight: isMobile ? '100vh' : '80vh',
              maxHeight: isMobile ? '100vh' : '90vh',
              width: '100%',
              maxWidth: '800px',
              margin: isMobile ? 0 : '16px',
              borderRadius: isMobile ? 0 : '4px'
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            '@media (max-width: 600px)': {
              textAlign: 'center',
              padding: '16px'
            }
          }}>
            <Typography variant="h6">
              {isMobile ? 'Firme en la pantalla' : 'Firma del Beneficiario'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            '@media (max-width: 600px)': {
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }
          }}>
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                '@media (max-width: 600px)': {
                  padding: '8px',
                  height: 'auto',
                  minHeight: isMobile && orientation === 'portrait' ? '40vh' : '60vh'
                }
              }}
            >
              {isMobile && orientation === 'portrait' && (
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  align="center" 
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Para una mejor experiencia, gire su dispositivo a modo horizontal
                </Typography>
              )}
              
              <Box 
                sx={{
                  flex: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  height: isMobile ? (orientation === 'portrait' ? '40vh' : '60vh') : '400px',
                  '@media (max-width: 600px)': {
                    height: isMobile && orientation === 'portrait' ? '35vh' : '50vh'
                  }
                }}
              >
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#000"
                  onEnd={handleCanvasEnd}
                  onBegin={() => setIsCanvasEmpty(false)}
                  backgroundColor="rgba(255, 255, 255, 0.8)"
                  velocityFilterWeight={0.7}
                  minWidth={1.5}
                  maxWidth={2.5}
                  dotSize={1}
                  throttle={16}
                  canvasProps={{
                    className: 'signature-canvas',
                    style: {
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      touchAction: 'none'
                    }
                  }}
                />
              </Box>
              
              <Box 
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                  gap: '8px',
                  '@media (max-width: 600px)': {
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'space-around',
                    gap: '8px',
                    marginTop: '12px'
                  }
                }}
              >
                <Button
                  startIcon={<ClearIcon />}
                  onClick={handleClearFirma}
                  color="error"
                  size={isMobile ? 'small' : 'medium'}
                  variant="outlined"
                >
                  Limpiar
                </Button>
                <Box>
                  <Button
                    startIcon={<CloseIcon />}
                    onClick={handleCloseFirmaDialog}
                    size={isMobile ? 'small' : 'medium'}
                    variant="outlined"
                    sx={{ mr: 1 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={handleSaveFirma}
                    variant="contained"
                    color="primary"
                    disabled={isCanvasEmpty}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ 
                      opacity: isCanvasEmpty ? 0.7 : 1,
                      '@media (max-width: 600px)': {
                        minWidth: '120px'
                      }
                    }}
                  >
                    Guardar
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Lista de Beneficiarios Registrados */}
        {beneficiarios.length > 0 && (
          <Paper elevation={2} sx={{ mt: 4, p: 2 }}>
            <Typography variant="h6">Habitantes Registrados</Typography>
            {beneficiarios.map((beneficiario, index) => (
              <Typography key={index} variant="body2">
                {beneficiario.nombre_completo}
              </Typography>
            ))}
          </Paper>
        )}
      </Paper>
    </Container>
  );
}
