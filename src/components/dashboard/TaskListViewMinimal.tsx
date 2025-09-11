import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types/task';

interface TaskListViewMinimalProps {
  tasks: Task[];
  showCompanyInfo?: boolean;
  getCompanyName?: (companyId: string) => string;
  getCompanyColor?: (companyId: string) => string;
}

export default function TaskListViewMinimal({ 
  tasks, 
  showCompanyInfo = false, 
  getCompanyName, 
  getCompanyColor 
}: TaskListViewMinimalProps) {
  console.log('🔍 TaskListViewMinimal Debug:');
  console.log('  - tasksCount:', tasks.length);
  console.log('  - showCompanyInfo:', showCompanyInfo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lista de Tareas MINIMAL ({tasks.length})</CardTitle>
        <div className="text-sm text-red-500 font-bold">
          MINIMAL: showCompanyInfo = {showCompanyInfo ? 'TRUE' : 'FALSE'}
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-green-100 border-2 border-green-500 overflow-x-auto">
          <h3 className="font-bold text-green-600">MINIMAL TABLE - Should show all columns:</h3>
          <table className="w-full min-w-[900px] border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-2 bg-gray-200 whitespace-nowrap">Tarea</th>
                <th className="border border-black p-2 bg-blue-200 whitespace-nowrap">🏢 Empresa</th>
                <th className="border border-black p-2 bg-green-200 whitespace-nowrap">Prioridad</th>
                <th className="border border-black p-2 bg-purple-200 whitespace-nowrap">Estado</th>
                <th className="border border-black p-2 bg-orange-200 whitespace-nowrap">Vence</th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, 3).map((task) => (
                <tr key={task.id}>
                  <td className="border border-black p-2 whitespace-nowrap">{task.title}</td>
                  <td className="border border-black p-2 whitespace-nowrap">
                    {getCompanyName ? getCompanyName(task.companyId) : 'Unknown Company'}
                  </td>
                  <td className="border border-black p-2 whitespace-nowrap">{task.priority}</td>
                  <td className="border border-black p-2 whitespace-nowrap">{task.status}</td>
                  <td className="border border-black p-2 whitespace-nowrap">
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
