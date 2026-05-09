export default function LoginPage() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Iniciar sesión
                </h2>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Correo</label>
                        <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Entrar
                    </button>

                    <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs text-gray-400">
                            <span className="bg-white px-2">o</span>
                        </div>
                    </div>

                    <button className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        Continuar con Google
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        ¿No tienes cuenta?{' '}
                        <a href="/register" className="text-blue-600 hover:underline">
                            Regístrate
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}