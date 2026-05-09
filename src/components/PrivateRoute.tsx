import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PrivateRoute() {
    const { user, loading } = useAuth()

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500 text-lg">Cargando...</p>
        </div>
    )

    return user ? <Outlet /> : <Navigate to="/login" replace />
}