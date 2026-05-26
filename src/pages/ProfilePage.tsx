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
    const [originalAvatarUrl, setOriginalAvatarUrl] = useState('')
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
                setOriginalAvatarUrl(user.avatarUrl || '')
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
            setOriginalAvatarUrl(form.avatarUrl)
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
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <a href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">
                    ← Volver al dashboard
                </a>
                <h1 className="text-lg font-bold text-gray-800">Mi perfil</h1>
                <div className="w-24" />
            </nav>

            {/* Contenido */}
            <main className="max-w-lg mx-auto px-6 py-10">
                <div className="bg-white rounded-xl border border-gray-200 p-8">

                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-8">
                        {form.avatarUrl ? (
                            <img src={form.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full mb-3 shadow-sm border border-gray-200" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mb-3">
                                {form.firstName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button onClick={() => setShowAvatarPicker(true)} type="button" className="text-sm text-blue-600 hover:underline">
                            Cambiar avatar
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg px-4 py-3 mb-4">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label htmlFor="firstName" className="block text-sm text-gray-600 mb-1">Nombres</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="lastName" className="block text-sm text-gray-600 mb-1">Apellidos</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    type="text"
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
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                type="text"
                                required
                                minLength={4}
                                pattern="^[a-zA-Z0-9_]+$"
                                title="Solo letras, números y guiones bajos"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm text-gray-600 mb-1">Correo</label>
                            <input
                                id="email"
                                name="email"
                                value={form.email}
                                type="email"
                                disabled
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                El correo no puede modificarse
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium mt-2 disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </form>

                    <hr className="border-gray-200 my-4" />

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full border border-red-300 text-red-500 py-2 rounded-lg hover:bg-red-50 text-sm font-medium"
                    >
                        Eliminar cuenta
                    </button>
                </div>
            </main>

            {/* Modal de Eliminar Cuenta */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar cuenta?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Esta acción no se puede deshacer. Todos tus datos y salas creadas serán eliminadas permanentemente.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Avatar */}
            {showAvatarPicker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Elige un avatar</h3>
                        <div className="grid grid-cols-4 gap-4 max-h-64 overflow-y-auto p-2">
                            {AVATARS.map((url) => (
                                <img
                                    key={url}
                                    src={url}
                                    alt="avatar"
                                    className={`w-16 h-16 mx-auto rounded-full cursor-pointer border-2 transition-all hover:scale-105 ${form.avatarUrl === url ? 'border-blue-500 shadow-md ring-2 ring-blue-200 bg-white' : 'border-transparent hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setForm({ ...form, avatarUrl: url })
                                        setShowAvatarPicker(false)
                                    }}
                                />
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowAvatarPicker(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
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