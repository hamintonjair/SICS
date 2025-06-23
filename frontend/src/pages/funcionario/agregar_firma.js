const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'RegistroBeneficiarios.js');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Patrón para encontrar el cierre del objeto datosParaEnviar
const patronCierreObjeto = /\s*descripcion_ayuda_humanitaria:\s*formData\.descripcion_ayuda_humanitaria \|\| "",[\s\S]*?\};/g;

// Reemplazar con el nuevo contenido que incluye el campo firma
const nuevoContenido = content.replace(patronCierreObjeto, 
  `          descripcion_ayuda_humanitaria:
            formData.descripcion_ayuda_humanitaria || "",
            
          // Firma digital
          firma: formData.firma || null,
        };`
);

// Escribir el archivo de nuevo
fs.writeFileSync(filePath, nuevoContenido, 'utf8');

console.log('Campo de firma digital agregado exitosamente al objeto datosParaEnviar');
