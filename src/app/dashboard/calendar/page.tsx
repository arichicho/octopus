'use client';

import { Sidebar } from '@/components/common/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin
} from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Calendario
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona tu agenda y eventos
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4 mr-2" />
                Siguiente
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Evento
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Agosto 2024</CardTitle>
                      <CardDescription>Calendario de eventos y tareas</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">Mes</Button>
                      <Button variant="outline" size="sm">Semana</Button>
                      <Button variant="outline" size="sm">Día</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {/* Calendar days */}
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const hasEvent = [1, 5, 8, 12, 15, 20, 25, 28].includes(day);
                      const isToday = day === 27;
                      
                      return (
                        <div
                          key={day}
                          className={`p-2 min-h-[80px] border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">{day}</div>
                          {hasEvent && (
                            <div className="space-y-1">
                              <div className="w-full h-1 bg-blue-500 rounded"></div>
                              {day === 5 && <div className="w-full h-1 bg-green-500 rounded"></div>}
                              {day === 15 && <div className="w-full h-1 bg-red-500 rounded"></div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events Sidebar */}
            <div className="space-y-6">
              {/* Today's Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Hoy
                  </CardTitle>
                  <CardDescription>27 de agosto, 2024</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        time: "09:00 - 10:00",
                        title: "Daily Standup",
                        type: "meeting",
                        participants: 8
                      },
                      {
                        time: "14:00 - 15:30",
                        title: "Revisión de Proyecto",
                        type: "review",
                        participants: 5
                      },
                      {
                        time: "16:00 - 17:00",
                        title: "Entrevista Candidato",
                        type: "interview",
                        participants: 3
                      }
                    ].map((event, index) => (
                      <div key={index} className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{event.time}</span>
                            </div>
                            <h4 className="font-medium text-sm mt-1">{event.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{event.participants} participantes</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.type === 'meeting' ? 'Reunión' : 
                             event.type === 'review' ? 'Revisión' : 'Entrevista'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Eventos</CardTitle>
                  <CardDescription>Esta semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        date: "Mañana",
                        time: "10:00",
                        title: "Sprint Planning",
                        location: "Sala de Reuniones"
                      },
                      {
                        date: "Jueves",
                        time: "15:00",
                        title: "Demo de Producto",
                        location: "Auditorio"
                      },
                      {
                        date: "Viernes",
                        time: "11:00",
                        title: "Retrospectiva",
                        location: "Sala de Reuniones"
                      }
                    ].map((event, index) => (
                      <div key={index} className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-start space-x-3">
                          <div className="text-center">
                            <div className="text-xs font-medium text-blue-600">{event.date}</div>
                            <div className="text-xs text-gray-500">{event.time}</div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Evento
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Invitar Participantes
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Ver Disponibilidad
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
