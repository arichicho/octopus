import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Calendar,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐙</span>
            </div>
            <span className="font-semibold text-lg">Octopus Demo</span>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              Volver al Inicio
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Demo de Octopus</h1>
          <p className="text-muted-foreground">
            Explora las funcionalidades del sistema de gestión de tareas
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                8 pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">16</div>
              <p className="text-xs text-muted-foreground">
                67% de completitud
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">3</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                Activas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Views */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard - 3 Vistas</span>
            </CardTitle>
            <CardDescription>
              Diferentes perspectivas para gestionar tus tareas y proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="my-day" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="my-day">Mi Día</TabsTrigger>
                <TabsTrigger value="executive">Resumen Ejecutivo</TabsTrigger>
                <TabsTrigger value="workflow">Flujo de Trabajo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-day" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Tareas para Hoy</h3>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Tarea
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">Revisar propuesta de cliente</h4>
                          <Badge className="bg-red-100 text-red-800">urgente</Badge>
                          <Badge variant="outline">en progreso</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Analizar y aprobar la propuesta del proyecto web
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">14:00</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={75} className="w-20 h-2" />
                            <span className="text-xs text-muted-foreground">75%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">Preparar presentación</h4>
                          <Badge className="bg-orange-100 text-orange-800">alta</Badge>
                          <Badge variant="outline">pendiente</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Crear slides para la reunión de equipo
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">16:00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="executive" className="mt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Tareas por Empresa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">TechCorp</span>
                            <Badge variant="outline">12 tareas</Badge>
                          </div>
                          <Progress value={80} className="w-full" />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">DesignStudio</span>
                            <Badge variant="outline">8 tareas</Badge>
                          </div>
                          <Progress value={60} className="w-full" />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">MarketingPro</span>
                            <Badge variant="outline">4 tareas</Badge>
                          </div>
                          <Progress value={90} className="w-full" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Tareas Críticas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="text-sm font-medium">Revisar propuesta</span>
                            <Badge className="bg-red-100 text-red-800">urgente</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="text-sm font-medium">Actualizar API</span>
                            <Badge className="bg-red-100 text-red-800">vencida</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="text-sm font-medium">Test de seguridad</span>
                            <Badge className="bg-red-100 text-red-800">urgente</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="workflow" className="mt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Progreso Semanal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Tareas iniciadas</span>
                            <Badge variant="outline">8</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Tareas completadas</span>
                            <Badge variant="outline">12</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Tasa de completitud</span>
                            <Badge variant="outline">67%</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Próximos Hitos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Lanzamiento v2.0 - 15/09</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Reunión cliente - 12/09</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">Code review - 10/09</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Multi-Empresa</CardTitle>
              <CardDescription>
                Gestiona tareas de múltiples empresas desde una sola interfaz
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Dashboard Inteligente</CardTitle>
              <CardDescription>
                3 vistas diferentes para analizar tu productividad
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Integraciones</CardTitle>
              <CardDescription>
                Conecta con Google Calendar, Drive y Claude AI
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-2">¿Listo para comenzar?</h3>
            <p className="text-muted-foreground mb-4">
              Configura Firebase y comienza a usar Octopus con todas sus funcionalidades
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild>
                <Link href="https://console.firebase.google.com/" target="_blank">
                  Configurar Firebase
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Volver al Inicio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
