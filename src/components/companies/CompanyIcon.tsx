'use client';

import React from 'react';
import {
  Building,
  Building2,
  Factory,
  Briefcase,
  Store,
  Home,
  Warehouse,
  Landmark,
  School,
  Hospital,
  Plane,
  Ship,
  Truck,
  Rocket,
  Globe,
  Zap,
  Coffee,
  ShoppingBag,
  Heart,
  Cpu,
  LucideIcon,
} from 'lucide-react';
import { CompanyIconType } from '@/types/company-enhanced';
import { cn } from '@/lib/utils';

// Map icon names to Lucide components
const iconMap: Record<CompanyIconType, LucideIcon> = {
  Building,
  Building2,
  Factory,
  Briefcase,
  Store,
  Home,
  Warehouse,
  Landmark,
  School,
  Hospital,
  Plane,
  Ship,
  Truck,
  Rocket,
  Globe,
  Zap,
  Coffee,
  ShoppingBag,
  Heart,
  Cpu,
};

interface CompanyIconProps {
  logoUrl?: string;
  defaultIcon?: CompanyIconType;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  showFallback?: boolean;
}

export const CompanyIcon: React.FC<CompanyIconProps> = ({
  logoUrl,
  defaultIcon = 'Building',
  name,
  size = 'md',
  color = '#3B82F6',
  className,
  showFallback = true,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  // Size mappings
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const containerSize = sizeClasses[size];
  const iconSize = iconSizeClasses[size];

  // Get the icon component
  const IconComponent = iconMap[defaultIcon] || Building;

  // Reset error state when logoUrl changes
  React.useEffect(() => {
    if (logoUrl) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [logoUrl]);

  // If we have a logo URL and it hasn't errored, show the image
  if (logoUrl && !imageError) {
    return (
      <div 
        className={cn(
          containerSize,
          'relative rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          className
        )}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-full h-full"></div>
          </div>
        )}
        <img
          src={logoUrl}
          alt={`Logo de ${name}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </div>
    );
  }

  // Show the default icon
  return (
    <div
      className={cn(
        containerSize,
        'rounded-lg flex items-center justify-center',
        className
      )}
      style={{ backgroundColor: `${color}20` }}
    >
      <IconComponent 
        className={cn(iconSize)}
        style={{ color }}
      />
    </div>
  );
};

// Component to display company avatar with fallback to initials
interface CompanyAvatarProps {
  logoUrl?: string;
  defaultIcon?: CompanyIconType;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
  logoUrl,
  defaultIcon = 'Building',
  name,
  size = 'md',
  color = '#3B82F6',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  // Size mappings
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };

  const containerSize = sizeClasses[size];

  // Get initials from company name
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  // Reset error state when logoUrl changes
  React.useEffect(() => {
    if (logoUrl) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [logoUrl]);

  // If we have a logo URL and it hasn't errored, show the image
  if (logoUrl && !imageError) {
    return (
      <div 
        className={cn(
          containerSize,
          'relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800',
          className
        )}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full w-full h-full"></div>
          </div>
        )}
        <img
          src={logoUrl}
          alt={`Logo de ${name}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </div>
    );
  }

  // Show initials as fallback
  return (
    <div
      className={cn(
        containerSize,
        'rounded-full flex items-center justify-center font-semibold text-white',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
};

// Icon selector component for forms
interface IconSelectorProps {
  value: CompanyIconType;
  onChange: (icon: CompanyIconType) => void;
  color?: string;
  disabled?: boolean;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  value,
  onChange,
  color = '#3B82F6',
  disabled = false,
}) => {
  const icons = Object.keys(iconMap) as CompanyIconType[];
  
  return (
    <div className="grid grid-cols-5 gap-2">
      {icons.map((iconName) => {
        const IconComponent = iconMap[iconName];
        const isSelected = value === iconName;
        
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => !disabled && onChange(iconName)}
            disabled={disabled}
            className={cn(
              'p-2 rounded-lg border-2 transition-all',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title={iconName}
          >
            <IconComponent 
              className="h-5 w-5 mx-auto"
              style={{ color: isSelected ? color : undefined }}
            />
          </button>
        );
      })}
    </div>
  );
};