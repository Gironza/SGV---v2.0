# SGV — Sistema de Gestión de Votaciones

Sistema de gestión electoral para instituciones educativas. Proyecto académico desarrollado por Laura Melo, Santiago Peña, Sandy Suaza y Suset Redondo, basado en el SRS v2.0 (82 requisitos funcionales).

## Arquitectura

- **Backend:** FastAPI (API REST pura, JSON) + PostgreSQL (psycopg2)
- **Frontend:** React + Vite (SPA desacoplada, sin Jinja2)
- **Autenticación:** JWT (python-jose), sin cookies de sesión — evita problemas de CORS entre orígenes distintos
- **Comunicación:** CORS habilitado entre `http://localhost:5173` (Vite) y `http://127.0.0.1:8000` (FastAPI)

## Roles del sistema

| id_rol | Rol | Acceso |
|---|---|---|
| 1 | Administrador | Gestión de elecciones (crear, editar, cambiar estado, eliminar) |
| 2 | Docente | Solo lectura de elecciones (veedor) |
| 3 | Estudiante | Ver elecciones, postularse como candidato, votar, ver resultados |
| — | Candidato | No es un rol propio: es un Estudiante inscrito en una elección vía `POST /candidatos` |

Solo Administrador y Docente se registran manualmente (`POST /auth/registro`), derivando su rol del `codigo_institucion` ingresado. El Estudiante ingresa al sistema por carga masiva (pendiente de implementar).

## Estructura del backend

```
backend/app/
├── main.py                    # FastAPI app, CORS, registro de routers
├── config/database.py         # Conexión psycopg2 (clase Database)
├── controllers/                # Lógica de negocio (dict success/message)
├── models/                     # Clases con guardar() y queries estáticas
├── schemas/                    # Pydantic por módulo
├── routes/                     # Un APIRouter por módulo
├── middleware/auth_middleware.py  # obtener_usuario_actual, requerir_rol
└── utils/                      # security.py (bcrypt), jwt_handler.py
```

### Módulos implementados

| Módulo | Estado | Endpoints |
|---|---|---|
| Auth | ✅ Completo | `POST /auth/login`, `POST /auth/registro` |
| Elecciones | ✅ Completo | `GET/POST /elecciones`, `GET/PUT/DELETE /elecciones/{id}`, `PATCH /elecciones/{id}/estado` |
| Candidatos | ✅ Completo | `POST /candidatos`, `GET /candidatos/eleccion/{id}`, `DELETE /candidatos/{id}` |
| Votación | ✅ Completo | `GET /votacion/{id}/candidatos`, `GET /votacion/{id}/estado`, `POST /votacion/votar` |
| Resultados | ✅ Completo | `GET /resultados/{id_eleccion}` |
| Usuarios | ⏳ Pendiente | Sin endpoints aún (carga masiva, gestión de usuarios) |
| Instituciones | ⏳ Pendiente | Solo `Institucion.buscar_por_codigo()` interno para registro |

## Estructura del frontend

```
src/
├── main.tsx                   # Envuelve <App> con <AuthProvider>
├── App.tsx                    # Rutas + RutaProtegida por id_rol
├── context/AuthContext.tsx    # Sesión global (usuario, login, logout)
├── services/
│   ├── api.ts                 # Instancia axios + interceptores JWT/401
│   ├── auth.service.ts
│   ├── eleccion.service.ts
│   ├── candidato.service.ts
│   ├── voto.service.ts
│   └── resultado.service.ts
├── routes/RutaProtegida.tsx   # Protección por autenticación + rol
└── pages/
    ├── inicio.tsx             # Landing pública
    ├── Login.tsx              # Conectado a /auth/login, redirige por rol
    ├── Registro.tsx           # Conectado a /auth/registro (solo Admin/Docente)
    ├── Admin.tsx               # Elecciones reales + crear elección
    ├── Docente.tsx             # Elecciones reales (solo lectura)
    └── Estudiante.tsx          # Ver elecciones, postularse, votar, resultados
```

## Flujo end-to-end probado

1. Registro (Admin/Docente) → sin auto-login, redirige a `/login`
2. Login → JWT guardado en `localStorage`, redirige según `id_rol`
3. Admin crea una elección
4. Estudiante se postula como candidato (`Postularme` / `Retirar candidatura`)
5. Estudiante vota (único voto por elección, o voto en blanco) → recibe código de certificado
6. Estudiante consulta resultados (conteo por candidato, blancos, ganador)

## Cómo correr el proyecto

**Backend** (desde `backend/`):
```bash
python -m uvicorn app.main:app --reload
```

**Frontend** (desde la raíz del proyecto React):
```bash
npm run dev
```
Abrir en `http://localhost:5173` (no `127.0.0.1`, por la configuración exacta de CORS).

## Pendiente / fuera de alcance del MVP actual

- 🔴 **Brecha de seguridad activa:** verificar si existen rutas de panel adicionales sin protección de token/rol más allá de las ya cubiertas por `RutaProtegida`.
- Módulo de Usuarios e Instituciones (gestión, carga masiva de estudiantes vía Excel/CSV — RF-012)
- Rotación de códigos institucionales vía APScheduler
- Persistencia de "mis candidaturas" en el Estudiante (actualmente solo en memoria de sesión del navegador; falta endpoint `GET /candidatos/mis-postulaciones`)
- Widgets estáticos sin funcionalidad en Admin/Docente (contador de usuarios, gráficas de participación, carga masiva) — descartados del alcance de este MVP
- Notificaciones, reimpresión de certificados, exportación de resultados a PDF/Excel, panel de resultados en tiempo real, calendario `.ics`

## Decisiones de diseño clave

- `VOTO` es anónimo (sin `id_usuario`); `REGISTRO_VOTACION` controla que no se vote dos veces (`UNIQUE(id_usuario, id_eleccion)`)
- `numero_votos` no se almacena — se calcula con `COUNT()` sobre `VOTO`
- Nombres de columnas reales en PostgreSQL difieren del diagrama MR en varios casos (ej. `roles.nombre`, `elecciones.titulo`, `candidatos.propuesta`) — el DDL real es la fuente de verdad, no el `.drawio`
