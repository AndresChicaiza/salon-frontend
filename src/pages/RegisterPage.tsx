import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerWithEmail, loginWithGoogle } from '../services/authService'
import { createUserProfile, checkUsername } from '../services/userService'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (form.username.length < 4) {
                setError('El username debe tener al menos 4 caracteres')
                setLoading(false)
                return
            }

            if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
                setError('El username solo permite letras, números y guiones bajos')
                setLoading(false)
                return
            }

            // Verificar username disponible
            const available = await checkUsername(form.username)
            if (!available) {
                setError('El nombre de usuario ya está en uso')
                setLoading(false)
                return
            }

            // Crear cuenta en Firebase Auth
            await registerWithEmail(form.email, form.password)

            // Crear perfil en Firestore
            await createUserProfile({
                username: form.username,
                displayName: `${form.firstName} ${form.lastName}`,
            })

            navigate('/dashboard')
        } catch (err) {
            if (err && typeof err === 'object' && 'code' in err) {
                if (err.code === 'auth/email-already-in-use') {
                    setError('El correo ya está registrado')
                } else if (err.code === 'auth/weak-password') {
                    setError('La contraseña debe tener al menos 6 caracteres')
                } else {
                    setError((err as {message?: string}).message || 'Error al crear la cuenta')
                }
            } else {
                setError('Error al crear la cuenta')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleRegister() {
        setError('')
        setLoading(true)
        try {
            await loginWithGoogle()
            navigate('/register/username')
        } catch {
            setError('Error al registrarse con Google')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Crear cuenta
                </h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label htmlFor="firstName" className="block text-sm text-gray-600 mb-1">Nombres</label>
                            <input
                                id="firstName"
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="Juan"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="lastName" className="block text-sm text-gray-600 mb-1">Apellidos</label>
                            <input
                                id="lastName"
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Pérez"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm text-gray-600 mb-1">
                            Nombre de usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="juanperez123"
                            required
                            minLength={4}
                            pattern="^[a-zA-Z0-9_]+$"
                            title="Solo letras, números y guiones bajos. Mínimo 4 caracteres."
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Solo letras, números y guiones bajos. Mínimo 4 caracteres.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm text-gray-600 mb-1">Correo</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="correo@ejemplo.com"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm text-gray-600 mb-1">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                    Continuar con Google
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                    ¿Ya tienes cuenta?{' '}
                    <a href="/login" className="text-blue-600 hover:underline">
                        Inicia sesión
                    </a>
                </p>
            </div>
        </div>
    )
}