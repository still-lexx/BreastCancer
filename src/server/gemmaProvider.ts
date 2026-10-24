import { GoogleGenAI } from '@google/genai';
import type { AssessmentInput, AssessmentResult } from '../types';

export interface ProviderConfig {
  provider: 'api' | 'local';
  geminiApiKey?: string;
  gemmaApiModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
}

export function getProviderConfig(): ProviderConfig {
  const provider = (process.env.PROVIDER?.toLowerCase() === 'local') ? 'local' : 'api';
  return {
    provider,
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    gemmaApiModel: process.env.GEMMA_API_MODEL || 'gemma-4-26b-a4b-it',
    ollamaEndpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:e2b',
  };
}

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 25;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return isNaN(age) || age < 0 ? 25 : age;
}

function buildPrompt(input: AssessmentInput, age: number): string {
  return `You are an oncologist specializing in young adult breast cancer epidemiology.
Analyze this participant profile:
- Age: ${age} (DOB: ${input.birthDate})
- Mother diagnosed with breast cancer: ${input.motherDiagnosed.toUpperCase()} ${input.motherAgeAtDiagnosis ? `(at age ${input.motherAgeAtDiagnosis})` : ''}
- Marital Status: ${input.maritalStatus}
- Has Children: ${input.hasChildren || 'none'} ${input.ageAtFirstChild ? `(first birth at ${input.ageAtFirstChild})` : ''}
- Other Family History: ${input.otherFamilyHistory || 'None'}
- Breast Density: ${input.breastDensityOrBiopsy || 'dense'}
- Lifestyle: ${input.lifestyleNotes || 'active'}

Return ONLY valid JSON without thinking. Start output immediately with { and end with }:
{
  "participantProfile": {
    "calculatedAge": ${age},
    "lifeStage": "Young adult female",
    "familyHistorySummary": "Summary of maternal and family risk",
    "maritalStatusSummary": "Reproductive context summary"
  },
  "predominantCauseAnalysis": "2 sentences explaining predominant drivers (genetics, tissue density, hormonal timeline).",
  "youngAdultSpecificInsights": "2 sentences explaining unique biological characteristics and vigilance in young females.",
  "keyPredisposingFactors": [
    {
      "factor": "First-Degree Maternal History",
      "category": "genetic",
      "relevance": "Direct maternal heredity",
      "impactLevel": "elevated",
      "explanation": "Maternal diagnosis before age 50 doubles relative risk and suggests genetic evaluation."
    },
    {
      "factor": "Dense Breast Tissue",
      "category": "demographic",
      "relevance": "Age-related density",
      "impactLevel": "moderate",
      "explanation": "Dense glandular tissue is common in young women and can obscure standard imaging."
    },
    {
      "factor": "Reproductive Timeline",
      "category": "hormonal",
      "relevance": "Parity milestones",
      "impactLevel": "protective",
      "explanation": "Cumulative breastfeeding and early full-term pregnancy provide long-term risk reduction."
    }
  ],
  "preventionAwarenessChecklist": [
    {
      "title": "Monthly Breast Self-Awareness",
      "category": "self-awareness",
      "frequency": "Monthly",
      "advice": "Check breast tissue several days post-cycle for any new focal lumps or skin changes."
    },
    {
      "title": "Clinical Breast Examination",
      "category": "clinical",
      "frequency": "Annual",
      "advice": "Schedule an annual manual exam with a doctor to discuss starting surveillance 10 years earlier than mother's diagnosis age."
    },
    {
      "title": "Genetic Risk Counseling",
      "category": "genetic-counseling",
      "frequency": "Once",
      "advice": "Meet with a genetic counselor to review maternal pedigree and test for BRCA1/2 or PALB2 if indicated."
    }
  ],
  "physicianQuestions": [
    "Given my mother's diagnosis age, should I begin annual MRI or ultrasound screening earlier?",
    "Do you recommend hereditary multi-gene panel testing for my family history?",
    "How does dense breast tissue influence my personalized screening strategy?",
    "What specific symptoms should a young woman never ignore?"
  ],
  "scientificSummary": "Early awareness, personalized surveillance, and knowing your normal baseline provide proactive protection."
}`;
}

function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

export async function runGemmaAssessment(input: AssessmentInput, configOverride?: Partial<ProviderConfig>): Promise<AssessmentResult> {
  const config: ProviderConfig = {
    ...getProviderConfig(),
    ...configOverride,
  };

  const age = calculateAge(input.birthDate);
  const prompt = buildPrompt(input, age);

  let rawOutput = '';
  let activeModel = '';
  let providerUsed: 'api' | 'local' = config.provider;

  if (config.provider === 'local') {
    // ----------------------------------------------------
    // Provider: Ollama Local Fallback
    // ----------------------------------------------------
    activeModel = config.ollamaModel;
    try {
      const response = await fetch(`${config.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      rawOutput = data.response;
    } catch (err: any) {
      throw new Error(`Local Ollama service error (${config.ollamaEndpoint}): ${err.message}. Ensure Ollama is running with model '${activeModel}'.`);
    }
  } else {
    // ----------------------------------------------------
    // Provider: Google AI Studio (Gemini API) Gemma 4 Model
    // ----------------------------------------------------
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please provide it in your environment or Settings > Secrets.');
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    activeModel = config.gemmaApiModel;
    
    // Attempt generation with primary Gemma 4 model, with fallback if needed
    try {
      console.log(`[gemmaProvider] Calling model: ${activeModel}...`);
      const response = await ai.models.generateContent({
        model: activeModel,
        contents: prompt,
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const nonThoughtPart = parts.find((p: any) => !p.thought && p.text);
      rawOutput = response.text || nonThoughtPart?.text || '';
      console.log(`[gemmaProvider] Received response (${rawOutput.length} characters)`);
    } catch (primaryErr: any) {
      console.warn(`Primary model ${activeModel} failed: ${primaryErr.message}. Trying backup Gemma 4 / Gemini model...`);
      // Try alternate Gemma 4 ID or gemini-3.8-flash as resilient fallback
      const fallbackModel = activeModel === 'gemma-4-26b-a4b-it' ? 'gemma-4-31b-it' : 'gemini-3.8-flash';
      activeModel = fallbackModel;
      const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents: prompt,
      });
      const parts = fallbackResponse.candidates?.[0]?.content?.parts || [];
      const nonThoughtPart = parts.find((p: any) => !p.thought && p.text);
      rawOutput = fallbackResponse.text || nonThoughtPart?.text || '';
    }
  }

  // Parse JSON output
  try {
    const parsed = cleanJsonResponse(rawOutput);
    return {
      participantProfile: {
        calculatedAge: age,
        lifeStage: parsed.participantProfile?.lifeStage || 'Young Adult Female',
        familyHistorySummary: parsed.participantProfile?.familyHistorySummary || (input.motherDiagnosed === 'yes' ? 'Maternal history of breast cancer noted.' : 'No direct maternal history reported.'),
        maritalStatusSummary: parsed.participantProfile?.maritalStatusSummary || `Marital status: ${input.maritalStatus}.`,
      },
      predominantCauseAnalysis: parsed.predominantCauseAnalysis || 'Epidemiological analysis identifies family genetics and hormonal receptor windows as predominant factors.',
      youngAdultSpecificInsights: parsed.youngAdultSpecificInsights || 'In young females under 40, tumors are less frequent but tend to present at more advanced stages and higher biological density.',
      keyPredisposingFactors: Array.isArray(parsed.keyPredisposingFactors) ? parsed.keyPredisposingFactors : [],
      preventionAwarenessChecklist: Array.isArray(parsed.preventionAwarenessChecklist) ? parsed.preventionAwarenessChecklist : [],
      physicianQuestions: Array.isArray(parsed.physicianQuestions) ? parsed.physicianQuestions : [
        'Should I undergo genetic testing (e.g. BRCA1/BRCA2) based on my maternal family history?',
        'At what age should I begin supplemental screening (breast ultrasound or MRI)?',
        'How does dense breast tissue affect my screening options?',
        'What specific lifestyle modifications offer the highest risk reduction for my profile?',
        'How frequently should I schedule a clinical breast examination with a specialist?'
      ],
      scientificSummary: parsed.scientificSummary || 'Early risk awareness, routine clinical exams, and knowing your normal breast baseline empower proactive, lifesaving prevention.',
      meta: {
        provider: providerUsed,
        model: activeModel,
        evaluatedAt: new Date().toISOString(),
      },
    };
  } catch (parseError) {
    console.error('Failed to parse model output as JSON:', rawOutput);
    // Provide a structured fallback using the raw text or expert template
    return generateFallbackResult(input, age, providerUsed, activeModel, rawOutput);
  }
}

function generateFallbackResult(
  input: AssessmentInput,
  age: number,
  provider: 'api' | 'local',
  model: string,
  rawNote: string
): AssessmentResult {
  const motherHadCancer = input.motherDiagnosed === 'yes';

  return {
    participantProfile: {
      calculatedAge: age,
      lifeStage: 'Young Adult Female (Ages 18-39)',
      familyHistorySummary: motherHadCancer
        ? `First-degree relative (mother) diagnosed ${input.motherAgeAtDiagnosis ? `at age ${input.motherAgeAtDiagnosis}` : 'with breast cancer'}. Significant hereditary relevance.`
        : input.motherDiagnosed === 'unsure'
        ? 'Maternal family history is currently unconfirmed. Family health pedigree tracking recommended.'
        : 'No direct maternal history of breast cancer reported.',
      maritalStatusSummary: `Marital status: ${input.maritalStatus}. Reproductive milestones and age at first live birth impact long-term breast tissue maturation.`,
    },
    predominantCauseAnalysis: `In young adult women under 40, the predominant causes of breast cancer revolve around two primary pillars: genetic predisposition (hereditary mutations in high-penetrance genes like BRCA1, BRCA2, TP53, and CHEK2) and lifetime cumulative hormonal exposure. When a first-degree relative (such as a biological mother) has had breast cancer, an individual's relative risk increases roughly twofold, especially if the diagnosis occurred prior to age 50. Unlike older postmenopausal women where general age-related cellular DNA damage is the overwhelming driver, young-onset cases are substantially more influenced by inherited susceptibility, early menarche, and micro-environmental dense breast architecture.`,
    youngAdultSpecificInsights: `Breast cancer in young women under 40 is biologically distinct. Tumors diagnosed at a younger age are statistically more likely to be estrogen-receptor negative, triple-negative, or HER2-enriched, which can behave more aggressively. Furthermore, young women naturally have significantly denser glandular breast tissue, which can obscure small abnormalities on standard mammograms. For this reason, clinical breast examinations, high-resolution ultrasound, and in elevated-risk cases, screening breast MRI are standard recommended surveillance modalities.`,
    keyPredisposingFactors: [
      {
        factor: 'First-Degree Maternal History',
        category: 'genetic',
        relevance: motherHadCancer ? 'Direct first-degree maternal link detected' : 'Baseline family pedigree',
        impactLevel: motherHadCancer ? 'elevated' : 'average',
        explanation: motherHadCancer
          ? 'Having a mother diagnosed with breast cancer is one of the strongest established predisposing factors. It signals potential shared genetic susceptibility (such as BRCA1/2 or PALB2) or shared familial environmental factors.'
          : 'Absence of maternal diagnosis keeps hereditary baseline in the general population bracket, though paternal family lineage should also be verified.',
      },
      {
        factor: 'Young Adult Age & Tissue Density',
        category: 'demographic',
        relevance: `Age ${age} falls into the young adult premenopausal category`,
        impactLevel: 'informational',
        explanation: 'Younger women naturally exhibit higher glandular tissue density. While overall incidence at age 20-35 is low (~1 in 200), early awareness is essential because changes are often dismissed as benign fibroadenomas or cysts.',
      },
      {
        factor: 'Reproductive & Hormonal Timeline',
        category: 'hormonal',
        relevance: `Marital status: ${input.maritalStatus}`,
        impactLevel: 'moderate',
        explanation: 'Marital and family planning status correlate with reproductive milestones. Full-term pregnancy followed by cumulative breastfeeding promotes terminal differentiation of breast epithelial cells, offering long-term protective benefits.',
      },
      {
        factor: 'Modifiable Lifestyle & Metabolic Factors',
        category: 'lifestyle',
        relevance: input.lifestyleNotes || 'Physical activity and diet',
        impactLevel: 'protective',
        explanation: 'Regular aerobic exercise (150+ minutes per week), maintaining a healthy BMI, and minimizing alcohol intake lower circulating estrogen levels and inflammatory cytokines, reducing risk.',
      },
    ],
    preventionAwarenessChecklist: [
      {
        title: 'Breast Self-Awareness & Monthly Check',
        category: 'self-awareness',
        frequency: 'Monthly (several days after menstrual cycle)',
        advice: 'Familiarize yourself with the regular look and feel of your breast tissue. Watch for visible skin dimpling, nipple inversion, new palpable focal lumps, or spontaneous nipple discharge.',
      },
      {
        title: 'Clinical Breast Examination (CBE)',
        category: 'clinical',
        frequency: 'Every 1 to 3 years between ages 20-39',
        advice: 'Have a skilled healthcare clinician (gynecologist or primary care physician) perform a comprehensive manual exam during your routine annual wellness check.',
      },
      {
        title: 'Genetic Risk Assessment & Pedigree Review',
        category: 'genetic-counseling',
        frequency: 'Once, or when family health history updates',
        advice: motherHadCancer
          ? 'Schedule a formal genetic counseling session. A counselor will calculate your Tyrer-Cuzick or BRCAPRO risk score and advise if multi-gene panel testing (BRCA1/2, PALB2, ATM) is indicated.'
          : 'Document both maternal and paternal health histories across three generations to ensure complete risk mapping.',
      },
      {
        title: 'Lifestyle Risk Reduction Habits',
        category: 'lifestyle',
        frequency: 'Continuous daily habits',
        advice: 'Engage in regular moderate-to-vigorous exercise, eat a nutrient-rich Mediterranean-style diet, avoid tobacco, and keep alcohol consumption to fewer than 3 drinks per week.',
      },
    ],
    physicianQuestions: [
      'Based on my mother\'s diagnosis, do I qualify for comprehensive hereditary cancer gene panel testing?',
      'Should I begin surveillance screening 10 years earlier than the age my mother was diagnosed?',
      'Would breast ultrasound or contrast-enhanced MRI be more effective than a standard mammogram for my breast density?',
      'What are the distinct red-flag symptoms young women should never ignore?',
      'Can you recommend a dedicated high-risk breast surveillance program or genetic counselor in my area?'
    ],
    scientificSummary: 'Knowledge is power: while genetics and biology establish predisposing factors, early detection, personalized screening protocols, and proactive lifestyle choices provide the most effective defense against breast cancer.',
    meta: {
      provider,
      model,
      evaluatedAt: new Date().toISOString(),
    },
  };
}
