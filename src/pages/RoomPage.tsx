import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
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

    // Socket state
    const socketRef = useRef<Socket | null>(null)

    // Scroll reference
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // AV controls state (Simulated)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isCamOn, setIsCamOn] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)

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

    // Establish WebSocket Connection
    useEffect(() => {
        if (!roomId || loading || error) return

        const socketUrl = (import.meta.env.VITE_BACKEND_REALTIME_URL || 'http://localhost:5000').replace(/\/$/, '')
        const socket = io(socketUrl)
        socketRef.current = socket

        // On connection, join this room channel
        socket.on('connect', () => {
            console.log(`🔌 Conectado al servidor de sockets: ${socket.id}`)
            socket.emit('join-room', roomId)
        })

        // Listen for new messages from other participants
        socket.on('new-message', (message: ChatMessage) => {
            setMessages(prev => {
                // Evitar duplicados por seguridad
                if (prev.some(m => m.id === message.id)) return prev
                return [...prev, message]
            })
        })

        // Listen for room updates (if modified by host in another session)
        socket.on('room-updated', (updatedData: { name: string }) => {
            setRoom(prev => prev ? { ...prev, name: updatedData.name } : null)
        })

        // Cleanup on unmount or roomId change
        return () => {
            socket.emit('leave-room', roomId)
            socket.disconnect()
        }
    }, [roomId, loading, error])

    // Auto-scroll logic
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

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
            if (socketRef.current) {
                socketRef.current.emit('send-message', {
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
            if (socketRef.current) {
                socketRef.current.emit('update-room-notify', { roomId, name: cleanName })
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
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="text-slate-400 mt-4 font-medium animate-pulse">Cargando sala de estudio...</p>
            </div>
        )
    }

    if (error || !room) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-200 px-6 text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2">No se pudo acceder a la sala</h3>
                <p className="text-slate-400 max-w-md mb-6">{error || 'La sala especificada no existe o no tienes permisos.'}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold shadow-lg text-sm transition-all"
                >
                    Volver al Dashboard
                </button>
            </div>
        )
    }

    const isHost = room.createdBy === user?.uid || room.createdBy === profile?.uid

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
            
            {/* PANEL PRINCIPAL: Transmisiones Simuladas */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                
                {/* Navbar de la Sala */}
                <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-650 rounded-xl">
                            <span className="text-lg">📖</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                {room.name}
                                {isHost && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                        Anfitrión
                                    </span>
                                )}
                            </h2>
                            <p className="text-slate-450 text-xs font-mono">ID: {room.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isHost && (
                            <>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-750 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
                                    title="Editar nombre de la sala"
                                >
                                    ✏️ Editar
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-450 rounded-xl border border-rose-900/30 hover:text-rose-350 transition-all text-xs font-semibold flex items-center gap-1.5"
                                    title="Eliminar esta sala permanentemente"
                                >
                                    🗑️ Eliminar
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
                        >
                            🚪 Salir del Salón
                        </button>
                    </div>
                </nav>

                {/* Grid de Video/Audio Simulado Premium */}
                <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center content-center max-w-5xl mx-auto w-full">
                    
                    {/* Tarjeta del Usuario Local */}
                    <div className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 group transition-all hover:border-indigo-500/35">
                        {isCamOn ? (
                            <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center">
                                {/* Simulación de cámara activa con un avatar dinámico y animación sutil */}
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 animate-pulse">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                        {profile?.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-3xl font-extrabold">{profile?.displayName?.slice(0, 2).toUpperCase() || 'YO'}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-slate-350 text-xs mt-4 animate-pulse">📷 Cámara Encendida (Transmitiendo...)</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 text-2xl font-bold">
                                    {profile?.displayName?.slice(0, 2).toUpperCase() || 'YO'}
                                </div>
                                <span className="text-slate-450 text-xs">Cámara Apagada</span>
                            </div>
                        )}

                        {/* Indicadores flotantes */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                            <span className="bg-slate-950/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-850">
                                {profile?.displayName || profile?.username || 'Tú'} (Tú)
                            </span>
                            <div className="flex gap-1.5">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs backdrop-blur-md border ${isMicOn ? 'bg-indigo-600/80 border-indigo-500/30 text-white' : 'bg-rose-600/80 border-rose-500/30 text-white'}`}>
                                    {isMicOn ? '🎤' : '🔇'}
                                </span>
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs backdrop-blur-md border ${isCamOn ? 'bg-indigo-600/80 border-indigo-500/30 text-white' : 'bg-rose-600/80 border-rose-500/30 text-white'}`}>
                                    {isCamOn ? '📹' : '❌'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta del Compañero Simulado (Estudio Compartido) */}
                    <div className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 transition-all hover:border-purple-500/35">
                        <div className="absolute inset-0 bg-slate-850/30 flex flex-col items-center justify-center">
                            {/* Simulación de compañero remoto activo */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 p-1">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <span className="text-teal-400 text-3xl font-extrabold">JS</span>
                                </div>
                            </div>
                            <span className="text-slate-400 text-xs mt-4 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Transmitiendo desde la biblioteca 📚
                            </span>
                        </div>

                        {/* Indicadores flotantes */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                            <span className="bg-slate-950/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-850">
                                jsilva_estudios (Estudiante)
                            </span>
                            <div className="flex gap-1.5">
                                <span className="w-8 h-8 rounded-full bg-slate-950/80 border border-slate-805 flex items-center justify-center text-xs text-white">
                                    🎤
                                </span>
                                <span className="w-8 h-8 rounded-full bg-slate-950/80 border border-slate-805 flex items-center justify-center text-xs text-white">
                                    📹
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Controles de Transmisión AV */}
                <div className="bg-slate-900 border-t border-slate-800 px-6 py-5 flex items-center justify-center gap-4 shrink-0">
                    <button 
                        onClick={() => setIsMicOn(!isMicOn)}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border ${
                            isMicOn 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-750' 
                            : 'bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 border-rose-900/30'
                        }`}
                    >
                        <span>{isMicOn ? '🎤 Micrófono Activo' : '🔇 Micrófono Silenciado'}</span>
                    </button>

                    <button 
                        onClick={() => setIsCamOn(!isCamOn)}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border ${
                            isCamOn 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-750' 
                            : 'bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 border-rose-900/30'
                        }`}
                    >
                        <span>{isCamOn ? '📹 Cámara Encendida' : '❌ Cámara Apagada'}</span>
                    </button>

                    <button 
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border ${
                            isScreenSharing 
                            ? 'bg-indigo-950/40 hover:bg-indigo-950/60 text-indigo-400 border-indigo-900/30' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-750'
                        }`}
                    >
                        <span>🖥️ {isScreenSharing ? 'Compartiendo Pantalla' : 'Compartir Pantalla'}</span>
                    </button>
                </div>
            </div>

            {/* PANEL LATERAL: Chat en Tiempo Real */}
            <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0">
                {/* Header del Chat */}
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-400">💬</span>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Chat en Vivo</h3>
                    </div>
                    <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ● Tiempo Real
                    </span>
                </div>

                {/* Lista de Mensajes del Chat */}
                <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-slate-850">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                            <span className="text-3xl mb-2">💬</span>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">El chat está vacío</p>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">¡Sé el primero en enviar un mensaje amistoso de estudio!</p>
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
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {!isMe && (
                                            <span className="text-[10px] font-bold text-indigo-400">
                                                {msg.senderDisplayName || msg.senderUsername}
                                            </span>
                                        )}
                                        <span className="text-[9px] text-slate-500">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Burbuja del Mensaje */}
                                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed border shadow-md ${
                                        isMe 
                                        ? 'bg-indigo-650 text-white border-indigo-600 rounded-tr-none' 
                                        : 'bg-slate-850 text-slate-200 border-slate-800 rounded-tl-none'
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
                    className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900 shrink-0"
                >
                    <input
                        type="text"
                        placeholder="Escribe un mensaje en el chat..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-550 transition-all font-sans"
                    />
                    <button 
                        type="submit"
                        disabled={!inputText.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all shrink-0 font-bold"
                    >
                        ➤
                    </button>
                </form>
            </div>

            {/* MODAL: EDITAR NOMBRE DE LA SALA */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl scale-100 transition-all">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                ✏️ Modificar Nombre de Sala
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRoomName} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Nuevo nombre de la sala
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Álgebra Lineal Grupo 4"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-sans"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingName || !newRoomName.trim()}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
                                >
                                    {updatingName ? 'Actualizando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN: ELIMINAR SALA */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl scale-100 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                                ⚠️ ¿Eliminar esta Sala?
                            </h3>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 text-xs leading-relaxed text-rose-200 mb-6">
                            <p className="font-bold uppercase tracking-wider mb-1">¡Advertencia Crítica!</p>
                            <p>Esta acción es irreversible. Se eliminará la sala de forma permanente junto con todo su historial de mensajes.</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteRoom}
                                disabled={deletingRoom}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-650/15 transition-all"
                            >
                                {deletingRoom ? 'Eliminando...' : 'Sí, Eliminar Sala'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}