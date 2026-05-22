import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import { getUserProfile } from '../services/userService'
import { getUserRooms, getRoom, type Room } from '../services/roomService'
import { useAuth } from '../hooks/useAuth'
import { io } from 'socket.io-client'

interface UserProfile {
    uid: string
    username: string
    displayName: string
    email: string
    avatarUrl: string
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state for joining room
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [joinRoomId, setJoinRoomId] = useState('')
    const [joining, setJoining] = useState(false)
    const [joinError, setJoinError] = useState('')

    useEffect(() => {
        // Conexión inicial al servidor de Sockets para evidencia TS-02
        const socketUrl = (import.meta.env.VITE_BACKEND_REALTIME_URL || 'http://localhost:5000').replace(/\/$/, '')
        const socket = io(socketUrl)

        async function loadData() {
            try {
                const [profileData, roomsData] = await Promise.all([
                    getUserProfile(),
                    getUserRooms(),
                ])
                setProfile(profileData.user)
                setRooms(roomsData)
            } catch {
                setProfile(null)
            } finally {
                setLoading(false)
            }
        }
        loadData()

        return () => {
            socket.disconnect()
        }
    }, [])

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    async function handleJoinRoom(e: React.FormEvent) {
        e.preventDefault()
        const cleanId = joinRoomId.trim()
        if (!cleanId) return

        setJoining(true)
        setJoinError('')

        try {
            // Validar que la sala exista
            const room = await getRoom(cleanId)
            setIsJoinModalOpen(false)
            navigate(`/room/${room.id}`)
        } catch (err: any) {
            setJoinError(err.message || 'La sala no existe o el ID es inválido')
        } finally {
            setJoining(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-slate-400 mt-4 font-medium animate-pulse">Cargando tu salón...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            {/* Header / Navbar */}
            <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Salón de Estudio
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    {profile && (
                        <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                                <span>👤</span>
                            )}
                            <span className="text-sm font-semibold text-slate-200">
                                {profile.displayName || profile.username}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/profile')}
                        className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors"
                    >
                        Mi perfil
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* Contenido Principal */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Cabecera de la sección */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                            Mis Salas de Estudio
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Crea una nueva sala para colaborar o únete a una existente con su ID único.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition-all hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        >
                            🔗 Unirse a sala
                        </button>
                        <button
                            onClick={() => navigate('/room/create')}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            ✨ + Crear sala
                        </button>
                    </div>
                </div>

                {/* Lista de Salas */}
                {rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-900/40 border border-slate-850 rounded-2xl p-8">
                        <div className="text-6xl mb-6 animate-bounce">📚</div>
                        <h3 className="text-xl font-bold text-slate-250 mb-2">
                            No tienes salas de estudio todavía
                        </h3>
                        <p className="text-sm text-slate-450 max-w-sm mb-8">
                            Crea tu propia sala para invitar a tus compañeros o pídele a alguien su ID para unirte.
                        </p>
                        <button
                            onClick={() => navigate('/room/create')}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            Crear mi primera sala
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map(room => {
                            const isHost = room.createdBy === user?.uid || room.createdBy === profile?.uid
                            return (
                                <div
                                    key={room.id}
                                    className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                {room.name}
                                            </h3>
                                        </div>
                                        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-850 flex items-center justify-between text-xs font-mono text-slate-400 mb-4 select-all">
                                            <span className="truncate">ID: {room.id}</span>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(room.id)
                                                    alert('¡ID copiado al portapapeles!')
                                                }}
                                                className="text-indigo-400 hover:text-indigo-300 ml-2 font-sans shrink-0"
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-800">
                                        {isHost ? (
                                            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-full flex items-center gap-1">
                                                👑 Anfitrión
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full flex items-center gap-1">
                                                👤 Miembro
                                            </span>
                                        )}
                                        <button
                                            onClick={() => navigate(`/room/${room.id}`)}
                                            className="text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1"
                                        >
                                            Entrar <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Modal Elegante: Unirse a Sala */}
            {isJoinModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl transition-all scale-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                🔗 Unirse a una Sala
                            </h3>
                            <button
                                onClick={() => {
                                    setIsJoinModalOpen(false)
                                    setJoinError('')
                                    setJoinRoomId('')
                                }}
                                className="text-slate-400 hover:text-white transition-colors text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleJoinRoom} className="space-y-4">
                            <div>
                                <label htmlFor="roomIdInput" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Identificador Único de la Sala (ID)
                                </label>
                                <input
                                    id="roomIdInput"
                                    type="text"
                                    required
                                    placeholder="Ingresa el ID de la sala..."
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value)}
                                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                />
                            </div>

                            {joinError && (
                                <p className="text-rose-450 text-xs font-medium bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                                    ⚠️ {joinError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsJoinModalOpen(false)
                                        setJoinError('')
                                        setJoinRoomId('')
                                    }}
                                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={joining || !joinRoomId.trim()}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                                >
                                    {joining ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>
                                            Validando...
                                        </>
                                    ) : (
                                        'Unirse'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}