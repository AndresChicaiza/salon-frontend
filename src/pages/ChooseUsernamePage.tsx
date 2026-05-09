export default function ChooseUsernamePage() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                    Elige tu nombre de usuario
                </h2>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Este nombre será visible para los demás en la plataforma
                </p>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Nombre de usuario
                        </label>
                        <input
                            type="text"
                            placeholder="ej: juanperez123"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Solo letras, números y guiones bajos. Mínimo 4 caracteres.
                        </p>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Confirmar y continuar
                    </button>
                </div>
            </div>
        </div>
    )
}