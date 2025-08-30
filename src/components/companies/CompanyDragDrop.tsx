'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CompanyEnhanced } from '@/types/company-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  GripVertical, 
  ChevronRight,
  Plus,
  MoreHorizontal
} from 'lucide-react';

interface CompanyDragDropProps {
  companies: CompanyEnhanced[];
  onReorder: (companies: CompanyEnhanced[]) => void;
  onSelectCompany: (company: CompanyEnhanced) => void;
  onCreateTask: (company: CompanyEnhanced) => void;
  onEditCompany: (company: CompanyEnhanced) => void;
  selectedCompanyId?: string;
}

interface SortableCompanyItemProps {
  company: CompanyEnhanced;
  isSelected: boolean;
  onSelect: () => void;
  onCreateTask: () => void;
  onEdit: () => void;
}

function SortableCompanyItem({ 
  company, 
  isSelected, 
  onSelect, 
  onCreateTask, 
  onEdit 
}: SortableCompanyItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected 
            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${company.color}20` }}
              >
                <Building2 className="h-5 w-5" style={{ color: company.color }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{company.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    variant={company.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {company.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                  {company.industry && (
                    <Badge variant="outline" className="text-xs">
                      {company.industry}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTask();
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Crear tarea"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Editar empresa"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

export function CompanyDragDrop({
  companies,
  onReorder,
  onSelectCompany,
  onCreateTask,
  onEditCompany,
  selectedCompanyId,
}: CompanyDragDropProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = companies.findIndex(company => company.id === active.id);
      const newIndex = companies.findIndex(company => company.id === over?.id);
      
      const newCompanies = arrayMove(companies, oldIndex, newIndex);
      onReorder(newCompanies);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={companies.map(company => company.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {companies.map((company) => (
            <SortableCompanyItem
              key={company.id}
              company={company}
              isSelected={selectedCompanyId === company.id}
              onSelect={() => onSelectCompany(company)}
              onCreateTask={() => onCreateTask(company)}
              onEdit={() => onEditCompany(company)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
