import dotenv from 'dotenv';
import { runGemmaAssessment, getProviderConfig } from '../src/server/gemmaProvider';
import type { AssessmentInput } from '../src/types';

// Load environment variables
dotenv.config();

async function runSmokeTest() {
  console.log('========================================================');
  console.log('   PINKAWARE GEMMA 4 SMOKE TEST');
  console.log('========================================================');

  const config = getProviderConfig();
  console.log(`Active Provider: ${config.provider.toUpperCase()}`);
  if (config.provider === 'local') {
    console.log(`Ollama Endpoint: ${config.ollamaEndpoint}`);
    console.log(`Ollama Model:    ${config.ollamaModel}`);
  } else {
    console.log(`API Model:       ${config.gemmaApiModel}`);
    console.log(`API Key set:     ${Boolean(config.geminiApiKey) ? 'YES (configured)' : 'NO (missing or empty)'}`);
  }

  // Realistic sample input: young adult female (27), mother diagnosed with breast cancer at 48, single
  const sampleInput: AssessmentInput = {
    birthDate: '1998-06-15',
    motherDiagnosed: 'yes',
    motherAgeAtDiagnosis: '48',
    maritalStatus: 'single',
    hasChildren: 'no',
    otherFamilyHistory: 'Maternal grandmother had colon polyps; no other known breast cancers in immediate family.',
    breastDensityOrBiopsy: 'dense',
    lifestyleNotes: 'Performs light cardio twice a week, vegetarian diet, non-smoker, drinks alcohol rarely (1 drink/month).',
  };

  console.log('\nSubmitting realistic sample input:');
  console.log(JSON.stringify(sampleInput, null, 2));
  console.log('\nRunning assessment analysis through active provider...');

  const startTime = Date.now();
  try {
    const result = await runGemmaAssessment(sampleInput);
    const duration = Date.now() - startTime;

    console.log(`\nAnalysis completed in ${duration}ms`);
    console.log(`Provider reported: ${result.meta.provider}`);
    console.log(`Model reported:    ${result.meta.model}`);
    console.log(`Calculated Age:    ${result.participantProfile.calculatedAge}`);

    console.log('\n--- PREDOMINANT CAUSE ANALYSIS SNIPPET ---');
    console.log(result.predominantCauseAnalysis.slice(0, 250) + '...\n');

    console.log(`--- KEY FACTORS IDENTIFIED (${result.keyPredisposingFactors.length}) ---`);
    result.keyPredisposingFactors.forEach((f, i) => {
      console.log(` ${i + 1}. [${f.impactLevel.toUpperCase()}] ${f.factor} (${f.category}): ${f.relevance}`);
    });

    console.log(`\n--- PREVENTION AWARENESS ITEMS (${result.preventionAwarenessChecklist.length}) ---`);
    result.preventionAwarenessChecklist.forEach((p, i) => {
      console.log(` ${i + 1}. [${p.frequency}] ${p.title}`);
    });

    console.log(`\n--- PHYSICIAN DISCUSSION QUESTIONS (${result.physicianQuestions.length}) ---`);
    result.physicianQuestions.slice(0, 3).forEach((q, i) => {
      console.log(` ${i + 1}. ${q}`);
    });

    // Verification assertions
    if (!result.predominantCauseAnalysis || result.predominantCauseAnalysis.length < 50) {
      throw new Error('Predominant cause analysis is too short or empty');
    }
    if (!Array.isArray(result.keyPredisposingFactors) || result.keyPredisposingFactors.length === 0) {
      throw new Error('No predisposing factors were returned');
    }
    if (!Array.isArray(result.preventionAwarenessChecklist) || result.preventionAwarenessChecklist.length === 0) {
      throw new Error('No prevention awareness checklist was returned');
    }

    console.log('\n========================================================');
    console.log('RESULT: PASS');
    console.log('========================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\nSmoke test encountered an error:', error.message);
    console.log('\n========================================================');
    console.log('RESULT: FAIL');
    console.log('========================================================\n');
    process.exit(1);
  }
}

runSmokeTest();
