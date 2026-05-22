# 🎓 Salón de Estudio Colaborativo — Frontend

Aplicación web desarrollada en **React + TypeScript + Vite** que permite a los usuarios registrarse con Google, gestionar su perfil y crear/unirse a salas de estudio colaborativas en tiempo real.

## 🚀 Tecnologías

| Herramienta | Uso |
|---|---|
| React 19 + TypeScript | Framework principal |
| Vite | Bundler / Dev Server |
| React Router DOM | Navegación entre páginas |
| Firebase SDK (cliente) | Autenticación con Google |
| Socket.io Client | Conexión en tiempo real |
| ESLint + jsx-a11y | Calidad de código y accesibilidad |

## 📁 Estructura del Proyecto

```
src/
├── pages/
│   ├── LandingPage.tsx        # Página de inicio
│   ├── LoginPage.tsx          # Login con email/password y Google
│   ├── RegisterPage.tsx       # Registro de cuenta
│   ├── ChooseUsernamePage.tsx # Selección de username post-login
│   ├── DashboardPage.tsx      # Lista de salas del usuario
│   ├── CreateRoomPage.tsx     # Crear nueva sala de estudio
│   ├── ProfilePage.tsx        # Ver / Editar / Eliminar perfil
│   └── RoomPage.tsx           # Sala de estudio en tiempo real
├── services/
│   ├── authService.ts         # Login, logout, Google Auth
│   ├── userService.ts         # CRUD de perfil (API)
│   └── roomService.ts         # Crear y listar salas (API)
├── context/                   # Contextos de React (Auth)
├── hooks/                     # Custom hooks
└── router/                    # Definición de rutas
```

## ⚙️ Variables de Entorno

Crea un archivo `.env.local` en la raíz con las siguientes variables:

```env
VITE_BACKEND_MAIN_URL=http://localhost:4000
VITE_BACKEND_REALTIME_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 🏃 Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Verificar lint (accesibilidad + TypeScript)
npm run lint

# Compilar para producción
npm run build
```

El servidor de desarrollo estará disponible en `http://localhost:5173`.

## 🌐 Despliegue en Render

El proyecto incluye `render.yaml` para despliegue automático como **Static Site** en [Render.com](https://render.com).

## 🔗 APIs Relacionadas

- **Backend Principal (REST):** Ver documentación en `salon-backend-main` → Swagger en `/api-docs`
- **Backend Realtime (WebSocket):** Ver documentación en `salon-backend-realtime`
