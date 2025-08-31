'use client';

import React, { KeyboardEvent } from 'react';
import { Control, FieldError, UseFormSetValue, UseFormGetValues, FieldValues } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Plus, 
  X, 
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Link,
  FileText,
  Calendar as CalendarIconOutline
} from 'lucide-react';
import { TaskFormData, priorityOptions, statusOptions } from '@/types/forms';
import { Company } from '@/types/company';
import { CompanyEnhanced } from '@/types/company-enhanced';

interface BaseFieldProps {
  control: Control<TaskFormData>;
  name: keyof TaskFormData;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

// Text Input Field
interface TextFieldProps extends BaseFieldProps {
  placeholder?: string;
  maxLength?: number;
}

export const TextField: React.FC<TextFieldProps> = ({
  control,
  name,
  label,
  description,
  placeholder,
  maxLength,
  required = false,
  disabled = false,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field, fieldState: { error } }) => (
      <FormItem>
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className={cn(error && "border-red-500 focus-visible:ring-red-500")}
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

// Textarea Field
interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  control,
  name,
  label,
  description,
  placeholder,
  rows = 3,
  maxLength,
  required = false,
  disabled = false,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field, fieldState: { error } }) => (
      <FormItem>
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </FormLabel>
        <FormControl>
          <div className="relative">
            <Textarea
              {...field}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              disabled={disabled}
              className={cn(
                error && "border-red-500 focus-visible:ring-red-500",
                "resize-none"
              )}
            />
            {maxLength && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {(field.value || '').length}/{maxLength}
              </div>
            )}
          </div>
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

// Company Select Field
interface CompanySelectFieldProps extends BaseFieldProps {
  companies: Company[] | CompanyEnhanced[];
}

export const CompanySelectField: React.FC<CompanySelectFieldProps> = ({
  control,
  name,
  label,
  description,
  companies,
  required = true,
  disabled = false,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field, fieldState: { error } }) => (
      <FormItem>
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          <Building2 className="inline h-4 w-4 mr-1" />
          {label}
        </FormLabel>
        <Select
          onValueChange={field.onChange}
          value={field.value}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger className={cn(error && "border-red-500")}>
              <SelectValue placeholder="Seleccionar empresa" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: company.color }}
                  />
                  <span>{company.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

// Priority Select Field
export const PrioritySelectField: React.FC<BaseFieldProps> = ({
  control,
  name,
  label,
  description,
  required = true,
  disabled = false,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field, fieldState: { error } }) => (
      <FormItem>
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          {label}
        </FormLabel>
        <Select
          onValueChange={field.onChange}
          value={field.value}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger className={cn(error && "border-red-500")}>
              <SelectValue placeholder="Seleccionar prioridad" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full bg-${option.color}-500`} />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

// Status Select Field
export const StatusSelectField: React.FC<BaseFieldProps> = ({
  control,
  name,
  label,
  description,
  required = true,
  disabled = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'in_progress': return <AlertTriangle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
            {getStatusIcon(field.value)}
            <span className="ml-1">{label}</span>
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className={cn(error && "border-red-500")}>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(option.value)}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Date Picker Field
export const DatePickerField: React.FC<BaseFieldProps> = ({
  control,
  name,
  label,
  description,
  required = false,
  disabled = false,
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field, fieldState: { error } }) => (
      <FormItem className="flex flex-col">
        <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          <CalendarIconOutline className="inline h-4 w-4 mr-1" />
          {label}
        </FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !field.value && "text-muted-foreground",
                  error && "border-red-500"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value && !isNaN(field.value.getTime()) ? (
                  format(field.value, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={(date) =>
                date < new Date() || date < new Date("1900-01-01")
              }
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
);

// Tags Field
interface TagsFieldProps extends BaseFieldProps {
  placeholder?: string;
  maxTags?: number;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const TagsField: React.FC<TagsFieldProps> = ({
  control,
  name,
  label,
  description,
  placeholder = "Agregar etiqueta...",
  maxTags = 20,
  onAddTag,
  onRemoveTag,
  required = false,
  disabled = false,
}) => {
  const [tagInput, setTagInput] = React.useState('');
  
  // Tags predeterminados sugeridos
  const suggestedTags = ['Follow Up', 'Propuesta', 'Llamar'];

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag) {
        onAddTag(tag);
        setTagInput('');
      }
    }
  };

  const handleAddClick = () => {
    const tag = tagInput.trim();
    if (tag) {
      onAddTag(tag);
      setTagInput('');
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
            {label}
          </FormLabel>
          <FormControl>
            <div className="space-y-2">
              {/* Tags sugeridos */}
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => {
                  const isSelected = field.value && field.value.includes(tag);
                  return (
                    <Badge 
                      key={tag} 
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "px-2 py-1 cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      onClick={() => {
                        if (!disabled && (!field.value || field.value.length < maxTags)) {
                          if (isSelected) {
                            onRemoveTag(tag);
                          } else {
                            onAddTag(tag);
                          }
                        }
                      }}
                    >
                      {tag}
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTag(tag);
                          }}
                          className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                          disabled={disabled}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
              
              {/* Tags actuales */}
              {field.value && field.value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="px-2 py-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => onRemoveTag(tag)}
                        className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Input para nuevos tags */}
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled || (field.value && field.value.length >= maxTags)}
                  className={cn(error && "border-red-500")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddClick}
                  disabled={!tagInput.trim() || disabled || (field.value && field.value.length >= maxTags)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FormControl>
          {description && (
            <FormDescription>
              {description}
              {maxTags && field.value && (
                <span className="block text-xs mt-1">
                  {field.value.length}/{maxTags} etiquetas
                </span>
              )}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Multi-Select Email Field for Assigned Users
interface EmailMultiSelectProps extends BaseFieldProps {
  placeholder?: string;
  maxUsers?: number;
  onAddUser: (email: string) => void;
  onRemoveUser: (email: string) => void;
}

export const EmailMultiSelectField: React.FC<EmailMultiSelectProps> = ({
  control,
  name,
  label,
  description,
  placeholder = "usuario@empresa.com",
  maxUsers = 10,
  onAddUser,
  onRemoveUser,
  required = false,
  disabled = false,
}) => {
  const [emailInput, setEmailInput] = React.useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const email = emailInput.trim();
      if (email) {
        onAddUser(email);
        setEmailInput('');
      }
    }
  };

  const handleAddClick = () => {
    const email = emailInput.trim();
    if (email) {
      onAddUser(email);
      setEmailInput('');
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
            <User className="inline h-4 w-4 mr-1" />
            {label}
          </FormLabel>
          <FormControl>
            <div className="space-y-2">
              {field.value && field.value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((email: string) => (
                    <Badge key={email} variant="outline" className="px-2 py-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => onRemoveUser(email)}
                        className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled || (field.value && field.value.length >= maxUsers)}
                  className={cn(error && "border-red-500")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddClick}
                  disabled={!emailInput.trim() || disabled || (field.value && field.value.length >= maxUsers)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FormControl>
          {description && (
            <FormDescription>
              {description}
              {maxUsers && field.value && (
                <span className="block text-xs mt-1">
                  {field.value.length}/{maxUsers} usuarios
                </span>
              )}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// URL List Field for Linked Documents
interface UrlListFieldProps extends BaseFieldProps {
  placeholder?: string;
  maxUrls?: number;
  onAddUrl: (url: string) => void;
  onRemoveUrl: (url: string) => void;
}

export const UrlListField: React.FC<UrlListFieldProps> = ({
  control,
  name,
  label,
  description,
  placeholder = "https://ejemplo.com/documento",
  maxUrls = 5,
  onAddUrl,
  onRemoveUrl,
  required = false,
  disabled = false,
}) => {
  const [urlInput, setUrlInput] = React.useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const url = urlInput.trim();
      if (url) {
        onAddUrl(url);
        setUrlInput('');
      }
    }
  };

  const handleAddClick = () => {
    const url = urlInput.trim();
    if (url) {
      onAddUrl(url);
      setUrlInput('');
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
            <Link className="inline h-4 w-4 mr-1" />
            {label}
          </FormLabel>
          <FormControl>
            <div className="space-y-2">
              {field.value && field.value.length > 0 && (
                <div className="space-y-1">
                  {field.value.map((url: string) => (
                    <div key={url} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm truncate flex-1"
                      >
                        <FileText className="inline h-3 w-3 mr-1" />
                        {url}
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemoveUrl(url)}
                        className="ml-2 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-1"
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled || (field.value && field.value.length >= maxUrls)}
                  className={cn(error && "border-red-500")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddClick}
                  disabled={!urlInput.trim() || disabled || (field.value && field.value.length >= maxUrls)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FormControl>
          {description && (
            <FormDescription>
              {description}
              {maxUrls && field.value && (
                <span className="block text-xs mt-1">
                  {field.value.length}/{maxUrls} documentos
                </span>
              )}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};