# SETUP.md — Instalar SGV en un computador nuevo desde cero

Guía paso a paso asumiendo que el computador **no tiene nada instalado** (ni Python, ni Node, ni PostgreSQL).

---

## 1. Requisitos previos a instalar

| Herramienta | Versión recomendada | Verificar con |
|---|---|---|
| Python | 3.11 o 3.12 | `python --version` |
| Node.js | 18 o superior | `node --version` |
| PostgreSQL | 14 o superior | `psql --version` |
| Git | cualquiera reciente | `git --version` |

Si falta alguno, instálalo antes de seguir. En Windows, al instalar Python **marca la casilla "Add Python to PATH"**.

---

## 2. Clonar el proyecto

```bash
git clone <URL_DEL_REPO>
cd SGV
```

---

## 3. Backend — PostgreSQL

### 3.1 Crear la base de datos

Abre pgAdmin o la terminal `psql` y crea la base **exactamente con este nombre** (mayúsculas, es case-sensitive):

```sql
CREATE DATABASE "SGV";
```

### 3.2 Ejecutar el script de creación de tablas

Corre el/los archivo(s) `.sql` de `schema/` (y `seeds/` si tienes datos iniciales como `tipos_documento` o `roles`) contra la base `SGV` recién creada. Esto crea las 9 tablas: `instituciones`, `roles`, `tipos_documento`, `estados_eleccion`, `usuarios`, `elecciones`, `candidatos`, `votos`, `registros_votacion`.

⚠️ Si no tienes el/los `.sql`, avísame y te los genero.

---

## 4. Backend — Python

### 4.1 Ir a la carpeta del backend

```bash
cd backend
```

### 4.2 Crear y activar el entorno virtual

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
Si da error de permisos de ejecución de scripts, corre una vez (como administrador):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Sabes que quedó activado porque el prompt de la terminal muestra `(venv)` al inicio.

### 4.3 Instalar dependencias

Si existe `requirements.txt`:
```bash
pip install -r requirements.txt
```

Si no existe, instala manualmente (⚠️ el orden y las versiones fijadas son importantes, ya causaron bugs antes):
```bash
pip install fastapi uvicorn psycopg2-binary python-dotenv
pip install "passlib[bcrypt]" bcrypt==4.0.1
pip install python-jose
pip install "pydantic[email]"
```

**Por qué `bcrypt==4.0.1` fijo:** versiones más nuevas de `bcrypt` rompen `passlib` con el error `module 'bcrypt' has no attribute '__about__'`, y eso a su vez genera falsos errores de "password cannot be longer than 72 bytes" aunque la contraseña sea corta. No lo actualices.

### 4.4 Configurar el archivo `.env`

Este es el paso que preguntaste — aquí está completo:

1. Dentro de `backend/app/`, copia `.env.example` y renómbralo a `.env`.
2. Ábrelo y llena cada variable:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SGV
DB_USER=postgres
DB_PASSWORD=tu_password_real_de_postgres
JWT_SECRET_KEY=una_clave_larga_y_secreta
```

3. Para generar el `JWT_SECRET_KEY`, corre esto una vez en Python (puede ser distinto en cada máquina, no pasa nada):
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Copia el resultado y pégalo como valor de `JWT_SECRET_KEY`.

**Ubicación exacta del `.env`:** debe quedar en `backend/app/.env` (junto a `main.py`), NO en la raíz del proyecto ni en `backend/`. El código calcula la ruta con `os.path.dirname(os.path.dirname(os.path.abspath(__file__)))` para encontrarlo sin importar desde dónde corras `uvicorn`, pero el archivo físico tiene que estar ahí.

4. **Nunca subas este `.env` a git** — ya está en `.gitignore`. Lo que sí subes es `.env.example` (sin datos reales), para que el resto del equipo sepa qué variables necesita.

### 4.5 Correr el backend

Desde `backend/` (no desde `backend/app/`):
```bash
python -m uvicorn app.main:app --reload
```

Debe mostrar algo como `Uvicorn running on http://127.0.0.1:8000`. Prueba en el navegador: `http://127.0.0.1:8000/` → debe responder `{"mensaje": " SGV API activa"}`.

Si sale `no password supplied` o error de conexión: revisa que el `.env` esté en la ruta correcta y que PostgreSQL esté corriendo.

---

## 5. Frontend — React/Vite

### 5.1 Ir a la carpeta del frontend

```bash
cd ../  # o la ruta donde esté el proyecto React (ej. sgva-react)
```

### 5.2 Instalar dependencias

```bash
npm install
npm install axios
```

### 5.3 Correr el frontend

```bash
npm run dev
```

Abre el navegador en **`http://localhost:5173`** (no `127.0.0.1:5173` — el backend tiene CORS configurado con el origen exacto `http://localhost:5173`, y por CORS ambos no son intercambiables).

---

## 6. Verificación rápida de que todo quedó bien

1. Backend corriendo en `http://127.0.0.1:8000` sin errores en consola.
2. Frontend corriendo en `http://localhost:5173`.
3. Ir a `/registro`, crear un Admin o Docente con un código de institución válido → debe mostrar mensaje de éxito y redirigir a `/login`.
4. Loguearse → debe redirigir al panel correspondiente según el rol.

Si algo falla, revisa en este orden: ¿PostgreSQL prendido? ¿`.env` en la ruta correcta con los datos correctos? ¿Backend corriendo antes que el frontend? ¿Navegador abierto en `localhost` y no `127.0.0.1`?
