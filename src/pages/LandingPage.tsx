export default function LandingPage() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Salón de Estudio Colaborativo
                </h1>
                <p className="text-gray-500 mb-8">
                    Estudia en tiempo real con tus compañeros
                </p>
                <div className="flex gap-4 justify-center">
                    <a
                        href="/login"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Iniciar sesión
                    </a>
                    <a
                        href="/register"
                        className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                        Registrarse
                    </a>
                </div>
            </div>
        </div>
    )
}