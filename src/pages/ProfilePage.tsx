export default function ProfilePage() {
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
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mb-3">
                            JP
                        </div>
                        <button className="text-sm text-blue-600 hover:underline">
                            Cambiar avatar
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">Nombres</label>
                                <input
                                    type="text"
                                    defaultValue="Juan"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">Apellidos</label>
                                <input
                                    type="text"
                                    defaultValue="Pérez"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Nombre de usuario
                            </label>
                            <input
                                type="text"
                                defaultValue="juanperez123"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Correo</label>
                            <input
                                type="email"
                                defaultValue="juan@ejemplo.com"
                                disabled
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                El correo no puede modificarse
                            </p>
                        </div>

                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium mt-2">
                            Guardar cambios
                        </button>

                        <hr className="border-gray-200" />

                        <button className="w-full border border-red-300 text-red-500 py-2 rounded-lg hover:bg-red-50 text-sm font-medium">
                            Eliminar cuenta
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}