'use client';

import React, { useEffect } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { CompanyIcon } from './CompanyIcon';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';

interface CompanySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
  className?: string;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Seleccionar empresa...",
  disabled = false,
  onCreateNew,
  showCreateButton = true,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const { 
    activeCompanies, 
    fetchActiveCompanies, 
    loading 
  } = useCompanyEnhancedStore();

  // Load active companies on mount
  useEffect(() => {
    if (activeCompanies.length === 0) {
      fetchActiveCompanies();
    }
  }, [activeCompanies.length, fetchActiveCompanies]);

  const selectedCompany = activeCompanies.find(company => company.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedCompany ? (
            <div className="flex items-center space-x-2">
              <CompanyIcon
                logoUrl={selectedCompany.logoUrl}
                defaultIcon={selectedCompany.defaultIcon}
                name={selectedCompany.name}
                color={selectedCompany.color}
                size="xs"
              />
              <span className="truncate">{selectedCompany.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm">Cargando...</span>
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  No se encontraron empresas.
                  {showCreateButton && onCreateNew && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCreateNew}
                      className="mt-2 w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear nueva empresa
                    </Button>
                  )}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {activeCompanies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <CompanyIcon
                      logoUrl={company.logoUrl}
                      defaultIcon={company.defaultIcon}
                      name={company.name}
                      color={company.color}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{company.name}</div>
                      {company.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {company.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
              {showCreateButton && onCreateNew && activeCompanies.length > 0 && (
                <>
                  <div className="px-2 py-1">
                    <div className="border-t" />
                  </div>
                  <CommandItem onSelect={onCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Crear nueva empresa</span>
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Enhanced version with multi-select capability
interface MultiCompanySelectorProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
  className?: string;
  maxSelection?: number;
}

export const MultiCompanySelector: React.FC<MultiCompanySelectorProps> = ({
  value = [],
  onValueChange,
  placeholder = "Seleccionar empresas...",
  disabled = false,
  onCreateNew,
  showCreateButton = true,
  className,
  maxSelection,
}) => {
  const [open, setOpen] = React.useState(false);
  const { 
    activeCompanies, 
    fetchActiveCompanies, 
    loading 
  } = useCompanyEnhancedStore();

  // Load active companies on mount
  useEffect(() => {
    if (activeCompanies.length === 0) {
      fetchActiveCompanies();
    }
  }, [activeCompanies.length, fetchActiveCompanies]);

  const selectedCompanies = activeCompanies.filter(company => value.includes(company.id));

  const handleToggle = (companyId: string) => {
    if (value.includes(companyId)) {
      onValueChange(value.filter(id => id !== companyId));
    } else if (!maxSelection || value.length < maxSelection) {
      onValueChange([...value, companyId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-10", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedCompanies.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedCompanies.slice(0, 2).map((company) => (
                <div
                  key={company.id}
                  className="flex items-center space-x-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-sm text-xs"
                >
                  <CompanyIcon
                    logoUrl={company.logoUrl}
                    defaultIcon={company.defaultIcon}
                    name={company.name}
                    color={company.color}
                    size="xs"
                  />
                  <span className="truncate max-w-20">{company.name}</span>
                </div>
              ))
            )}
            {selectedCompanies.length > 2 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{selectedCompanies.length - 2} más
              </span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empresas..." />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm">Cargando...</span>
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  No se encontraron empresas.
                  {showCreateButton && onCreateNew && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCreateNew}
                      className="mt-2 w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear nueva empresa
                    </Button>
                  )}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {maxSelection && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {value.length}/{maxSelection} seleccionadas
                </div>
              )}
              {activeCompanies.map((company) => {
                const isSelected = value.includes(company.id);
                const isDisabled = maxSelection && value.length >= maxSelection && !isSelected;
                
                return (
                  <CommandItem
                    key={company.id}
                    value={company.id}
                    onSelect={() => !isDisabled && handleToggle(company.id)}
                    className={cn(isDisabled && "opacity-50 cursor-not-allowed")}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <CompanyIcon
                        logoUrl={company.logoUrl}
                        defaultIcon={company.defaultIcon}
                        name={company.name}
                        color={company.color}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{company.name}</div>
                        {company.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {company.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
              {showCreateButton && onCreateNew && activeCompanies.length > 0 && (
                <>
                  <div className="px-2 py-1">
                    <div className="border-t" />
                  </div>
                  <CommandItem onSelect={onCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Crear nueva empresa</span>
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};