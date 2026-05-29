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

    // Filtros y Favoritos
    const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all')
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('favoriteRooms')
        return saved ? JSON.parse(saved) : []
    })

    function toggleFavorite(roomId: string) {
        setFavorites(prev => {
            const next = prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
            localStorage.setItem('favoriteRooms', JSON.stringify(next))
            return next
        })
    }

    // Modal state for joining room
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [joinRoomId, setJoinRoomId] = useState('')
    const [joining, setJoining] = useState(false)
    const [joinError, setJoinError] = useState('')

    useEffect(() => {
        // Conexión inicial al servidor de Sockets para evidencia TS-02
        const socketUrl = (import.meta.env.VITE_BACKEND_REALTIME_URL || 'http://localhost:5000').replace(/\/$/, '')
        const socket = io(socketUrl, {
            transports: ['websocket']
        })

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
        <div className="flex flex-col items-center justify-center h-screen bg-[#F8F7FA]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 mt-4 font-medium animate-pulse">Cargando tu salón...</p>
        </div>
    )

    const displayRooms = rooms.filter(r => {
        if (filter === 'favorites') return favorites.includes(r.id)
        return true
    }).sort((a, b) => {
        if (filter === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        const aFav = favorites.includes(a.id) ? 1 : 0
        const bFav = favorites.includes(b.id) ? 1 : 0
        if (aFav !== bFav) return bFav - aFav
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return (
        <div className="min-h-screen bg-[#F8F7FA] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-16">
            {/* Header / Navbar */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        A
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                        Salón de Estudio
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    {profile && (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigate('/profile')}>
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <span className="text-lg">👤</span>
                            )}
                            <span className="text-sm font-semibold text-slate-700 pr-1">
                                {profile.displayName || profile.username}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* Contenido Principal */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Cabecera de la sección */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                            Mis Salas de Estudio
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Organiza tus espacios, colabora en tiempo real y avanza juntos.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm flex items-center gap-2"
                        >
                            <span className="text-slate-400">🔗</span> Unirse a sala
                        </button>
                        <button
                            onClick={() => navigate('/room/create')}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
                        >
                            <span className="text-indigo-200">+</span> Crear sala
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${filter === 'all' ? 'bg-indigo-50 text-indigo-600' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Todas</button>
                    <button onClick={() => setFilter('favorites')} className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${filter === 'favorites' ? 'bg-indigo-50 text-indigo-600' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Favoritas</button>
                    <button onClick={() => setFilter('recent')} className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${filter === 'recent' ? 'bg-indigo-50 text-indigo-600' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Recientes</button>
                </div>

                {/* Lista de Salas */}
                {displayRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                            📚
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                            No tienes salas de estudio todavía
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-8">
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
                        {displayRooms.map((room, index) => {
                            const isHost = room.createdBy === user?.uid || room.createdBy === profile?.uid
                            // Assigning a pseudo-random icon color based on index for the visual flair
                            const iconColors = ['bg-indigo-100 text-indigo-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-sky-100 text-sky-600', 'bg-rose-100 text-rose-600', 'bg-amber-100 text-amber-600'];
                            const iconColor = iconColors[index % iconColors.length];
                            
                            return (
                                <div
                                    key={room.id}
                                    className="group relative bg-white border border-slate-100 rounded-3xl p-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-indigo-100 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${iconColor}`}>
                                                {isHost ? '👑' : '👥'}
                                            </div>
                                            <button onClick={() => toggleFavorite(room.id)} className={`transition-colors text-xl ${favorites.includes(room.id) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}>
                                                ★
                                            </button>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                                            {room.name}
                                        </h3>
                                        
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-slate-500">
                                            <span>4 miembros</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> 2 conectados</span>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500 mb-6 group-hover:bg-indigo-50/50 transition-colors">
                                            <span className="truncate flex-1 select-all" title={room.id}>{room.id}</span>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(room.id)
                                                    alert('¡ID copiado al portapapeles!')
                                                }}
                                                className="text-indigo-600 hover:text-indigo-500 ml-2 font-sans font-semibold shrink-0"
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <div className="flex -space-x-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] shadow-sm">A</div>
                                            <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] shadow-sm">M</div>
                                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">+2</div>
                                        </div>
                                        
                                        <button
                                            onClick={() => navigate(`/room/${room.id}`)}
                                            className="text-sm font-bold text-indigo-600 group-hover:text-indigo-500 transition-colors flex items-center gap-1"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl transition-all scale-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <span className="text-indigo-600">🔗</span> Unirse a una Sala
                            </h3>
                            <button
                                onClick={() => {
                                    setIsJoinModalOpen(false)
                                    setJoinError('')
                                    setJoinRoomId('')
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleJoinRoom} className="space-y-5">
                            <div>
                                <label htmlFor="roomIdInput" className="block text-xs font-bold text-slate-600 mb-2">
                                    Identificador Único (ID)
                                </label>
                                <input
                                    id="roomIdInput"
                                    type="text"
                                    required
                                    placeholder="Ingresa el ID de la sala..."
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value)}
                                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                />
                            </div>

                            {joinError && (
                                <p className="text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2">
                                    <span>⚠️</span> {joinError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsJoinModalOpen(false)
                                        setJoinError('')
                                        setJoinRoomId('')
                                    }}
                                    className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={joining || !joinRoomId.trim()}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                                >
                                    {joining ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
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