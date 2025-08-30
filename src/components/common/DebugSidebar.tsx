'use client';

export const DebugSidebar = () => {
  return (
    <div 
      className="fixed left-0 top-0 z-50 h-screen w-64 bg-red-500 border-r border-gray-200"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 9999,
        height: '100vh',
        width: '256px',
        backgroundColor: 'red',
        borderRight: '1px solid #ccc'
      }}
    >
      <div className="p-4">
        <h1 className="text-white text-xl font-bold">DEBUG SIDEBAR</h1>
        <p className="text-white">Si puedes ver esto, el sidebar funciona</p>
        <div className="mt-4 space-y-2">
          <div className="text-white">✅ Sidebar renderizando</div>
          <div className="text-white">✅ CSS aplicado</div>
          <div className="text-white">✅ Z-index correcto</div>
        </div>
      </div>
    </div>
  );
};