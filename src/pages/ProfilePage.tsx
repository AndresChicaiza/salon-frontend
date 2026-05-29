import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile, updateUserProfile, deleteUserAccount, checkUsername } from '../services/userService'

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

export default function ProfilePage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        avatarUrl: '',
    })

    const [originalUsername, setOriginalUsername] = useState('')
    const [showAvatarPicker, setShowAvatarPicker] = useState(false)

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await getUserProfile()
                const { user } = data
                const names = (user.displayName || '').split(' ')
                setForm({
                    firstName: names[0] || '',
                    lastName: names.slice(1).join(' ') || '',
                    username: user.username || '',
                    email: user.email || '',
                    avatarUrl: user.avatarUrl || '',
                })
                setOriginalUsername(user.username || '')
            } catch {
                setError('Error al cargar el perfil')
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (form.username.length < 4 || !/^[a-zA-Z0-9_]+$/.test(form.username)) {
            setError('El username debe tener al menos 4 caracteres y solo usar letras, números y guiones bajos')
            return
        }

        setSaving(true)
        try {
            // Re-validar username si cambió
            if (form.username !== originalUsername) {
                const available = await checkUsername(form.username)
                if (!available) {
                    setError('El nombre de usuario ya está en uso')
                    setSaving(false)
                    return
                }
            }

            await updateUserProfile({
                username: form.username,
                displayName: `${form.firstName} ${form.lastName}`.trim(),
                avatarUrl: form.avatarUrl,
            })

            setOriginalUsername(form.username)
            setSuccess('Perfil actualizado correctamente')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar perfil')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        try {
            await deleteUserAccount()
            navigate('/login')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar cuenta')
            setShowDeleteModal(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFDFE] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFDFE] font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <span className="text-lg">←</span> Volver al dashboard
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        A
                    </div>
                    <h1 className="text-lg font-bold text-slate-800">Mi perfil</h1>
                </div>
                <div className="w-[140px]" />
            </nav>

            {/* Contenido */}
            <main className="max-w-xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
                            {form.avatarUrl ? (
                                <img src={form.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full shadow-sm border-4 border-indigo-50 object-cover transition-transform group-hover:scale-105" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-600 shadow-inner transition-transform group-hover:scale-105">
                                    {form.firstName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xl">✏️</span>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mt-4">{form.firstName} {form.lastName}</h2>
                        <p className="text-sm font-mono text-slate-500 mt-1">@{form.username}</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
                            <span>✅</span> {success}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="firstName" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Nombres</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="lastName" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Apellidos</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
                                Nombre de usuario
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">@</span>
                                <input
                                    id="username"
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    minLength={4}
                                    pattern="^[a-zA-Z0-9_]+$"
                                    title="Solo letras, números y guiones bajos"
                                    className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50 font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Correo electrónico</label>
                            <input
                                id="email"
                                name="email"
                                value={form.email}
                                type="email"
                                disabled
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-100 text-slate-400 cursor-not-allowed"
                            />
                            <p className="text-[11px] font-medium text-slate-400 mt-1.5 ml-1">
                                El correo institucional no puede modificarse.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-500 text-sm font-semibold shadow-lg shadow-indigo-600/20 mt-4 disabled:opacity-50 transition-all"
                        >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </form>

                    <hr className="border-slate-100 my-8" />

                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-rose-600 mb-1">Zona de peligro</h3>
                        <p className="text-xs text-rose-500/80 mb-4">Eliminar tu cuenta borrará todos tus datos y salas creadas de forma permanente.</p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full border border-rose-200 text-rose-600 bg-white py-2.5 rounded-xl hover:bg-rose-50 text-sm font-semibold transition-all"
                        >
                            Eliminar cuenta permanentemente
                        </button>
                    </div>
                </div>
            </main>

            {/* Modal de Eliminar Cuenta */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 transition-all">
                        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xl mb-4">
                            ⚠️
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar cuenta?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            Esta acción <strong className="text-slate-700">no se puede deshacer</strong>. Todos tus datos, mensajes y salas creadas serán eliminadas permanentemente.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Avatar */}
            {showAvatarPicker && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Elige un avatar</h3>
                        <div className="grid grid-cols-4 gap-4 max-h-72 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {AVATARS.map((url) => (
                                <img
                                    key={url}
                                    src={url}
                                    alt="avatar"
                                    className={`w-16 h-16 mx-auto rounded-full cursor-pointer border-4 transition-all hover:scale-110 ${form.avatarUrl === url ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50 bg-white scale-110' : 'border-transparent hover:bg-slate-50'}`}
                                    onClick={() => {
                                        setForm({ ...form, avatarUrl: url })
                                        setShowAvatarPicker(false)
                                    }}
                                />
                            ))}
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setShowAvatarPicker(false)}
                                className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}