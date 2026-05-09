export default function RoomPage() {
    return (
        <div className="flex h-screen bg-gray-900">

            {/* Panel principal — grid de video */}
            <div className="flex-1 flex flex-col">

                {/* Navbar sala */}
                <nav className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
                    <div>
                        <h2 className="text-white font-semibold text-sm">Estudio Cálculo III</h2>
                        <p className="text-gray-400 text-xs">ID: abc-123-xyz</p>
                    </div>
                    <a
                        href="/dashboard"
                        className="text-sm text-red-400 hover:text-red-300"
                    >
                        Salir
                    </a>
                </nav>

                {/* Grid de usuarios */}
                <div className="flex-1 grid grid-cols-2 gap-4 p-6">
                    {/* Usuario 1 — placeholder */}
                    <div className="bg-gray-700 rounded-xl flex items-center justify-center relative">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                                JP
                            </div>
                            <span className="text-white text-sm">juanperez123</span>
                        </div>
                        <div className="absolute bottom-3 left-3 flex gap-2">
                            <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                                🎤
                            </span>
                            <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                                📷
                            </span>
                        </div>
                    </div>

                    {/* Usuario 2 — placeholder */}
                    <div className="bg-gray-700 rounded-xl flex items-center justify-center relative">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                                MR
                            </div>
                            <span className="text-white text-sm">maria_r</span>
                        </div>
                        <div className="absolute bottom-3 left-3 flex gap-2">
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                🔇
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controles AV */}
                <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4 border-t border-gray-700">
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                        🎤 Silenciar
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                        📷 Cámara
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                        🖥 Compartir
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                        Salir
                    </button>
                </div>
            </div>

            {/* Panel lateral — chat */}
            <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700">
                <div className="px-4 py-3 border-b border-gray-700">
                    <h3 className="text-white font-semibold text-sm">Chat</h3>
                </div>

                {/* Mensajes */}
                <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                    <div>
                        <span className="text-blue-400 text-xs font-medium">juanperez123</span>
                        <p className="text-gray-300 text-sm mt-1">Hola a todos!</p>
                    </div>
                    <div>
                        <span className="text-green-400 text-xs font-medium">maria_r</span>
                        <p className="text-gray-300 text-sm mt-1">Listos para estudiar 📚</p>
                    </div>
                </div>

                {/* Input mensaje */}
                <div className="p-4 border-t border-gray-700 flex gap-2">
                    <input
                        type="text"
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
                        ➤
                    </button>
                </div>
            </div>

        </div>
    )
}