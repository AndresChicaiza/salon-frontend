import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWebRTC } from '../hooks/useWebRTC'
import { useAudioVolume } from '../hooks/useAudioVolume'
import { 
    getRoom, 
    updateRoom, 
    deleteRoom, 
    getRoomMessages, 
    createRoomMessage, 
    type Room 
} from '../services/roomService'
import { getUserProfile } from '../services/userService'
import { io, Socket } from 'socket.io-client'

interface ChatMessage {
    id: string
    senderUid: string
    senderUsername: string
    senderDisplayName: string
    avatarUrl: string
    text: string
    createdAt: string
}

interface UserProfile {
    uid: string
    username: string
    displayName: string
    avatarUrl: string
}

interface Participant {
    socketId: string
    uid: string
    username: string
    displayName: string
    avatarUrl: string
    isMicOn?: boolean
    isCamOn?: boolean
}

export default function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [room, setRoom] = useState<Room | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputText, setInputText] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [participants, setParticipants] = useState<Participant[]>([])

    // Video refs
    const localVideoRef = useRef<HTMLVideoElement>(null)

    // Socket state
    const [socket, setSocket] = useState<Socket | null>(null)

    // Chat UI state
    const [isChatOpen, setIsChatOpen] = useState(window.innerWidth >= 1024)
    const [unreadCount, setUnreadCount] = useState(0)
    const prevMessagesLengthRef = useRef(0)

    // Auto-scroll logic & unread count reset
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (isChatOpen) {
            setUnreadCount(0)
            scrollToBottom()
        }
    }, [isChatOpen, messages])

    useEffect(() => {
        if (!isChatOpen && messages.length > prevMessagesLengthRef.current) {
            setUnreadCount(prev => prev + (messages.length - prevMessagesLengthRef.current))
        }
        prevMessagesLengthRef.current = messages.length
    }, [messages, isChatOpen])

    // Update isChatOpen on window resize (optional, but good for UX)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsChatOpen(true)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // WebRTC hook
    const {
        localStream,
        remoteStreams,
        isMicOn,
        isCamOn,
        isScreenSharing,
        permissionError,
        startLocalStream,
        toggleMic,
        toggleCam,
        toggleScreenShare,
    } = useWebRTC({ socket, roomId })

    const isLocalSpeaking = useAudioVolume(localStream, !isMicOn)

    // Host modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [newRoomName, setNewRoomName] = useState('')
    const [updatingName, setUpdatingName] = useState(false)
    const [deletingRoom, setDeletingRoom] = useState(false)

    // Load initial data (Room details & Messages history)
    useEffect(() => {
        if (!roomId) return

        async function loadRoomData() {
            try {
                const [roomData, messagesData, profileData] = await Promise.all([
                    getRoom(roomId!),
                    getRoomMessages(roomId!),
                    getUserProfile().catch(() => ({ user: null }))
                ])

                setRoom(roomData)
                setNewRoomName(roomData.name)
                setMessages(messagesData)
                if (profileData.user) {
                    setProfile(profileData.user)
                }
            } catch (err: any) {
                console.error(err)
                setError(err.message || 'Error al cargar los datos de la sala')
            } finally {
                setLoading(false)
            }
        }

        loadRoomData()
    }, [roomId])

    // Establish WebSocket Connection — solo después de obtener el stream local
    useEffect(() => {
        if (!roomId || !profile) return

        let newSocket: Socket | null = null;

        const initConnection = async () => {
            // 1. Esperar a tener el stream local (o permiso denegado) ANTES de unirse a la sala
            await startLocalStream()

            // 2. Conectar al socket
            const socketUrl = (import.meta.env.VITE_BACKEND_REALTIME_URL || 'http://localhost:5000').replace(/\/$/, '')
            newSocket = io(socketUrl, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
            })
            
            setSocket(newSocket)

            // Unirse a la sala en cuanto la conexión se establece
            newSocket.on('connect', () => {
                console.log(`🔌 Socket conectado: ${newSocket!.id}`)
                newSocket!.emit('join-room', { roomId, user: profile })
            })

            // Volver a unirse si el socket se reconecta (Render puede reiniciar el servidor)
            newSocket.on('reconnect', () => {
                console.log(`🔄 Socket reconectado, volviendo a unirse a sala: ${roomId}`)
                newSocket!.emit('join-room', { roomId, user: profile })
            })

            newSocket.on('room-participants', (users: Participant[]) => {
                setParticipants(users)
            })

            // Recibir mensajes nuevos de otros participantes en tiempo real
            newSocket.on('new-message', (message: ChatMessage) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev
                    return [...prev, message]
                })
            })

            // Recibir cambios del nombre de sala (si el anfitrión edita)
            newSocket.on('room-updated', (updatedData: { name: string }) => {
                setRoom(prev => prev ? { ...prev, name: updatedData.name } : null)
            })
        }

        initConnection()

        // Cleanup: salir de la sala y desconectar al salir de la página
        return () => {
            if (newSocket) {
                newSocket.emit('leave-room', roomId)
                newSocket.disconnect()
            }
        }
    }, [roomId, profile, startLocalStream])

    // Scroll reference (movido aquí abajo del useEffect principal para orden)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Vincular el stream local al elemento <video> cuando cambie
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream, isCamOn, isScreenSharing])

    // Polling de seguridad: sincroniza mensajes desde Firestore cada 8 segundos
    // Garantiza que los mensajes siempre aparezcan incluso si el socket falla en Render
    useEffect(() => {
        if (!roomId) return

        const syncMessages = async () => {
            try {
                const freshMessages = await getRoomMessages(roomId)
                setMessages(prev => {
                    // Construir set de IDs actuales
                    const currentIds = new Set(prev.map(m => m.id))
                    // Filtrar solo mensajes que aún no están en el estado local
                    const newOnes = freshMessages.filter((m: ChatMessage) => !currentIds.has(m.id))
                    if (newOnes.length === 0) return prev
                    return [...prev, ...newOnes]
                })
            } catch {
                // Silenciar errores de polling para no interrumpir al usuario
            }
        }

        const interval = setInterval(syncMessages, 8000)
        return () => clearInterval(interval)
    }, [roomId])



    // Handle sending a chat message
    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault()
        const cleanText = inputText.trim()
        if (!cleanText || !roomId) return

        setInputText('')

        try {
            // 1. Guardar en Firestore mediante REST API
            const createdMsg = await createRoomMessage(roomId, cleanText)
            
            // 2. Añadir localmente
            setMessages(prev => [...prev, createdMsg])

            // 3. Emitir a otros miembros vía WebSockets
            if (socket) {
                socket.emit('send-message', {
                    roomId,
                    message: createdMsg
                })
            }
        } catch (err: any) {
            console.error('Error al enviar mensaje:', err)
            alert('No se pudo enviar el mensaje. Inténtalo de nuevo.')
        }
    }

    // Handle Room Rename (Host only)
    async function handleUpdateRoomName(e: React.FormEvent) {
        e.preventDefault()
        const cleanName = newRoomName.trim()
        if (!cleanName || !roomId || !room) return

        setUpdatingName(true)
        try {
            await updateRoom(roomId, cleanName)
            setRoom({ ...room, name: cleanName })
            setIsEditModalOpen(false)
            
            // Notificar cambios vía sockets si es necesario
            if (socket) {
                socket.emit('update-room-notify', { roomId, name: cleanName })
            }
        } catch (err: any) {
            alert(err.message || 'Error al actualizar el nombre de la sala')
        } finally {
            setUpdatingName(false)
        }
    }

    // Handle Room Deletion (Host only)
    async function handleDeleteRoom() {
        if (!roomId) return

        setDeletingRoom(true)
        try {
            await deleteRoom(roomId)
            setIsDeleteModalOpen(false)
            navigate('/dashboard')
        } catch (err: any) {
            alert(err.message || 'Error al eliminar la sala')
        } finally {
            setDeletingRoom(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#F8F7FA]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="text-slate-500 mt-4 font-medium animate-pulse">Cargando sala de estudio...</p>
            </div>
        )
    }

    if (error || !room) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#F8F7FA] text-slate-800 px-6 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                    ⚠️
                </div>
                <h3 className="text-xl font-bold mb-2">No se pudo acceder a la sala</h3>
                <p className="text-slate-500 max-w-md mb-8">{error || 'La sala especificada no existe o no tienes permisos.'}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold shadow-lg shadow-indigo-600/20 text-sm transition-all"
                >
                    Volver al Dashboard
                </button>
            </div>
        )
    }

    const isHost = room.createdBy === user?.uid || room.createdBy === profile?.uid
    const remoteParticipants = participants.filter(p => p.uid !== profile?.uid)
    const totalVideoSlots = 1 + remoteParticipants.length // 1 local + remotos

    return (
        <div className="flex flex-col lg:flex-row h-[100dvh] bg-[#F8F7FA] text-slate-800 font-sans overflow-hidden">
            
            {/* PANEL PRINCIPAL: Transmisiones Simuladas */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                
                {/* Navbar de la Sala */}
                <nav className="bg-white border-b border-slate-100 shadow-sm px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl font-bold text-lg">
                            📖
                        </div>
                        <div>
                            <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-2">
                                <span className="truncate max-w-[120px] sm:max-w-[200px]">{room.name}</span>
                                {isHost && (
                                    <span className="hidden sm:inline-block text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                        Anfitrión
                                    </span>
                                )}
                            </h2>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-mono hidden sm:block">ID: {room.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        {isHost && (
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-3 py-1.5 lg:px-4 lg:py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                    title="Editar nombre de la sala"
                                    aria-label="Editar nombre de la sala"
                                >
                                    ✏️ Editar
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="px-3 py-1.5 lg:px-4 lg:py-2 bg-white hover:bg-rose-50 text-rose-500 rounded-xl border border-rose-100 hover:border-rose-200 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                                    title="Eliminar esta sala permanentemente"
                                    aria-label="Eliminar sala permanentemente"
                                >
                                    🗑️ Eliminar
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-3 py-1.5 lg:px-4 lg:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                            aria-label="Salir del salón"
                        >
                            <span className="hidden sm:inline">🚪 Salir del Salón</span>
                            <span className="sm:hidden" aria-hidden="true">🚪</span>
                        </button>
                        {isHost && (
                            <div className="flex sm:hidden gap-2">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-2 bg-white text-slate-600 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                    aria-label="Editar nombre de la sala (móvil)"
                                >
                                    <span aria-hidden="true">✏️</span>
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="p-2 bg-white text-rose-500 rounded-xl border border-rose-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                                    aria-label="Eliminar sala (móvil)"
                                >
                                    <span aria-hidden="true">🗑️</span>
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Alerta de permisos denegados */}
                {permissionError && (
                    <div className="mx-4 lg:mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2 shadow-sm">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <p className="font-bold">Permisos requeridos</p>
                            <p>{permissionError}</p>
                        </div>
                    </div>
                )}

                {/* Grid de Video/Audio WebRTC Dinámico */}
                <div className={`flex-1 p-4 lg:p-6 overflow-y-auto grid gap-3 lg:gap-4 items-center content-center mx-auto w-full ${
                    totalVideoSlots <= 1 ? 'grid-cols-1 max-w-sm sm:max-w-xl' :
                    totalVideoSlots === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl' :
                    totalVideoSlots <= 4 ? 'grid-cols-2 max-w-4xl' :
                    'grid-cols-2 lg:grid-cols-3 max-w-6xl'
                }`}>
                    
                    {/* Tarjeta del Usuario Local — Video Real */}
                    <div className={`relative aspect-video rounded-xl lg:rounded-3xl bg-slate-100 border overflow-hidden shadow-sm transition-all hover:shadow-md ${isLocalSpeaking ? 'border-4 border-indigo-500 shadow-indigo-500/50 scale-[1.02]' : 'border-slate-200'}`}>
                        {localStream && (isCamOn || isScreenSharing) ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`absolute inset-0 w-full h-full object-cover ${!isScreenSharing ? 'mirror-video' : ''}`}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center overflow-hidden shadow-sm">
                                    {profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-indigo-600 text-xl lg:text-3xl font-bold">{profile?.displayName?.slice(0, 2).toUpperCase() || 'YO'}</span>
                                    )}
                                </div>
                                <span className="text-slate-400 text-xs mt-3 font-medium">{localStream ? 'Cámara Apagada' : 'Sin cámara'}</span>
                            </div>
                        )}

                        {/* Indicadores flotantes */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                            <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] lg:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50 truncate max-w-[100px] lg:max-w-[150px]">
                                {profile?.displayName || profile?.username || 'Tú'}
                            </span>
                            <div className="flex gap-1.5 lg:gap-2">
                                <span className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs backdrop-blur-md shadow-sm border ${isMicOn ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
                                    {isMicOn ? '🎤' : '🔇'}
                                </span>
                                <span className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs backdrop-blur-md shadow-sm border ${isCamOn ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
                                    {isCamOn ? '📹' : '❌'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tarjetas de Compañeros Remotos — Video Real WebRTC */}
                    {participants.filter(p => p.uid !== profile?.uid).map(p => {
                        const remote = remoteStreams.find(rs => rs.socketId === p.socketId)
                        return <RemoteParticipantCard key={p.socketId} participant={p} remoteStream={remote} />
                    })}

                </div>

                {/* Controles de Transmisión AV — Funcionales */}
                <div className="bg-white border-t border-slate-100 px-3 py-3 lg:px-6 lg:py-5 flex items-center justify-center gap-2 lg:gap-4 shrink-0 flex-wrap shadow-[0_-4px_20px_rgb(0,0,0,0.02)] z-10" role="group" aria-label="Controles de audio y video">
                    <button 
                        onClick={toggleMic}
                        className={`p-3 lg:px-6 lg:py-3.5 rounded-full lg:rounded-2xl text-xs lg:text-sm font-bold transition-all flex items-center gap-2 shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isMicOn 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 focus:ring-slate-400' 
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 focus:ring-rose-500'
                        }`}
                        title={isMicOn ? 'Silenciar micrófono' : 'Activar micrófono'}
                        aria-label={isMicOn ? 'Silenciar micrófono' : 'Activar micrófono'}
                        aria-pressed={isMicOn}
                    >
                        <span className="text-lg lg:text-xl" aria-hidden="true">{isMicOn ? '🎤' : '🔇'}</span>
                        <span className="hidden sm:inline">{isMicOn ? 'Micrófono Activo' : 'Silenciado'}</span>
                    </button>

                    <button 
                        onClick={toggleCam}
                        className={`p-3 lg:px-6 lg:py-3.5 rounded-full lg:rounded-2xl text-xs lg:text-sm font-bold transition-all flex items-center gap-2 shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isCamOn 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 focus:ring-slate-400' 
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 focus:ring-rose-500'
                        }`}
                        title={isCamOn ? 'Apagar cámara' : 'Encender cámara'}
                        aria-label={isCamOn ? 'Apagar cámara' : 'Encender cámara'}
                        aria-pressed={isCamOn}
                    >
                        <span className="text-lg lg:text-xl" aria-hidden="true">{isCamOn ? '📹' : '❌'}</span>
                        <span className="hidden sm:inline">{isCamOn ? 'Cámara Encendida' : 'Apagada'}</span>
                    </button>

                    <button 
                        onClick={toggleScreenShare}
                        className={`p-3 lg:px-6 lg:py-3.5 rounded-full lg:rounded-2xl text-xs lg:text-sm font-bold transition-all flex items-center gap-2 shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isScreenSharing 
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 focus:ring-indigo-500' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 focus:ring-slate-400'
                        }`}
                        title={isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
                        aria-label={isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
                        aria-pressed={isScreenSharing}
                    >
                        <span className="text-lg lg:text-xl" aria-hidden="true">🖥️</span>
                        <span className="hidden sm:inline">{isScreenSharing ? 'Compartiendo' : 'Compartir'}</span>
                    </button>

                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`relative p-3 lg:px-6 lg:py-3.5 rounded-full lg:rounded-2xl text-xs lg:text-sm font-bold transition-all flex items-center gap-2 shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isChatOpen 
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 focus:ring-indigo-500' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 focus:ring-slate-400'
                        }`}
                        title={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
                        aria-label={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
                        aria-pressed={isChatOpen}
                    >
                        <span className="text-lg lg:text-xl" aria-hidden="true">💬</span>
                        <span className="hidden sm:inline">Chat</span>
                        {!isChatOpen && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 lg:top-0 lg:right-0 transform lg:-translate-y-1/2 lg:translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Overlay oscuro para el móvil cuando el chat está abierto */}
            {isChatOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsChatOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* PANEL LATERAL: Chat en Tiempo Real */}
            <div className={`
                fixed lg:static inset-x-0 bottom-0 z-50 lg:z-20 
                w-full lg:w-[380px] 
                h-[75vh] lg:h-full 
                bg-white border-t lg:border-t-0 lg:border-l border-slate-100 
                flex-col shrink-0 relative
                shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-[-4px_0_24px_rgba(0,0,0,0.03)]
                transition-transform duration-300 ease-out rounded-t-3xl lg:rounded-none
                ${isChatOpen ? 'translate-y-0 flex' : 'translate-y-full lg:translate-y-0 hidden lg:hidden'}
            `}>
                {/* Header del Chat */}
                <div className="px-4 py-3 lg:px-5 lg:py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 rounded-t-3xl lg:rounded-none">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-600 text-lg bg-indigo-50 w-8 h-8 rounded-lg flex items-center justify-center" aria-hidden="true">💬</span>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Chat en Vivo</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            En línea
                        </span>
                        <button 
                            className="lg:hidden w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                            onClick={() => setIsChatOpen(false)}
                            aria-label="Cerrar chat"
                        >
                            <span aria-hidden="true">✕</span>
                        </button>
                    </div>
                </div>

                {/* Lista de Mensajes del Chat */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#FDFDFE] scrollbar-thin scrollbar-thumb-slate-200">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-100">💬</div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">El chat está vacío</p>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">¡Sé el primero en enviar un mensaje amistoso!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderUid === user?.uid || msg.senderUid === profile?.uid
                            return (
                                <div 
                                    key={msg.id} 
                                    className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                                >
                                    {/* Cabecera del Mensaje */}
                                    <div className="flex items-center gap-1.5 mb-1.5 mx-1">
                                        {!isMe && (
                                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">
                                                {msg.senderDisplayName || msg.senderUsername}
                                            </span>
                                        )}
                                        <span className="text-[9px] text-slate-400 font-medium">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Burbuja del Mensaje */}
                                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                        isMe 
                                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/10' 
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                                    }`}>
                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input para Escribir Mensaje */}
                <form 
                    onSubmit={handleSendMessage} 
                    className="p-3 lg:p-4 border-t border-slate-100 flex gap-2 bg-white shrink-0"
                >
                    <input
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 transition-all font-sans"
                    />
                    <button 
                        type="submit"
                        disabled={!inputText.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all shrink-0 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                        aria-label="Enviar mensaje"
                    >
                        <span aria-hidden="true">➤</span>
                    </button>
                </form>
            </div>

            {/* MODAL: EDITAR NOMBRE DE LA SALA */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 shadow-2xl scale-100 transition-all">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="bg-slate-100 w-8 h-8 flex items-center justify-center rounded-lg text-lg">✏️</span>
                                Modificar Nombre
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRoomName} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">
                                    Nuevo nombre de la sala
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Álgebra Lineal Grupo 4"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingName || !newRoomName.trim()}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                                >
                                    {updatingName ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN: ELIMINAR SALA */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 shadow-2xl scale-100 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="bg-rose-100 text-rose-600 w-8 h-8 flex items-center justify-center rounded-lg text-lg">⚠️</span>
                                ¿Eliminar Sala?
                            </h3>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs leading-relaxed text-rose-700 mb-6">
                            <p className="font-bold uppercase tracking-wider mb-1">¡Advertencia Crítica!</p>
                            <p>Esta acción es irreversible. Se eliminará la sala de forma permanente junto con todo su historial de mensajes.</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteRoom}
                                disabled={deletingRoom}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-600/20 transition-all"
                            >
                                {deletingRoom ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

// Componente separado para video remoto (evita re-renders innecesarios)
function RemoteVideo({ stream }: { stream: MediaStream }) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
        />
    )
}

// Componente separado para tarjeta de participante remoto (maneja volumen y UI)
function RemoteParticipantCard({ participant: p, remoteStream }: { participant: Participant, remoteStream?: { stream: MediaStream } }) {
    const isSpeaking = useAudioVolume(remoteStream?.stream || null, p.isMicOn === false)

    return (
        <div className={`relative aspect-video rounded-xl lg:rounded-3xl bg-slate-100 border overflow-hidden shadow-sm transition-all hover:shadow-md ${isSpeaking ? 'border-4 border-indigo-500 shadow-indigo-500/50 scale-[1.02]' : 'border-slate-200'}`}>
            {remoteStream ? (
                <RemoteVideo stream={remoteStream.stream} />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center overflow-hidden shadow-sm">
                        {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-emerald-600 text-xl lg:text-3xl font-bold">{p.displayName?.slice(0, 2).toUpperCase() || 'U'}</span>
                        )}
                    </div>
                    <span className="text-slate-400 text-[10px] lg:text-xs mt-3 flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Conectando...
                    </span>
                </div>
            )}

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] lg:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50 truncate max-w-[100px] lg:max-w-[150px]">
                    {p.displayName || p.username}
                </span>
                {remoteStream && (
                    <div className="flex gap-1.5 lg:gap-2">
                        <span className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs backdrop-blur-md shadow-sm border ${p.isMicOn !== false ? 'bg-indigo-600/90 border-indigo-500/50 text-white' : 'bg-rose-500/90 border-rose-400/50 text-white'}`}>
                            {p.isMicOn !== false ? '🎤' : '🔇'}
                        </span>
                        <span className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs backdrop-blur-md shadow-sm border ${p.isCamOn !== false ? 'bg-indigo-600/90 border-indigo-500/50 text-white' : 'bg-rose-500/90 border-rose-400/50 text-white'}`}>
                            {p.isCamOn !== false ? '📹' : '❌'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}