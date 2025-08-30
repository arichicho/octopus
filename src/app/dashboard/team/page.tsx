export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Equipo</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestiona los miembros de tu equipo
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Los miembros del equipo se mostrarán aquí
        </p>
      </div>
    </div>
  );
}