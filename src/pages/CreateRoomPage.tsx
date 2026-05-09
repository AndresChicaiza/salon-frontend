export default function CreateRoomPage() {
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

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Nombre de la sala
                        </label>
                        <input
                            type="text"
                            placeholder="ej: Estudio Cálculo III"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Crear sala
                    </button>
                </div>
            </div>
        </div>
    )
}