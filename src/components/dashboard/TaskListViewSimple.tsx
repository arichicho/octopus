import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types/task';

interface TaskListViewSimpleProps {
  tasks: Task[];
  showCompanyInfo?: boolean;
  getCompanyName?: (companyId: string) => string;
  getCompanyColor?: (companyId: string) => string;
}

export default function TaskListViewSimple({ 
  tasks, 
  showCompanyInfo = false, 
  getCompanyName, 
  getCompanyColor 
}: TaskListViewSimpleProps) {
  console.log('🔍 TaskListViewSimple Debug:');
  console.log('  - tasksCount:', tasks.length);
  console.log('  - showCompanyInfo:', showCompanyInfo);
  console.log('  - hasGetCompanyName:', !!getCompanyName);
  console.log('  - hasGetCompanyColor:', !!getCompanyColor);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lista de Tareas SIMPLE ({tasks.length})</CardTitle>
        <div className="text-sm text-red-500 font-bold">
          DEBUG: showCompanyInfo = {showCompanyInfo ? 'TRUE' : 'FALSE'} - Columna Empresa debería estar {showCompanyInfo ? 'VISIBLE' : 'OCULTA'}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-2 bg-gray-200">Tarea</th>
                {showCompanyInfo && (
                  <th className="border border-black p-2 bg-blue-200">🏢 Empresa</th>
                )}
                <th className="border border-black p-2 bg-green-200">Prioridad</th>
                <th className="border border-black p-2 bg-purple-200">Estado</th>
                <th className="border border-black p-2 bg-orange-200">Vence</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="border border-black p-2">{task.title}</td>
                  {showCompanyInfo && (
                    <td className="border border-black p-2">
                      {getCompanyName ? getCompanyName(task.companyId) : 'Unknown Company'}
                    </td>
                  )}
                  <td className="border border-black p-2">{task.priority}</td>
                  <td className="border border-black p-2">{task.status}</td>
                  <td className="border border-black p-2">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
