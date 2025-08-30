import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  TaskFormData, 
  taskFormSchema, 
  getDefaultTaskFormValues,
  TaskFormSubmissionResult 
} from '@/types/forms';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';

interface UseTaskFormProps {
  initialCompanyId?: string;
  onSuccess?: (result: TaskFormSubmissionResult) => void;
  onError?: (error: string) => void;
  autoSaveInterval?: number; // milliseconds
}

export const useTaskForm = ({
  initialCompanyId,
  onSuccess,
  onError,
  autoSaveInterval = 30000, // 30 seconds
}: UseTaskFormProps = {}) => {
  const { createTask } = useTaskStore();
  const { companies } = useCompanyEnhancedStore();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize form with react-hook-form
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: getDefaultTaskFormValues(initialCompanyId),
    mode: 'onChange', // Validate on change for real-time feedback
  });

  const { 
    handleSubmit, 
    reset, 
    watch, 
    formState: { errors, isValid, isDirty },
    setValue,
    getValues,
  } = form;

  // Set companyId when initialCompanyId is provided
  useEffect(() => {
    if (initialCompanyId) {
      setValue('companyId', initialCompanyId, { shouldValidate: true });
    }
  }, [initialCompanyId, setValue]);

  // Watch all form values for auto-save
  const watchedValues = watch();

  // Get available companies for dropdown
  const getCompanyOptions = useCallback(() => {
    return companies.map(company => ({
      value: company.id,
      label: company.name,
      color: company.color,
    }));
  }, [companies]);

  // Get available parent tasks for dropdown
  const getParentTaskOptions = useCallback(() => {
    // This would come from a tasks store or API
    // For now, return empty array
    return [];
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return null;
      const currentValues = getValues();
      const currentDraftId = draftId || uuidv4();
      
      const draftData = {
        id: currentDraftId,
        data: currentValues,
        timestamp: new Date().toISOString(),
        companyId: currentValues.companyId,
      };

      // Save to localStorage
      const existingDrafts = JSON.parse(localStorage.getItem('task-drafts') || '[]');
      const updatedDrafts = existingDrafts.filter((draft: any) => draft.id !== currentDraftId);
      updatedDrafts.push(draftData);
      localStorage.setItem('task-drafts', JSON.stringify(updatedDrafts));

      setDraftId(currentDraftId);
      setLastSaved(new Date());
      setIsDraft(true);

      return currentDraftId;
    } catch (error) {
      console.error('Error saving draft:', error);
      return null;
    }
  }, [getValues, draftId]);

  // Clean up invalid drafts on mount
  useEffect(() => {
    try {
      const drafts = JSON.parse(localStorage.getItem('task-drafts') || '[]');
      const validDrafts = drafts.filter((draft: any) => draft.data?.title);
      if (validDrafts.length !== drafts.length) {
        localStorage.setItem('task-drafts', JSON.stringify(validDrafts));
        console.log('🧹 Cleaned up', drafts.length - validDrafts.length, 'invalid drafts');
      }
    } catch (error) {
      console.error('Error cleaning drafts:', error);
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && autoSaveInterval > 0) {
      // Clear existing interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }

      // Set new interval
      autoSaveIntervalRef.current = setInterval(() => {
        if (isDirty) {
          saveDraft();
        }
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isDirty, autoSaveInterval, saveDraft]);

  // Load draft from localStorage
  const loadDraft = useCallback((id: string) => {
    try {
      if (typeof window === 'undefined') return false;
      const drafts = JSON.parse(localStorage.getItem('task-drafts') || '[]');
      const draft = drafts.find((d: any) => d.id === id);
      
      if (draft) {
        reset(draft.data);
        setDraftId(id);
        setLastSaved(new Date(draft.timestamp));
        setIsDraft(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading draft:', error);
      return false;
    }
  }, [reset]);

  // Get all drafts for current company
  const getDrafts = useCallback(() => {
    try {
      if (typeof window === 'undefined') return [];
      const drafts = JSON.parse(localStorage.getItem('task-drafts') || '[]');
      // Filter out invalid drafts (without title) and by company
      return drafts.filter((draft: any) => 
        draft.data?.title && // Must have a title
        (!initialCompanyId || draft.companyId === initialCompanyId)
      );
    } catch (error) {
      console.error('Error getting drafts:', error);
      return [];
    }
  }, [initialCompanyId]);

  // Delete draft
  const deleteDraft = useCallback((id?: string) => {
    try {
      if (typeof window === 'undefined') return;
      const targetId = id || draftId;
      if (!targetId) return;

      const drafts = JSON.parse(localStorage.getItem('task-drafts') || '[]');
      const updatedDrafts = drafts.filter((draft: any) => draft.id !== targetId);
      localStorage.setItem('task-drafts', JSON.stringify(updatedDrafts));

      if (targetId === draftId) {
        setDraftId(null);
        setIsDraft(false);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [draftId]);

  // Submit form as draft
  const submitAsDraft = useCallback(async () => {
    const draftId = await saveDraft();
    if (draftId) {
      onSuccess?.({ 
        success: true, 
        data: getValues(),
        taskId: draftId 
      });
    }
  }, [saveDraft, onSuccess, getValues]);

  // Submit form to create task
  const onSubmit = useCallback(async (data: TaskFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create task and get the actual ID from Firebase
      const createdTask = await createTask({
        ...data,
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : undefined,
        createdBy: user?.uid || 'current-user',
      });

      console.log('✅ Task created successfully:', createdTask);

      // Delete draft if exists
      if (draftId) {
        deleteDraft();
      }

      // Reset form
      reset(getDefaultTaskFormValues(initialCompanyId));
      
      const result: TaskFormSubmissionResult = {
        success: true,
        data,
        taskId: createdTask?.id || uuidv4(), // Use actual Firebase ID
      };

      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [createTask, draftId, deleteDraft, reset, initialCompanyId, onSuccess, onError]);

  // Reset form with new company
  const resetWithCompany = useCallback((companyId: string) => {
    reset(getDefaultTaskFormValues(companyId));
    setDraftId(null);
    setIsDraft(false);
    setLastSaved(null);
  }, [reset]);

  // Add tag
  const addTag = useCallback((tag: string) => {
    const currentTags = getValues('tags') || [];
    const trimmedTag = tag.trim();
    
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      setValue('tags', [...currentTags, trimmedTag], { shouldDirty: true });
    }
  }, [getValues, setValue]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = getValues('tags') || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true });
  }, [getValues, setValue]);

  // Add assigned user
  const addAssignedUser = useCallback((email: string) => {
    const currentUsers = getValues('assignedTo') || [];
    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmedEmail) && !currentUsers.includes(trimmedEmail)) {
      setValue('assignedTo', [...currentUsers, trimmedEmail], { shouldDirty: true });
    }
  }, [getValues, setValue]);

  // Remove assigned user
  const removeAssignedUser = useCallback((email: string) => {
    const currentUsers = getValues('assignedTo') || [];
    setValue('assignedTo', currentUsers.filter(user => user !== email), { shouldDirty: true });
  }, [getValues, setValue]);

  // Add linked document
  const addLinkedDocument = useCallback((url: string) => {
    const currentDocs = getValues('linkedDocuments') || [];
    const trimmedUrl = url.trim();
    
    // Basic URL validation
    try {
      new URL(trimmedUrl);
      if (!currentDocs.includes(trimmedUrl)) {
        setValue('linkedDocuments', [...currentDocs, trimmedUrl], { shouldDirty: true });
      }
    } catch {
      // Invalid URL, ignore
    }
  }, [getValues, setValue]);

  // Remove linked document
  const removeLinkedDocument = useCallback((url: string) => {
    const currentDocs = getValues('linkedDocuments') || [];
    setValue('linkedDocuments', currentDocs.filter(doc => doc !== url), { shouldDirty: true });
  }, [getValues, setValue]);

  return {
    // Form methods
    form,
    handleSubmit: handleSubmit(onSubmit),
    reset,
    setValue,
    getValues,
    watch,
    
    // Form state
    errors,
    isValid,
    isDirty,
    isSubmitting,
    
    // Draft functionality
    isDraft,
    lastSaved,
    saveDraft,
    submitAsDraft,
    loadDraft,
    getDrafts,
    deleteDraft,
    
    // Helper functions
    resetWithCompany,
    getCompanyOptions,
    getParentTaskOptions,
    
    // Array field helpers
    addTag,
    removeTag,
    addAssignedUser,
    removeAssignedUser,
    addLinkedDocument,
    removeLinkedDocument,
    
    // Watched values for conditional rendering
    watchedValues,
  };
};