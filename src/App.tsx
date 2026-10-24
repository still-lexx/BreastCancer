/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Sparkles,
  Calendar,
  Users,
  CheckCircle2,
  Activity,
  FileText,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Info,
  Server,
  Cpu,
  BookOpen,
} from 'lucide-react';
import type { AssessmentInput, AssessmentResult, FactorDetail, PreventionItem } from './types';

export default function App() {
  const [formData, setFormData] = useState<AssessmentInput>({
    birthDate: '1998-06-15',
    motherDiagnosed: 'yes',
    motherAgeAtDiagnosis: '48',
    maritalStatus: 'single',
    hasChildren: 'no',
    ageAtFirstChild: '',
    otherFamilyHistory: '',
    lifestyleNotes: 'Performs light aerobic exercise 2-3 times a week, balanced diet, non-smoker.',
    breastDensityOrBiopsy: 'dense',
  });

  const [providerInfo, setProviderInfo] = useState<{
    provider: string;
    model: string;
    isApiKeyConfigured: boolean;
    ollamaEndpoint: string;
    ollamaModel: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'prevention' | 'doctor'>('overview');
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});

  // Fetch server provider config on load
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setProviderInfo({
          provider: data.provider || 'api',
          model: data.provider === 'local' ? data.ollamaModel : data.gemmaApiModel,
          isApiKeyConfigured: data.isApiKeyConfigured,
          ollamaEndpoint: data.ollamaEndpoint,
          ollamaModel: data.ollamaModel,
        });
      })
      .catch((err) => {
        console.warn('Could not query /api/config:', err);
      });
  }, []);

  // Calculate age helper
  const calculateCurrentAge = (dateStr: string): number => {
    if (!dateStr) return 0;
    const bday = new Date(dateStr);
    const now = new Date();
    let age = now.getFullYear() - bday.getFullYear();
    const m = now.getMonth() - bday.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < bday.getDate())) {
      age--;
    }
    return isNaN(age) || age < 0 ? 0 : age;
  };

  const currentCalculatedAge = calculateCurrentAge(formData.birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with HTTP ${res.status}`);
      }

      const data: AssessmentResult = await res.json();
      setResult(data);
      setActiveTab('overview');
    } catch (err: any) {
      setError(err.message || 'Failed to complete analysis. Please check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (type: 'maternal-high-risk' | 'general-awareness') => {
    if (type === 'maternal-high-risk') {
      setFormData({
        birthDate: '1998-06-15',
        motherDiagnosed: 'yes',
        motherAgeAtDiagnosis: '48',
        maritalStatus: 'single',
        hasChildren: 'no',
        ageAtFirstChild: '',
        otherFamilyHistory: 'Maternal aunt had ovarian cyst; no other early onset cancers.',
        lifestyleNotes: 'Regular moderate cardio, non-smoker, 1 drink per week.',
        breastDensityOrBiopsy: 'dense',
      });
    } else {
      setFormData({
        birthDate: '2001-03-22',
        motherDiagnosed: 'no',
        motherAgeAtDiagnosis: '',
        maritalStatus: 'married',
        hasChildren: 'yes',
        ageAtFirstChild: '23',
        otherFamilyHistory: 'Paternal grandmother had breast cancer at age 74.',
        lifestyleNotes: 'Yoga twice a week, healthy home-cooked meals, non-smoker.',
        breastDensityOrBiopsy: 'average',
      });
    }
    setResult(null);
  };

  const toggleChecklist = (title: string) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-rose-100 bg-white/90 backdrop-blur sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">PinkAware</h1>
                <span className="text-[11px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                  Gemma 4 Research
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Predisposing Factors & Preventive Awareness for Young Women
              </p>
            </div>
          </div>

          {/* Active Provider Badge */}
          <div className="flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
            {providerInfo?.provider === 'local' ? (
              <>
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-700">Provider:</span>
                <span className="text-emerald-700 font-semibold">Local Ollama</span>
                <span className="text-slate-400">({providerInfo.model})</span>
              </>
            ) : (
              <>
                <Server className="w-4 h-4 text-rose-600" />
                <span className="font-medium text-slate-700">Provider:</span>
                <span className="text-rose-700 font-semibold">Google AI Studio</span>
                <span className="text-slate-500">({providerInfo?.model || 'gemma-4-26b-a4b-it'})</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Research Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  Participant Intake Form
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input demographics and predisposing family history
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadSample('maternal-high-risk')}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 transition-colors"
                  title="Load sample input: 27yo with mother diagnosed"
                >
                  Load Sample
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>1. Date of Birth</span>
                  {currentCalculatedAge > 0 && (
                    <span className="text-xs font-normal text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      Age: {currentCalculatedAge} years
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Young adult awareness focuses specifically on ages 18 through 39.
                </p>
              </div>

              {/* 2. Mother Diagnosed with Breast Cancer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Was your mother diagnosed with breast cancer?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['yes', 'no', 'unsure'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({ ...formData, motherDiagnosed: opt })}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                        formData.motherDiagnosed === opt
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Unsure'}
                    </button>
                  ))}
                </div>

                {/* Conditional: Mother's Age at Diagnosis */}
                {formData.motherDiagnosed === 'yes' && (
                  <div className="mt-3 p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl space-y-1.5">
                    <label className="block text-xs font-medium text-rose-900">
                      Mother's approximate age when diagnosed (optional):
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 48"
                      min="20"
                      max="100"
                      value={formData.motherAgeAtDiagnosis}
                      onChange={(e) => setFormData({ ...formData, motherAgeAtDiagnosis: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                    <p className="text-[10px] text-rose-700">
                      Maternal diagnosis before age 50 is a significant indicator for early-onset hereditary risk.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Marital Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Marital Status
                </label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all outline-none"
                >
                  <option value="single">Single (Never Married)</option>
                  <option value="married">Married / Domestic Partnership</option>
                  <option value="divorced">Divorced / Separated</option>
                  <option value="widowed">Widowed</option>
                  <option value="other">Other / Prefer not to say</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reproductive milestones and pregnancy timing correlate with hormonal receptor windows.
                </p>
              </div>

              {/* Optional Reproductive Context */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Children & Pregnancy History
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasChildren: 'no' })}
                    className={`py-1.5 text-xs rounded-lg border font-medium ${
                      formData.hasChildren === 'no'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    No Children (Nulliparous)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasChildren: 'yes' })}
                    className={`py-1.5 text-xs rounded-lg border font-medium ${
                      formData.hasChildren === 'yes'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Has Given Birth
                  </button>
                </div>
                {formData.hasChildren === 'yes' && (
                  <input
                    type="number"
                    placeholder="Age at first full-term birth (e.g. 24)"
                    value={formData.ageAtFirstChild}
                    onChange={(e) => setFormData({ ...formData, ageAtFirstChild: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-rose-400 outline-none"
                  />
                )}
              </div>

              {/* Dense Breast Tissue / Biopsy */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Breast Density / Prior Biopsy
                </label>
                <select
                  value={formData.breastDensityOrBiopsy}
                  onChange={(e) => setFormData({ ...formData, breastDensityOrBiopsy: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-400 outline-none"
                >
                  <option value="dense">Dense Breast Tissue (Common in younger women)</option>
                  <option value="average">Average / Non-dense</option>
                  <option value="unsure">Unsure / Never had a screening</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-rose-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing with Gemma 4...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Gemma 4 Research Assessment</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Educational Quick Facts Card */}
          <div className="bg-rose-50/60 rounded-2xl border border-rose-100 p-5 space-y-3">
            <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-rose-600" />
              Young Adult Breast Cancer Facts
            </h3>
            <ul className="text-xs text-rose-800 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  <strong>70% to 80%</strong> of breast cancer cases occur in women with <em>no</em> family history, but a first-degree relative (mother/sister) doubles relative risk.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  Under-40 breast cancers are often biologically different: higher rates of triple-negative and HER2-positive subtypes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  Young breast tissue is naturally dense. Regular clinical awareness and supplemental ultrasound/MRI improve early detection.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Gemma 4 Analysis & Actionable Guidance */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Assessment Error</h4>
                <p className="text-xs mt-1 text-red-700">{error}</p>
                <p className="text-[11px] text-red-600 mt-2">
                  Check if <code>GEMINI_API_KEY</code> is configured in Settings &gt; Secrets, or switch to <code>PROVIDER=local</code> with Ollama running.
                </p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Ready for Risk & Awareness Assessment
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Fill out the participant details on the left (date of birth, maternal history, and marital status) or click <strong>Load Sample</strong> to see a full demonstration generated by Gemma 4.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('maternal-high-risk')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-xl border border-rose-200 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Try 27yo Sample Participant (Mother Diagnosed)
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-6 shadow-sm">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                <Heart className="w-6 h-6 text-rose-500 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-800">
                  Consulting Gemma 4 Oncology Knowledge Base...
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Synthesizing predisposing genetic factors, young adult biological parameters, and preventative awareness guidelines.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Participant Profile Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    <span className="text-sm font-bold text-slate-900">
                      Assessment Result for Participant (Age {result.participantProfile.calculatedAge})
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    Evaluated by <strong>{result.meta.model}</strong> ({result.meta.provider.toUpperCase()})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block font-medium mb-1">Family Genetic Profile</span>
                    <span className="text-slate-700 font-medium">
                      {result.participantProfile.familyHistorySummary}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block font-medium mb-1">Reproductive Context</span>
                    <span className="text-slate-700 font-medium">
                      {result.participantProfile.maritalStatusSummary}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'overview'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Predominant Causes & Insights
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('factors')}
                  className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'factors'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Key Predisposing Factors ({result.keyPredisposingFactors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prevention')}
                  className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'prevention'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Prevention Checklist ({result.preventionAwarenessChecklist.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('doctor')}
                  className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'doctor'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Doctor Discussion
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      Predominant Cause & Drivers Analysis
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {result.predominantCauseAnalysis}
                    </p>
                  </div>

                  <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-6 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-600" />
                      Why Young Adult Females Require Tailored Vigilance
                    </h3>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      {result.youngAdultSpecificInsights}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Educational Research Disclaimer</p>
                      <p className="text-amber-800 mt-0.5 leading-relaxed">
                        This tool is designed exclusively for public health research, risk factor education, and cancer awareness. It does not provide medical diagnosis or replace consultation with an oncologist, genetic counselor, or personal physician.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PREDISPOSING FACTORS BREAKDOWN */}
              {activeTab === 'factors' && (
                <div className="space-y-4">
                  {result.keyPredisposingFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 hover:border-rose-200 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {factor.factor}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {factor.category}
                          </span>
                          <span
                            className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                              factor.impactLevel === 'elevated'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : factor.impactLevel === 'moderate'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : factor.impactLevel === 'protective'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {factor.impactLevel}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-rose-700 font-medium">{factor.relevance}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{factor.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: PREVENTION AWARENESS CHECKLIST */}
              {activeTab === 'prevention' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Empowering Awareness: Mark actionable steps as you explore or complete them.</span>
                    </div>
                    <span className="font-bold">
                      {Object.values(checkedChecklist).filter(Boolean).length} of {result.preventionAwarenessChecklist.length} done
                    </span>
                  </div>

                  {result.preventionAwarenessChecklist.map((item, idx) => {
                    const isChecked = Boolean(checkedChecklist[item.title]);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleChecklist(item.title)}
                        className={`bg-white rounded-2xl border p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
                          isChecked ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 mt-0.5 accent-emerald-600 rounded cursor-pointer"
                            />
                            <div>
                              <h4
                                className={`text-sm font-bold ${
                                  isChecked ? 'text-emerald-900 line-through' : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </h4>
                              <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                Frequency: {item.frequency}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pl-7 leading-relaxed">{item.advice}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: PHYSICIAN DISCUSSION GUIDE */}
              {activeTab === 'doctor' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-rose-500" />
                        Questions to Ask Your Healthcare Provider
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Take these tailored prompts to your next gynecologist or primary care visit.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.physicianQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-800 flex items-start gap-3 hover:bg-rose-50/40 hover:border-rose-200 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed font-medium pt-0.5">{q}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900">
                    <p className="font-semibold mb-1">Key Research Takeaway</p>
                    <p className="text-rose-800">{result.scientificSummary}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            PinkAware Breast Cancer Research & Awareness App • Powered by <strong>Gemma 4</strong>
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Server-side API Protection</span>
            <span>•</span>
            <span>Ollama Fallback Support</span>
            <span>•</span>
            <span>Educational Awareness</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
