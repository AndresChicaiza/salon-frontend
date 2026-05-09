export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Salón de Estudio</h1>
                <div className="flex items-center gap-4">
                    <a href="/profile" className="text-sm text-gray-600 hover:text-blue-600">
                        Mi perfil
                    </a>
                    <button className="text-sm text-red-500 hover:text-red-600">
                        Cerrar sesión
                    </button>
                </div>
            </nav>

            {/* Contenido */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Mis salas</h2>
                    <div className="flex gap-3">
                        <a
                            href="/room/create"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                            + Crear sala
                        </a>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                            Unirse a sala
                        </button>
                    </div>
                </div>

                {/* Estado vacío */}
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No tienes salas todavía
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        Crea una sala de estudio o únete a una existente con un ID
                    </p>
                    <a
                        href="/room/create"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                        Crear mi primera sala
                    </a>
                </div>
            </main>
        </div>
    )
}