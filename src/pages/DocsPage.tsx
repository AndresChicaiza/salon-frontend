import { useState } from 'react'

const sections = [
    {
        id: 'overview',
        title: '📋 Visión General',
        content: `
**Salón de Estudio Colaborativo** es una plataforma web de videollamada y chat en tiempo real diseñada para que estudiantes puedan crear salas de estudio virtuales, comunicarse por video/audio P2P (WebRTC) y chatear en vivo.

### Arquitectura del Sistema
El proyecto está compuesto por **3 servicios independientes** desplegados en la nube:

| Servicio | Tecnología | Hosting | Puerto |
|---|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | Vercel | 5173 (dev) |
| **Backend Principal** | Node.js + Express + Firestore | Render | 4000 |
| **Backend Tiempo Real** | Node.js + Socket.io + WebRTC Signaling | Render | 5000 |

### Base de Datos
- **Firebase Firestore** (NoSQL): Almacena usuarios, salas y mensajes.
- **Firebase Authentication**: Maneja el registro e inicio de sesión con email/password.
        `,
    },
    {
        id: 'frontend',
        title: '🖥️ Frontend (React)',
        content: `
### Estructura de Páginas

| Página | Ruta | Descripción |
|---|---|---|
| LandingPage | \`/\` | Página de bienvenida pública |
| LoginPage | \`/login\` | Inicio de sesión con Firebase Auth |
| RegisterPage | \`/register\` | Registro con selección de avatar DiceBear |
| ChooseUsernamePage | \`/register/username\` | Elegir nombre de usuario único |
| DashboardPage | \`/dashboard\` | Panel principal: ver/crear/unirse a salas |
| ProfilePage | \`/profile\` | CRUD completo del perfil del usuario |
| CreateRoomPage | \`/room/create\` | Formulario para crear nueva sala |
| RoomPage | \`/room/:roomId\` | Sala de estudio con video, audio y chat |
| DocsPage | \`/docs\` | Esta documentación (oculta) |

### Servicios del Frontend
- **authService.ts**: Registro, login, logout, getToken (Firebase Auth).
- **userService.ts**: CRUD de perfil de usuario (API REST → Backend Principal).
- **roomService.ts**: CRUD de salas y mensajes (API REST → Backend Principal).

### Hooks Personalizados
- **useAuth.ts**: Estado de autenticación reactivo.
- **useWebRTC.ts**: Gestión completa de conexiones peer-to-peer (getUserMedia, RTCPeerConnection, ICE candidates).

### Variables de Entorno
\`\`\`
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_BACKEND_MAIN_URL          # URL del backend principal (REST API)
VITE_BACKEND_REALTIME_URL      # URL del backend de sockets (WebRTC + Chat)
\`\`\`
        `,
    },
    {
        id: 'backend-main',
        title: '⚙️ Backend Principal (REST API)',
        content: `
### Endpoints de Usuarios

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | \`/users/check-username/:username\` | Verificar disponibilidad de username | ❌ |
| POST | \`/users\` | Crear perfil en Firestore | ✅ |
| GET | \`/users\` | Obtener perfil del usuario autenticado | ✅ |
| PUT | \`/users\` | Actualizar perfil (username, displayName, avatarUrl) | ✅ |
| DELETE | \`/users\` | Eliminar cuenta y datos | ✅ |

### Endpoints de Salas

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | \`/rooms\` | Crear una nueva sala | ✅ |
| GET | \`/rooms\` | Listar salas del usuario | ✅ |
| GET | \`/rooms/:roomId\` | Obtener detalle de una sala | ✅ |
| PUT | \`/rooms/:roomId\` | Actualizar nombre (solo anfitrión) | ✅ |
| DELETE | \`/rooms/:roomId\` | Eliminar sala y mensajes (solo anfitrión) | ✅ |

### Endpoints de Chat

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | \`/rooms/:roomId/messages\` | Enviar mensaje al chat | ✅ |
| GET | \`/rooms/:roomId/messages\` | Obtener historial de chat | ✅ |

### Endpoints del Sistema

| Método | Ruta | Descripción |
|---|---|---|
| GET | \`/health\` | Estado del servidor |
| GET | \`/api-docs\` | Swagger UI (documentación interactiva) |

### Modelo de Datos en Firestore

**Colección \`users\`** (doc ID = uid de Firebase Auth):
\`\`\`json
{
    "uid": "abc123",
    "email": "usuario@ejemplo.com",
    "username": "juanperez",
    "displayName": "Juan Pérez",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "createdAt": "2026-05-25T00:00:00.000Z"
}
\`\`\`

**Colección \`rooms\`** (doc ID = auto-generado):
\`\`\`json
{
    "name": "Álgebra Lineal Grupo 4",
    "createdBy": "uid_del_creador",
    "createdAt": "2026-05-25T00:00:00.000Z",
    "status": "active"
}
\`\`\`

**Subcolección \`rooms/{roomId}/messages\`**:
\`\`\`json
{
    "senderUid": "uid123",
    "senderUsername": "juanperez",
    "senderDisplayName": "Juan Pérez",
    "avatarUrl": "https://...",
    "text": "¡Hola a todos!",
    "createdAt": "2026-05-25T00:00:05.000Z"
}
\`\`\`
        `,
    },
    {
        id: 'backend-realtime',
        title: '🔌 Backend Tiempo Real (Sockets)',
        content: `
### Eventos Socket.io

#### Cliente → Servidor
| Evento | Payload | Descripción |
|---|---|---|
| \`join-room\` | \`{ roomId, user }\` | Unirse a una sala |
| \`leave-room\` | \`roomId\` | Salir de una sala |
| \`send-message\` | \`{ roomId, message }\` | Enviar mensaje de chat a la sala |
| \`webrtc-offer\` | \`{ targetSocketId, offer }\` | Enviar oferta WebRTC a un peer |
| \`webrtc-answer\` | \`{ targetSocketId, answer }\` | Enviar respuesta WebRTC a un peer |
| \`webrtc-ice-candidate\` | \`{ targetSocketId, candidate }\` | Enviar candidato ICE a un peer |

#### Servidor → Cliente
| Evento | Payload | Descripción |
|---|---|---|
| \`room-participants\` | \`Participant[]\` | Lista actualizada de participantes en la sala |
| \`user-joined\` | \`socketId\` | Notifica que un nuevo usuario se unió |
| \`user-left\` | \`socketId\` | Notifica que un usuario abandonó la sala |
| \`new-message\` | \`ChatMessage\` | Mensaje de chat recibido |
| \`webrtc-offer\` | \`{ fromSocketId, offer }\` | Oferta WebRTC de un peer |
| \`webrtc-answer\` | \`{ fromSocketId, answer }\` | Respuesta WebRTC de un peer |
| \`webrtc-ice-candidate\` | \`{ fromSocketId, candidate }\` | Candidato ICE de un peer |
| \`room-updated\` | \`{ name }\` | Nombre de sala actualizado |

### Gestión de Participantes en Memoria
El servidor mantiene dos mapas en memoria:
- \`roomParticipants\`: Map<roomId, Map<socketId, Participant>> — Quién está en cada sala.
- \`socketToRoom\`: Map<socketId, roomId> — A qué sala pertenece cada conexión.

Cuando un usuario se desconecta, se limpia automáticamente de ambos mapas y se notifica a la sala.
        `,
    },
    {
        id: 'webrtc',
        title: '📡 WebRTC (P2P)',
        content: `
### Flujo de Conexión P2P

\`\`\`
Usuario A se une a la sala
    ↓
Servidor emite "user-joined" a todos los existentes
    ↓
Usuario B (ya en la sala) recibe "user-joined"
    ↓
Usuario B crea RTCPeerConnection + añade tracks locales
    ↓
Usuario B crea Offer → setLocalDescription → emite "webrtc-offer" al servidor
    ↓
Servidor retransmite la offer a Usuario A
    ↓
Usuario A crea RTCPeerConnection + añade tracks locales
    ↓
Usuario A: setRemoteDescription(offer) → crea Answer → setLocalDescription
    ↓
Usuario A emite "webrtc-answer" → Servidor → Usuario B
    ↓
Usuario B: setRemoteDescription(answer)
    ↓
Ambos intercambian ICE candidates hasta que la conexión se establece
    ↓
🎥 Video y Audio fluyen directamente entre navegadores (P2P)
\`\`\`

### Servidores STUN Utilizados
- \`stun:stun.l.google.com:19302\`
- \`stun:stun1.l.google.com:19302\`
- \`stun:stun2.l.google.com:19302\`

### Funcionalidades del Hook useWebRTC
- **startLocalStream()**: Solicita permisos de cámara/micrófono.
- **toggleMic()**: Activa/desactiva pistas de audio.
- **toggleCam()**: Activa/desactiva pistas de video.
- **toggleScreenShare()**: Reemplaza la pista de video por la pantalla compartida.
- **remoteStreams[]**: Array reactivo con los streams de los peers conectados.
- **permissionError**: Mensaje de error si el usuario deniega permisos.

### Manejo de Errores
| Error | Comportamiento |
|---|---|
| Permisos denegados | Se muestra alerta visual en la sala. Se intenta solo audio. |
| Sin cámara | Se muestra avatar del usuario en lugar del video. |
| Conexión ICE fallida | Se elimina el peer automáticamente. |
| Desconexión del socket | Se limpian todas las conexiones peer. |
        `,
    },
    {
        id: 'security',
        title: '🔒 Seguridad y Permisos',
        content: `
### Autenticación
- Todas las rutas protegidas requieren un **Bearer Token** de Firebase Authentication.
- El middleware \`authMiddleware\` verifica el token en cada solicitud.

### Autorización por Sala
- Solo el **anfitrión** (creador) puede editar o eliminar una sala.
- Cualquier usuario autenticado puede unirse a una sala si conoce el ID.

### Reglas de Firestore
- Solo usuarios autenticados pueden leer/escribir sus propios datos.
- Los mensajes se almacenan como subcolección dentro de cada sala, aislando la información.

### Chat Aislado por Sala
- Cada sala tiene su propia subcolección de mensajes en Firestore (\`rooms/{roomId}/messages\`).
- Los WebSockets transmiten mensajes solo a la sala correspondiente (\`socket.to(roomId)\`).
- No es posible leer mensajes de una sala desde otra.
        `,
    },
    {
        id: 'deploy',
        title: '🚀 Despliegue',
        content: `
### Servicios en Producción

| Servicio | Plataforma | Rama de Deploy | URL |
|---|---|---|---|
| Frontend | Vercel | \`main\` | salon-frontend-wine.vercel.app |
| Backend Principal | Render | \`main\` | (Ver Dashboard de Render) |
| Backend Realtime | Render | \`main\` | (Ver Dashboard de Render) |

### Flujo de Despliegue
1. Desarrollar en rama \`develop\`.
2. Merge a \`main\` cuando esté listo.
3. Vercel y Render detectan el push y despliegan automáticamente.

### Variables de Entorno en Producción
- **Vercel**: Configurar en Settings → Environment Variables.
- **Render**: Configurar en cada servicio → Environment.
- Ambos backends necesitan las credenciales de Firebase (service account).
        `,
    },
    {
        id: 'improvements',
        title: '✨ Mejoras Recientes (UX y Código)',
        content: `
### Mejoras de UX (Experiencia de Usuario)
- **Chat Responsivo Colapsable:** En dispositivos móviles, el chat inicia cerrado para maximizar el área de video. Se abre como una pestaña inferior (Bottom Sheet) al presionar el botón de Chat. En Desktop, ahora también es posible ocultarlo a voluntad.
- **Contador de Mensajes No Leídos:** Se implementó una burbuja indicadora animada que cuenta los mensajes nuevos si el chat está minimizado, mejorando el dinamismo sin interrumpir la videollamada.
- **Accesibilidad Visual y Teclado:** Se añadieron anillos de enfoque (\`focus:ring\`) a todos los botones e inputs para que la navegación mediante teclado (\`Tab\`) sea clara.
- **Soporte de Lectores de Pantalla:** Se añadieron atributos \`aria-label\`, \`aria-pressed\` y \`aria-hidden\` a elementos decorativos, logrando altos puntajes en auditorías de accesibilidad (WCAG).

### Correcciones Críticas (Bugfixes)
- **Pantalla Negra al Compartir Pantalla:** Se solucionó un error crítico de renderizado (\`ref-sharing\`) al compartir pantalla, encapsulando el ciclo de vida del video en el componente independiente \`<LocalVideo />\`. Además, se fortaleció la identificación segura de emisores WebRTC utilizando la API \`getTransceivers()\`.
- **Condición de Carrera en WebRTC:** Se corrigió un error donde el servidor enviaba las señales P2P antes de que la cámara terminara de inicializarse. Al forzar la espera con \`await startLocalStream()\`, las conexiones de audio y video son ahora **100% estables** al instante.
- **Error al Detener Pantalla Compartida:** Se solucionó un problema de "Stale Closure" en el evento \`onended\` de la pista de video, asegurando que si el usuario detiene la transmisión usando la barra nativa del navegador, la cámara se restaure automáticamente sin romper el flujo.
        `,
    },
    {
        id: 'sprints',
        title: '📊 Progreso por Sprints',
        content: `
### Sprint 2 — Rúbrica TG2 ✅
| Criterio | Estado | Detalle |
|---|---|---|
| C1: Ver/Editar/Eliminar Perfil | ✅ Completo | CRUD con revalidación de username, selección de avatar |
| C2: Crear y Visualizar Salas | ✅ Completo | Creación con ID único, listado en Dashboard |
| C3: Infraestructura Sockets | ✅ Completo | Servidor Node.js en Render, conexión Socket.io |
| C4: Seguridad DB y Permisos | ✅ Completo | Auth middleware, reglas Firestore |
| C5: Evidencia UX/HCI | ✅ Completo | UI moderna con Tailwind, diseño dark mode premium |

### Sprint 3 — Rúbrica TG3 ✅
| Criterio | Estado | Detalle |
|---|---|---|
| C1: Editar, Eliminar y Unirse | ✅ Completo | Modal de unirse por ID, editar/eliminar solo anfitrión |
| C2: Chat Tiempo Real (Sockets) | ✅ Completo | Mensajes en vivo con Socket.io entre múltiples clientes |
| C3: Historial Chat (Firestore) | ✅ Completo | Mensajes persisten en subcolección, se cargan al entrar |
| C4: Diseño UI Sala y Auto-scroll | ✅ Completo | Scroll automático, diseño premium |
| C5: Documentación y Tablero | ✅ Completo | Swagger actualizado, esta página de docs |

### Sprint 4 — Rúbrica TG4 ✅
| Criterio | Estado | Detalle |
|---|---|---|
| C1: Signaling Server P2P | ✅ Completo | Eventos offer/answer/ice-candidate. Condición de carrera corregida. |
| C2: Transmisión Audio y Video | ✅ Completo | WebRTC P2P real, audio/video bidireccional estable. |
| C3: Grid visual dinámico | ✅ Completo | Grid CSS adaptativo según número de participantes. |
| C4: Manejo de Permisos UI | ✅ Completo | Feedback de error, reemplazo fluido de pantalla compartida. |
| C5: Evidencia UX/HCI | ✅ Completo | UI moderna, esta documentación técnica. |

### Sprint 5 — Rúbrica TG5 (Accesibilidad y UX) ✅
| Criterio | Estado | Detalle |
|---|---|---|
| C1: Evaluación Heurística | 📝 Doc Req. | Informe heurístico Top 5 UX. |
| C2: Mejoras UX Aplicadas | ✅ Completo | Chat responsivo (Bottom-Sheet), contador de mensajes, bugfixes. |
| C3: Accesibilidad (Teclado) | ✅ Completo | Toda la sala operable con Tab (\`focus:ring\` implementado). |
| C4: Atributos ARIA | ✅ Completo | Etiquetas \`aria-label\` y \`aria-pressed\` en todos los controles multimedia. |
| C5: Evidencia UX/HCI | 📝 Doc Req. | Bitácora final y documento de test de accesibilidad (Lighthouse). |

### Sprint 5 — Rúbrica TG5 (Despliegue y E2E) 🚀
| Criterio | Estado | Detalle |
|---|---|---|
| C1: Integración E2E estable | ✅ Completo | Flujo fluido sin fallas: Crear sala, Chat, Cámara, Compartir pantalla. |
| C2: Despliegues en Producción | 📝 Pendiente | Conectar Vercel y Render y generar las URLs públicas operativas. |
| C3: Documentación API | ⚠️ Parcial | JSDoc implementado en backend. Falta revisión y Swagger completo. |
| C4: README Reproducible | ✅ Completo | Guía de setup local clara, variables de entorno detalladas. |
| C5: Informe Pruebas | 📝 Doc Req. | Informe final con métricas, demo y retrospectiva. |
        `,
    },
]

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('overview')

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto sticky top-0 h-screen shrink-0">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">📚</span>
                        <h1 className="text-lg font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Documentación
                        </h1>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Salón de Estudio Colaborativo</p>
                </div>

                <nav className="flex flex-col gap-1">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                activeSection === s.id
                                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                            }`}
                        >
                            {s.title}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 pt-6 border-t border-slate-800">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">Página oculta</p>
                    <p className="text-[10px] text-slate-500 mt-1">Solo accesible vía /docs</p>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 p-10 max-w-4xl overflow-y-auto">
                {sections.filter(s => s.id === activeSection).map(s => (
                    <div key={s.id}>
                        <h2 className="text-3xl font-extrabold text-white mb-6 tracking-tight">{s.title}</h2>
                        <div className="docs-content prose prose-invert prose-sm max-w-none
                            prose-headings:text-white prose-headings:font-bold
                            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                            prose-p:text-slate-300 prose-p:leading-relaxed
                            prose-table:border-collapse
                            prose-th:bg-slate-800 prose-th:text-slate-200 prose-th:px-4 prose-th:py-2 prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:font-bold prose-th:border prose-th:border-slate-700
                            prose-td:px-4 prose-td:py-2.5 prose-td:text-sm prose-td:border prose-td:border-slate-800 prose-td:text-slate-300
                            prose-code:bg-slate-800 prose-code:text-indigo-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl
                            prose-strong:text-white
                            prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300
                        ">
                            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(s.content) }} />
                        </div>
                    </div>
                ))}
            </main>
        </div>
    )
}

// Mini parser de Markdown → HTML (sin dependencias externas)
function markdownToHtml(md: string): string {
    let html = md.trim()

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
        return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`
    })

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

    // Tables
    html = html.replace(/^(\|.+\|)\n(\|[\s\-:|]+\|)\n((?:\|.+\|\n?)*)/gm, (_m, header, _sep, body) => {
        const heads = header.split('|').filter((c: string) => c.trim())
        const rows = body.trim().split('\n').map((r: string) => r.split('|').filter((c: string) => c.trim()))
        let table = '<table><thead><tr>'
        heads.forEach((h: string) => { table += `<th>${h.trim()}</th>` })
        table += '</tr></thead><tbody>'
        rows.forEach((r: string[]) => {
            table += '<tr>'
            r.forEach((c: string) => { table += `<td>${c.trim()}</td>` })
            table += '</tr>'
        })
        table += '</tbody></table>'
        return table
    })

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>')
    html = `<p>${html}</p>`

    // Clean empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '')
    html = html.replace(/<p>\s*<(h[1-3]|pre|table)/g, '<$1')
    html = html.replace(/<\/(h[1-3]|pre|table)>\s*<\/p>/g, '</$1>')

    return html
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
