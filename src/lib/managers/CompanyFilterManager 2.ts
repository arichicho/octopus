import { CompanyEnhanced } from '@/types/company-enhanced';

/**
 * Company filter manager
 * Centralizes logic for filtering companies by user ownership
 */

export interface CompanyFilterOptions {
  userId?: string;
  userEmail?: string;
  includeExtraCompanies?: boolean;
  extraCompanies?: CompanyEnhanced[];
}

/**
 * Filters companies to only show user's companies
 * Handles multiple fallback strategies for finding user companies
 */
export function filterUserCompanies(
  companies: CompanyEnhanced[],
  options: CompanyFilterOptions
): CompanyEnhanced[] {
  const { userId, userEmail } = options;
  
  if (!userId) return [];

  // Strategy 1: Filter by UID
  let filtered = companies.filter((c: any) => c.createdBy === userId);

  // Strategy 2: If no companies found by UID, try by email
  if (filtered.length === 0 && userEmail) {
    filtered = companies.filter((c: any) => c.createdBy === userEmail);
  }

  // Strategy 3: Try current-user filter with exclusions
  if (filtered.length === 0) {
    filtered = companies.filter((c: any) => {
      if (c.createdBy !== 'current-user') return false;

      // User-specific exclusions
      if (userEmail === 'arichicho1@gmail.com') {
        return c.name !== 'prueba AC' && 
               !c.name.includes('Obel') && 
               !c.name.includes('Dale Play');
      } else if (userEmail === 'ariel.chicho@daleplayrecords.com') {
        return c.name !== 'prueba AC';
      }

      return true;
    });
  }

  return filtered;
}

/**
 * Merges user companies with extra companies (e.g., companies referenced by tasks)
 */
export function mergeCompaniesForView(
  userCompanies: CompanyEnhanced[],
  extraCompanies: CompanyEnhanced[] = []
): CompanyEnhanced[] {
  const map = new Map<string, CompanyEnhanced>();
  [...userCompanies, ...extraCompanies].forEach((c) => {
    if (c?.id) map.set(c.id, c);
  });
  return Array.from(map.values());
}

/**
 * Gets company name by ID from a list of companies
 */
export function getCompanyName(
  companyId: string,
  companies: CompanyEnhanced[]
): string {
  const company = companies.find(c => c.id === companyId);
  return company?.name || 'Empresa desconocida';
}

/**
 * Gets company color by ID from a list of companies
 */
export function getCompanyColor(
  companyId: string,
  companies: CompanyEnhanced[]
): string {
  const company = companies.find(c => c.id === companyId);
  return company?.color || '#3b82f6';
}

