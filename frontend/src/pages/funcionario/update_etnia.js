const fs = require('fs');
const path = require('path');

// Ruta al archivo que queremos modificar
const filePath = path.join(__dirname, 'RegistroBeneficiarios.js');

// Leer el contenido del archivo
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  // Realizar los reemplazos necesarios
  // Primera ubicación (línea ~792)
  let newData = data.replace(
    /etnia: formData\.etnia \|\| "Ninguna",/g,
    'etnia: formData.etnia === "Otro" ? (formData.etniaPersonalizada || "Otra") : (formData.etnia || "Ninguna"),'
  );

  // Segunda ubicación (línea ~962)
  newData = newData.replace(
    /etnia: formData\.etnia \|\| "Ninguna",/g,
    'etnia: formData.etnia === "Otro" ? (formData.etniaPersonalizada || "Otra") : (formData.etnia || "Ninguna"),'
  );

  // Escribir los cambios de vuelta al archivo
  fs.writeFile(filePath, newData, 'utf8', (err) => {
    if (err) {
      console.error('Error al escribir en el archivo:', err);
      return;
    }
    console.log('Archivo actualizado exitosamente');
  });
});
