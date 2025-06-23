# Red de Inclusión Frontend

## Descripción
Este frontend está construido con React y Material-UI. Permite la gestión de beneficiarios, funcionarios, reportes y exportación de datos a Excel. Se integra con el backend mediante JWT para autenticación y autorización. Ahora incluye funcionalidad de captura de huellas dactilares mediante WebAuthn para verificación biométrica de beneficiarios.

## Instalación de dependencias

```bash
npm install
```

## Variables de entorno
Crea un archivo `.env` en la raíz del frontend con el siguiente contenido (ajusta la URL si tu backend está en otro host o puerto):

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_TOKEN_KEY=red_inclusion_token
```

## Levantar el frontend

```bash
npm start
```

## Funcionalidades principales
- Autenticación de usuarios con JWT
- Gestión de beneficiarios y funcionarios
- Captura de huellas dactilares para verificación biométrica de beneficiarios
- Exportación de listados y reportes a Excel (con filtro por rango de fechas)
- Visualización de estadísticas y dashboard
- Protección de rutas según rol

## Requisitos
- Node.js 16+
- Tener el backend corriendo y accesible
- Para la funcionalidad biométrica: navegador compatible con WebAuthn (Chrome, Firefox, Edge, Safari recientes) y dispositivo con capacidad de autenticación biométrica (sensor de huella, FaceID, etc.)

---

## Notas
- Si tienes problemas con CORS, asegúrate de que el backend permita solicitudes desde el origen del frontend.
- Para exportar beneficiarios por rango de fechas, asegúrate de que los registros en la base de datos tengan el campo `fecha_registro` en formato fecha o string ISO.
- La funcionalidad biométrica requiere HTTPS en producción (WebAuthn solo funciona en contextos seguros, excepto en localhost para desarrollo).
- En dispositivos móviles, la experiencia puede variar según el dispositivo y navegador. Se recomienda usar navegadores actualizados.
