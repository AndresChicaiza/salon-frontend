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
        
        if (!email.endsWith('@correounivalle.edu.co')) {
            setError('Solo se permiten correos de la Universidad del Valle (@correounivalle.edu.co)')
            return
        }

        setLoading(true)
        try {
            await loginWithEmail(email, password)
            navigate('/dashboard')
        } catch {
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
            setError(err.message || 'Error al iniciar sesión con Google')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-[#FDFDFE] font-sans">
            {/* PANEL IZQUIERDO - INFORMACIÓN (Oculto en móviles) */}
            <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24 bg-[#F8F7FA] relative overflow-hidden">
                {/* Elementos decorativos de fondo simulando la imagen */}
                <div className="absolute top-10 right-10 flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
                </div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

                <div className="relative z-10 max-w-lg">
                    {/* Logo/Marca */}
                    <div className="flex items-center gap-2 mb-16">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                            A
                        </div>
                        <span className="font-bold text-slate-800 text-lg">Salón de Estudio</span>
                    </div>

                    <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                        Estudia.<br />
                        <span className="text-indigo-600">Colabora.</span><br />
                        Avanza.
                    </h1>
                    <p className="text-slate-500 text-lg mb-12 max-w-md">
                        Tu espacio para aprender, compartir y construir juntos.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <span className="text-indigo-600 text-xl">👥</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Salas colaborativas</h3>
                                <p className="text-slate-500 text-xs mt-0.5">para cada materia o proyecto</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                <span className="text-purple-600 text-xl">💬</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Comunicación en tiempo real</h3>
                                <p className="text-slate-500 text-xs mt-0.5">chats, voz y más</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <span className="text-indigo-600 text-xl">📄</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Documentos compartidos</h3>
                                <p className="text-slate-500 text-xs mt-0.5">trabaja en equipo sin límites</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer simulado */}
                    <div className="mt-16 inline-flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white"></div>
                            <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white"></div>
                            <div className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white"></div>
                        </div>
                        <span className="text-xs font-medium text-slate-600"><strong className="text-indigo-600">+128</strong> estudiantes conectados</span>
                    </div>
                </div>
            </div>

            {/* PANEL DERECHO - FORMULARIO LOGIN */}
            <div className="flex-1 flex items-center justify-center p-6 bg-[#FDFDFE]">
                <div className="w-full max-w-md bg-white p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-4xl mb-6 shadow-inner">
                            A
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Iniciar sesión
                        </h2>
                        <p className="text-slate-500 text-sm text-center">
                            Bienvenido de nuevo a tu salón de estudio
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Correo electrónico</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="correo@correounivalle.edu.co"
                                    pattern=".*@correounivalle\.edu\.co"
                                    title="Debe ser un correo de @correounivalle.edu.co"
                                    required
                                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Contraseña</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-500 text-sm font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all mt-2"
                        >
                            {loading ? 'Cargando...' : 'Entrar'}
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
                        onClick={handleGoogleLogin}
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
                        ¿No tienes cuenta?{' '}
                        <a href="/register" className="text-indigo-600 font-semibold hover:underline">
                            Regístrate
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}