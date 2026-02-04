'use client'

export default function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
      <div className="flex flex-col items-center p-8 bg-white rounded shadow-lg max-w-sm w-full">
        {/* Spinner simple con CSS para evitar dependencia de MUI CircularProgress */}
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 text-sm">
          Cargando...
        </p>
      </div>
    </div>
  )
}
