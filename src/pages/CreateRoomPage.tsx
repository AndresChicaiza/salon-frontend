import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../services/roomService'

export default function CreateRoomPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        
        if (name.trim().length === 0) {
            setError('El nombre no puede estar vacío')
            return
        }

        setLoading(true)
        try {
            await createRoom(name)
            navigate('/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear la sala')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
                <a
                    href="/dashboard"
                    className="text-sm text-gray-500 hover:text-blue-600 mb-6 inline-block"
                >
                    ← Volver
                </a>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Crear sala de estudio
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Se generará un ID único para que tus compañeros puedan unirse
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="roomName" className="block text-sm text-gray-600 mb-1">
                            Nombre de la sala
                        </label>
                        <input
                            id="roomName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ej: Estudio Cálculo III"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Creando...' : 'Crear sala'}
                    </button>
                </form>
            </div>
        </div>
    )
}