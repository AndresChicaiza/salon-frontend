import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import { getUserProfile } from '../services/userService'
import { getUserRooms, type Room } from '../services/roomService'
import { io } from 'socket.io-client'

interface UserProfile {
    username: string
    displayName: string
    email: string
    avatarUrl: string
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)

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

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Cargando...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Salón de Estudio</h1>
                <div className="flex items-center gap-4">
                    {profile && (
                        <span className="text-sm text-gray-600">
                            👤 {profile.username}
                        </span>
                    )}
                    <a href="/profile" className="text-sm text-gray-600 hover:text-blue-600">
                        Mi perfil
                    </a>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-600"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* Contenido */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Mis salas</h2>
                    <div className="flex gap-3">
                        <a
                            href="/room/create"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                            + Crear sala
                        </a>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                            Unirse a sala
                        </button>
                    </div>
                </div>

                {rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-5xl mb-4">📚</div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                            No tienes salas todavía
                        </h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Crea una sala de estudio o únete a una existente con un ID
                        </p>
                        <a
                            href="/room/create"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                            Crear mi primera sala
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map(room => (
                            <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">{room.name}</h3>
                                <p className="text-xs text-gray-500 mb-4">ID: {room.id}</p>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                        Activa
                                    </span>
                                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                        Entrar →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}