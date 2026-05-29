import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerWithEmail, loginWithGoogle } from '../services/authService'
import { createUserProfile, checkUsername } from '../services/userService'

const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Christian',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Eden',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aidan',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Sam'
]

export default function RegisterPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        avatarUrl: AVATARS[0],
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

            if (!form.email.endsWith('@correounivalle.edu.co')) {
                setError('Solo se permiten correos de la Universidad del Valle (@correounivalle.edu.co)')
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
                avatarUrl: form.avatarUrl,
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
        } catch (err: any) {
            setError(err.message || 'Error al registrarse con Google')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#FDFDFE] font-sans">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-4xl mb-6 shadow-inner">
                        A
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Crear cuenta
                    </h2>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-5">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label htmlFor="firstName" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Nombres</label>
                            <input
                                id="firstName"
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="Juan"
                                required
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="lastName" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Apellidos</label>
                            <input
                                id="lastName"
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Pérez"
                                required
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Elige un Avatar</label>
                        <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                            {AVATARS.map((url) => (
                                <img
                                    key={url}
                                    src={url}
                                    alt="avatar"
                                    className={`w-14 h-14 mx-auto rounded-full cursor-pointer border-2 transition-all hover:scale-105 ${form.avatarUrl === url ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200 bg-white' : 'border-transparent hover:bg-white'}`}
                                    onClick={() => setForm({ ...form, avatarUrl: url })}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
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
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                            Solo letras, números y guiones bajos. Mínimo 4 caracteres.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Correo</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="correo@correounivalle.edu.co"
                            pattern=".*@correounivalle\.edu\.co"
                            title="Debe ser un correo de @correounivalle.edu.co"
                            required
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-500 text-sm font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all mt-2"
                    >
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs text-slate-400">
                        <span className="bg-white px-4 text-xs font-medium">o continuar con</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                </button>

                <p className="text-center text-sm text-slate-500 mt-8">
                    ¿Ya tienes cuenta?{' '}
                    <a href="/login" className="text-indigo-600 font-semibold hover:underline">
                        Inicia sesión
                    </a>
                </p>
            </div>
        </div>
    )
}