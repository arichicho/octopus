export interface MiDAIPreferences {
  keywordsUp: string[];
  keywordsDown: string[];
  emailDomainsUp: string[];
  emailDomainsDown: string[];
  participantsBoost: Record<string, number>; // email -> boost
  companiesBoost: Record<string, number>; // companyId -> boost
  docTypesBoost: Record<string, number>; // e.g., minuta: 2
  maxRelatedItems?: number;
  maxEmailLookbackDays?: number;
}

export const DEFAULT_MIDAI_PREFERENCES: MiDAIPreferences = {
  keywordsUp: [],
  keywordsDown: [],
  emailDomainsUp: [],
  emailDomainsDown: [],
  participantsBoost: {},
  companiesBoost: {},
  docTypesBoost: { minuta: 1 },
  maxRelatedItems: 8,
};

