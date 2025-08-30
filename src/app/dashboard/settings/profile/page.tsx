'use client';

import { Sidebar } from '@/components/common/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  X
} from 'lucide-react';

export default function ProfilePage() {
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
                Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona tu información personal
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Actualiza tu información personal básica
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input id="firstName" defaultValue="Juan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input id="lastName" defaultValue="Pérez" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="juan.perez@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" defaultValue="+34 600 123 456" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input id="position" defaultValue="Desarrollador Senior" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input id="department" defaultValue="Ingeniería" />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Adicional</CardTitle>
                  <CardDescription>
                    Información adicional sobre ti
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Cuéntanos sobre ti..."
                      defaultValue="Desarrollador full-stack con 5 años de experiencia en React, Node.js y TypeScript. Apasionado por crear aplicaciones web escalables y con excelente UX."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" defaultValue="Madrid, España" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input id="website" defaultValue="https://juanperez.dev" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input id="linkedin" defaultValue="https://linkedin.com/in/juanperez" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input id="github" defaultValue="https://github.com/juanperez" />
                  </div>
                </CardContent>
              </Card>

              {/* Skills & Expertise */}
              <Card>
                <CardHeader>
                  <CardTitle>Habilidades y Experiencia</CardTitle>
                  <CardDescription>
                    Tus habilidades técnicas y áreas de expertise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Habilidades Principales</Label>
                      <div className="flex flex-wrap gap-2">
                        {['React', 'TypeScript', 'Node.js', 'Python', 'AWS'].map((skill) => (
                          <Badge key={skill} variant="secondary" className="cursor-pointer">
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input placeholder="Agregar habilidad..." className="flex-1" />
                        <Button variant="outline" size="sm">Agregar</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Certificaciones</Label>
                      <div className="flex flex-wrap gap-2">
                        {['AWS Certified Developer', 'Google Cloud Professional'].map((cert) => (
                          <Badge key={cert} variant="outline" className="cursor-pointer">
                            {cert} ×
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input placeholder="Agregar certificación..." className="flex-1" />
                        <Button variant="outline" size="sm">Agregar</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle>Foto de Perfil</CardTitle>
                  <CardDescription>
                    Actualiza tu foto de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder-avatar.jpg" alt="Juan Pérez" />
                      <AvatarFallback>JP</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Cambiar Foto
                      </Button>
                      <Button variant="outline" size="sm">
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estado</span>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Plan</span>
                      <Badge variant="outline">Pro</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Miembro desde</span>
                      <span className="text-sm text-muted-foreground">Enero 2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Último acceso</span>
                      <span className="text-sm text-muted-foreground">Hace 2 horas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tareas Completadas</span>
                      <span className="text-sm font-bold text-blue-600">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Proyectos Activos</span>
                      <span className="text-sm font-bold text-green-600">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Horas Trabajadas</span>
                      <span className="text-sm font-bold text-orange-600">1,240</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Productividad</span>
                      <span className="text-sm font-bold text-purple-600">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Idioma</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Español</option>
                      <option>English</option>
                      <option>Français</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Zona Horaria</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Madrid (GMT+1)</option>
                      <option>Barcelona (GMT+1)</option>
                      <option>New York (GMT-5)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Formato de Fecha</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
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
