import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createUserProfile, checkUsername } from '../services/userService'

export default function ChooseUsernamePage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [username, setUsername] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (username.length < 4) {
            setError('El username debe tener al menos 4 caracteres')
            return
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Solo se permiten letras, números y guiones bajos')
            return
        }

        setLoading(true)
        try {
            const available = await checkUsername(username)
            if (!available) {
                setError('El nombre de usuario ya está en uso')
                setLoading(false)
                return
            }

            await createUserProfile({
                username,
                displayName: user?.displayName || username,
                avatarUrl: user?.photoURL || '',
            })

            navigate('/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar el username')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                    Elige tu nombre de usuario
                </h2>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Este nombre será visible para los demás en la plataforma
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="username" className="block text-sm text-gray-600 mb-1">
                            Nombre de usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="ej: juanperez123"
                            required
                            minLength={4}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Solo letras, números y guiones bajos. Mínimo 4 caracteres.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Confirmar y continuar'}
                    </button>
                </form>
            </div>
        </div>
    )
}