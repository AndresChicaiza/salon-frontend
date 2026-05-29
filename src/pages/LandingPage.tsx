export default function LandingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFE] font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <div className="text-center px-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Salón de Estudio Colaborativo
                </h1>
                <p className="text-slate-500 font-medium mb-10 text-base sm:text-lg max-w-lg mx-auto">
                    Estudia en tiempo real con tus compañeros
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a
                        href="/login"
                        className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        Iniciar sesión
                    </a>
                    <a
                        href="/register"
                        className="w-full sm:w-auto px-8 py-3 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-xl transition-all shadow-sm"
                    >
                        Registrarse
                    </a>
                </div>
            </div>
        </div>
    )
}