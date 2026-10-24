/**
 * Types for Breast Cancer Research & Awareness Assessment
 */

export interface AssessmentInput {
  birthDate: string; // YYYY-MM-DD
  motherDiagnosed: 'yes' | 'no' | 'unsure';
  motherAgeAtDiagnosis?: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'other';
  hasChildren?: 'yes' | 'no' | 'not_applicable';
  ageAtFirstChild?: string;
  otherFamilyHistory?: string;
  lifestyleNotes?: string;
  breastDensityOrBiopsy?: 'dense' | 'average' | 'unsure';
}

export interface FactorDetail {
  factor: string;
  category: 'genetic' | 'hormonal' | 'demographic' | 'lifestyle';
  relevance: string;
  impactLevel: 'elevated' | 'moderate' | 'average' | 'protective' | 'informational';
  explanation: string;
}

export interface PreventionItem {
  title: string;
  category: 'self-awareness' | 'clinical' | 'lifestyle' | 'genetic-counseling';
  frequency: string;
  advice: string;
}

export interface AssessmentResult {
  participantProfile: {
    calculatedAge: number;
    lifeStage: string;
    familyHistorySummary: string;
    maritalStatusSummary: string;
  };
  predominantCauseAnalysis: string;
  youngAdultSpecificInsights: string;
  keyPredisposingFactors: FactorDetail[];
  preventionAwarenessChecklist: PreventionItem[];
  physicianQuestions: string[];
  scientificSummary: string;
  meta: {
    provider: 'api' | 'local';
    model: string;
    evaluatedAt: string;
    isOllamaFallback?: boolean;
  };
}
