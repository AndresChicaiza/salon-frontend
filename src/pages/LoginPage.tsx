import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithEmail, loginWithGoogle } from '../services/authService'
import { getUserProfile } from '../services/userService'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await loginWithEmail(email, password)
            navigate('/dashboard')
        } catch (err: any) {
            setError('Correo o contraseña incorrectos')
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleLogin() {
        setError('')
        setLoading(true)
        try {
            await loginWithGoogle()
            try {
                await getUserProfile()
                navigate('/dashboard')
            } catch {
                navigate('/register/username')
            }
        } catch (err: any) {
            setError('Error al iniciar sesión con Google')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Iniciar sesión
                </h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Correo</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Entrar'}
                    </button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs text-gray-400">
                        <span className="bg-white px-2">o</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                    Continuar con Google
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                    ¿No tienes cuenta?{' '}
                    <a href="/register" className="text-blue-600 hover:underline">
                        Regístrate
                    </a>
                </p>
            </div>
        </div>
    )
}

async function handleGoogleLogin() {
    setError('')
    setLoading(true)
    try {
        const user = await loginWithGoogle()
        // Verificar si ya tiene perfil en Firestore
        try {
            await getUserProfile()
            navigate('/dashboard')
        } catch {
            // No tiene perfil — es primer acceso con Google
            navigate('/register/username')
        }
    } catch (err: any) {
        setError('Error al iniciar sesión con Google')
    } finally {
        setLoading(false)
    }
}

return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Iniciar sesión
            </h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Correo</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                >
                    {loading ? 'Cargando...' : 'Entrar'}
                </button>
            </form>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400">
                    <span className="bg-white px-2">o</span>
                </div>
            </div>

            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
            >
                Continuar con Google
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
                ¿No tienes cuenta?{' '}
                <a href="/register" className="text-blue-600 hover:underline">
                    Regístrate
                </a>
            </p>
        </div>
    </div>
)
}