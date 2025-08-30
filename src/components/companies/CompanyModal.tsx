'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Building, 
  Upload, 
  X, 
  Loader2, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  Image as ImageIcon,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  FileText
} from 'lucide-react';
import { 
  CompanyEnhanced, 
  CompanyFormDataEnhanced, 
  companyColorPalette, 
  industryOptions,
  getDefaultCompanyFormData,
  getDefaultIconForIndustry,
  CompanyIconType,
  companyValidationRules
} from '@/types/company-enhanced';
import { CompanyIcon, IconSelector } from './CompanyIcon';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { useAuth } from '@/lib/hooks/useAuth';

// Enhanced validation schema
const companyFormSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  logoUrl: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
  defaultIcon: z.string(),
  color: z.string().min(1, 'Debe seleccionar un color'),
  status: z.enum(['active', 'inactive', 'archived']),
  industry: z.string().optional(),
  website: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Debe ser un email válido')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^\\+?[\\d\\s()-]+$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof companyFormSchema>;

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: CompanyEnhanced | null;
  mode?: 'create' | 'edit';
  onSuccess?: (company: CompanyEnhanced) => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  mode = 'create',
  onSuccess,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { 
    createNewCompany, 
    updateExistingCompany, 
    checkNameExists,
    error: storeError,
    clearError 
  } = useCompanyEnhancedStore();
  
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: getDefaultCompanyFormData(),
  });

  // Load company data when editing
  useEffect(() => {
    if (mode === 'edit' && company) {
      form.reset({
        name: company.name,
        description: company.description || '',
        logoUrl: company.logoUrl || '',
        defaultIcon: company.defaultIcon || 'Building',
        color: company.color,
        status: company.status,
        industry: company.industry || '',
        website: company.website || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
        },
      });
      if (company.logoUrl) {
        setLogoPreview(company.logoUrl);
      }
    } else {
      form.reset(getDefaultCompanyFormData());
      setLogoFile(null);
      setLogoPreview('');
    }
  }, [mode, company, form]);

  // Handle logo file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size and type
      if (file.size > companyValidationRules.logoFile.maxSize) {
        setNotification({
          type: 'error',
          message: 'El archivo es demasiado grande. Máximo 5MB.',
        });
        return;
      }

      if (!companyValidationRules.logoFile.acceptedFormats.includes(file.type)) {
        setNotification({
          type: 'error',
          message: 'Formato de archivo no válido. Use JPG, PNG, GIF, SVG o WebP.',
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
        form.setValue('logoUrl', ''); // Clear URL when file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear logo
  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    form.setValue('logoUrl', '');
  };

  // Handle industry change to auto-set icon
  const handleIndustryChange = (industry: string) => {
    const defaultIcon = getDefaultIconForIndustry(industry);
    form.setValue('defaultIcon', defaultIcon);
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setNotification(null);
    clearError();

    try {
      // Check if name exists (for create mode or when name changed)
      if (mode === 'create' || (company && data.name !== company.name)) {
        const nameExists = await checkNameExists(data.name, company?.id);
        if (nameExists) {
          setNotification({
            type: 'error',
            message: 'Ya existe una empresa con este nombre',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const formData: CompanyFormDataEnhanced = {
        ...data,
        logoFile: logoFile || undefined,
        logoUrl: logoPreview || data.logoUrl || undefined,
        defaultIcon: data.defaultIcon as CompanyIconType,
      };

      let result: CompanyEnhanced;

      if (mode === 'create') {
        result = await createNewCompany(formData, user?.uid || 'current-user');
      } else if (company) {
        await updateExistingCompany(company.id, formData);
        result = { ...company, ...formData };
      } else {
        throw new Error('No company data for edit mode');
      }

      setNotification({
        type: 'success',
        message: `Empresa ${mode === 'create' ? 'creada' : 'actualizada'} exitosamente`,
      });

      onSuccess?.(result);
      
      setTimeout(() => {
        onClose();
        setNotification(null);
      }, 1500);
      
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Building className="h-5 w-5" />
                Crear Nueva Empresa
              </>
            ) : (
              <>
                <Building className="h-5 w-5" />
                Editar Empresa
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Complete la información de la nueva empresa'
              : 'Modifique la información de la empresa'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Notifications */}
        {(notification || storeError) && (
          <Alert className={`${
            notification?.type === 'error' || storeError ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
          }`}>
            {notification?.type === 'error' || storeError ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {notification?.message || storeError}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Información Básica</TabsTrigger>
                <TabsTrigger value="branding">Imagen y Marca</TabsTrigger>
                <TabsTrigger value="contact">Contacto y Ubicación</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ingrese el nombre de la empresa" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descripción breve de la empresa..."
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional. Máximo 500 caracteres.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industria</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleIndustryChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar industria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {industryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Activa
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                Inactiva
                              </div>
                            </SelectItem>
                            <SelectItem value="archived">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-500" />
                                Archivada
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Logo de la Empresa
                  </Label>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      {/* Logo URL Input */}
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL del Logo</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://ejemplo.com/logo.png"
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (e.target.value) {
                                    setLogoPreview(e.target.value);
                                    setLogoFile(null);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* File Upload */}
                      <div className="space-y-2">
                        <Label>O subir archivo</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearLogo}
                            disabled={!logoFile && !logoPreview}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, GIF, SVG o WebP. Máximo 5MB.
                        </p>
                      </div>
                    </div>

                    {/* Logo Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Icon Selection */}
                <FormField
                  control={form.control}
                  name="defaultIcon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono por Defecto</FormLabel>
                      <FormControl>
                        <IconSelector
                          value={field.value as CompanyIconType}
                          onChange={field.onChange}
                          color={form.watch('color')}
                        />
                      </FormControl>
                      <FormDescription>
                        Icono que se mostrará cuando no haya logo disponible
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color Selection */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color de la Empresa *
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-6 gap-2">
                          {companyColorPalette.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => field.onChange(color.value)}
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                field.value === color.value
                                  ? 'border-gray-900 scale-110'
                                  : 'border-gray-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <Label className="text-sm font-medium mb-2 block">Vista Previa</Label>
                  <div className="flex items-center gap-3">
                    <CompanyIcon
                      logoUrl={logoPreview || form.watch('logoUrl')}
                      defaultIcon={form.watch('defaultIcon') as CompanyIconType}
                      name={form.watch('name') || 'Empresa'}
                      color={form.watch('color')}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold">{form.watch('name') || 'Nombre de la empresa'}</h3>
                      <p className="text-sm text-gray-600">{form.watch('description') || 'Descripción de la empresa'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Sitio Web
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://www.empresa.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="contacto@empresa.com" type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Teléfono
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+52 55 1234 5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </Label>
                  
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calle</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Calle Principal #123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ciudad de México" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado/Provincia</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CDMX" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="México" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Postal</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="01000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Crear Empresa' : 'Guardar Cambios'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};