export default function NotFoundPage() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <h1 className="text-8xl font-bold text-blue-600 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Página no encontrada
                </h2>
                <p className="text-gray-500 mb-8">
                    La página que buscas no existe o fue movida
                </p>
                <a
                    href="/"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    Volver al inicio
                </a>
            </div>
        </div>
    )
}