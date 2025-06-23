# Red de Inclusión Backend

## Descripción
Este backend está construido con Flask y utiliza JWT (JSON Web Tokens) para autenticación y autorización de usuarios. Incluye integración con MongoDB, manejo de CORS y soporte para verificación biométrica (huellas dactilares) mediante WebAuthn.

## Dependencias principales
- flask
- flask-cors
- flask-jwt-extended
- pymongo
- python-dotenv

## Variables de entorno (.env)
Asegúrate de definir las siguientes variables en un archivo `.env` en la raíz del backend:

```
FLASK_APP=app
FLASK_ENV=production # o development
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET_KEY=tu_clave_secreta_jwt
```

## Autenticación y Sesión
- El backend utiliza JWT para proteger las rutas. Los tokens se generan al iniciar sesión y deben enviarse en el header `Authorization`.
- Cuando el token expira, el frontend detecta la expiración y redirige automáticamente al login.

## Levantar el backend

Instala las dependencias y ejecuta el servidor:

```bash
pip install -r requirements.txt
python run.py
```

## Verificación Biométrica

El backend ahora soporta el registro y almacenamiento de datos biométricos (huellas dactilares) para los beneficiarios utilizando el estándar WebAuthn.

### Estructura de datos biométricos:
- Los datos de huella dactilar se almacenan en el campo `huella_dactilar` del documento del beneficiario.
- La estructura básica es: `{ "id": "credential_id_en_base64url" }`
- Este ID se utiliza posteriormente para la verificación de identidad del beneficiario.

### Modelo de datos:
- Se ha actualizado el esquema `BeneficiarioSchema` para incluir el campo `huella_dactilar`.
- El campo es opcional (`required=False`) para permitir el registro de beneficiarios sin datos biométricos.

## Exportación de beneficiarios por rango de fechas

El backend permite exportar beneficiarios filtrando por un rango de fechas (`fecha_inicio` y `fecha_fin`). El filtro es robusto y funciona tanto si el campo `fecha_registro` es de tipo fecha (`Date`) como si es string en formato `YYYY-MM-DD` o ISO (`YYYY-MM-DDTHH:mm:ssZ`).

### Requisitos para la exportación por rango:
- El campo `fecha_registro` debe estar en formato fecha (`Date`) o string ISO. Si tienes datos antiguos como string, el backend los soporta, pero se recomienda migrar a tipo fecha para mayor eficiencia.
- El frontend debe enviar los parámetros `fecha_inicio` y `fecha_fin` en formato `YYYY-MM-DD`.

### Ejemplo de endpoint:
```
GET /beneficiarios/listar?pagina=1&por_pagina=1000000&fecha_inicio=2025-04-01&fecha_fin=2025-04-16
```

## Frontend
El frontend está construido en React. Consulta el README del frontend para instrucciones de instalación y variables de entorno.

REACT_APP_JWT_SECRET=red_inclusion_secret_2024
REACT_APP_TOKEN_KEY=red_inclusion_token
REACT_APP_API_URL=http://localhost:5000

## Instalación de dependencias del frontend
cd frontend
npm install

## Levantar el frontend
npm start

## Flujo de autenticación
1. El usuario inicia sesión y recibe un JWT.
2. El JWT se almacena en el navegador.
3. Cada petición protegida envía el JWT en el header.
4. Si el JWT expira, el usuario es redirigido al login automáticamente.

---

## Requisitos
- Python 3.9+
- MongoDB (local o Atlas)

## Notas adicionales
- Si tienes problemas con la exportación por rango, revisa que los datos de `fecha_registro` estén en el formato adecuado.
- El backend soporta ambos formatos (fecha y string ISO) para máxima compatibilidad.

## Instalación

1. Clona el repositorio y entra en la carpeta `backend`:
   ```bash
   git clone <repo_url>
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Crea un archivo `.env` con la configuración de tu base de datos y JWT:
   ```env
   MONGO_URI=mongodb://localhost:27017/red_inclusion
   JWT_SECRET_KEY=tu_clave_secreta
   FLASK_ENV=development
   ```
4. Ejecuta el servidor:
   ```bash
   python run.py
   ```

## Estructura principal
- `app/` - Código fuente principal (modelos, rutas, esquemas, utilidades)
- `tests/` - Pruebas unitarias
- `requirements.txt` - Dependencias del backend
- `run.py` - Script de arranque

## Endpoints principales
- `/auth` - Autenticación y registro
- `/usuarios` - Gestión de usuarios y funcionarios
- `/beneficiarios` - Gestión de beneficiarios
- `/asignaciones` - Asignación de beneficiarios a líneas de trabajo
- `/reportes` - Generación de reportes y exportación
- `/dashboard` - Estadísticas y gráficos

## Dependencias principales
- Flask
- Flask-JWT-Extended
- flask-cors
- pymongo
- python-dotenv
- marshmallow
- bcrypt
- pandas (solo para reportes y dashboard)
- matplotlib (solo para dashboard)
- reportlab (solo para reportes PDF)
- **MongoDB** (base de datos principal)

## Notas
- Si no necesitas reportes ni dashboard, puedes omitir `pandas`, `matplotlib` y `reportlab`.
- El archivo `.env` es obligatorio para la configuración local.

---

## Licencia
MIT
