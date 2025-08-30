export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Facturación</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestiona tu plan y métodos de pago
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">
          La información de facturación se mostrará aquí
        </p>
      </div>
    </div>
  );
}