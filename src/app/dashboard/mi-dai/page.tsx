"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_MI_DAI_SETTINGS, MIDAI_FEATURE_FLAGS } from '@/lib/config/mi-dai';
import type { DailyPlanResponse, ContextPack, ContextTask } from '@/types/daily-plan';
import { MiDAIService } from '@/lib/services/mi-dai';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useTaskStore } from '@/lib/store/useTaskStore';
import { useCompanyEnhancedStore } from '@/lib/store/useCompanyEnhancedStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MeetingPreferencesService } from '@/lib/services/meeting-preferences';
import { ClaudeIntegrationService } from '@/lib/services/claude-integrations';
import { MiDAIPreferencesService } from '@/lib/services/mi-dai-preferences';
import type { MiDAIPreferences } from '@/types/midai';

function getTagColor(tag: string) {
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ];
  let hash = 0; for (let i=0;i<tag.length;i++) hash=((hash<<5)-hash+tag.charCodeAt(i))|0;
  return colors[Math.abs(hash)%colors.length];
}

export default function MiDAIPage() {
  const { user } = useAuthStore();
  const { filteredTasks, loadTasks, changeTaskStatus } = useTaskStore();
  const { activeCompanies, fetchActiveCompanies } = useCompanyEnhancedStore();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DailyPlanResponse | null>(null);
  const [context, setContext] = useState<ContextPack | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openPrepFor, setOpenPrepFor] = useState<string | null>(null);
  const [prep, setPrep] = useState<any>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [meetingPrepDecisions, setMeetingPrepDecisions] = useState<Record<string, { needsPrep: boolean; confidence: number; userDecided: boolean }>>({});
  // Claude health/connect UI
  const [claudeHealth, setClaudeHealth] = useState<{ hasEnv: boolean; ok: boolean; status?: number; error?: string; model?: string; now?: string } | null>(null);
  const [claudePingLoading, setClaudePingLoading] = useState(false);
  const [showConnectClaude, setShowConnectClaude] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [prefs, setPrefs] = useState<MiDAIPreferences | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsForm, setPrefsForm] = useState<{ keywordsUp: string; keywordsDown: string; domainsUp: string; domainsDown: string }>({ keywordsUp: '', keywordsDown: '', domainsUp: '', domainsDown: '' });

  useEffect(() => {
    if (user?.uid) {
      loadTasks(user.uid);
      fetchActiveCompanies(user.uid);
      MeetingPreferencesService.setUserId(user.uid);
    }
  }, [user?.uid, loadTasks, fetchActiveCompanies]);

  useEffect(() => {
    // Initial health ping
    handlePingClaude();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const p = await MiDAIPreferencesService.get();
        setPrefs(p);
        setPrefsForm({
          keywordsUp: (p.keywordsUp || []).join(', '),
          keywordsDown: (p.keywordsDown || []).join(', '),
          domainsUp: (p.emailDomainsUp || []).join(', '),
          domainsDown: (p.emailDomainsDown || []).join(', '),
        });
      } catch {}
    })();
  }, []);

  async function handleSavePrefs() {
    setPrefsSaving(true);
    try {
      const updates = {
        keywordsUp: prefsForm.keywordsUp.split(',').map((s) => s.trim()).filter(Boolean),
        keywordsDown: prefsForm.keywordsDown.split(',').map((s) => s.trim()).filter(Boolean),
        emailDomainsUp: prefsForm.domainsUp.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
        emailDomainsDown: prefsForm.domainsDown.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      } as Partial<MiDAIPreferences>;
      const saved = await MiDAIPreferencesService.save(updates);
      setPrefs(saved);
    } catch (e) {
      console.error(e);
    } finally {
      setPrefsSaving(false);
    }
  }

  const contextTasks: ContextTask[] = useMemo(() => {
    return (filteredTasks || []).map((t) => ({
      id: t.id!,
      title: t.title,
      priority: t.priority === 'urgent' || t.priority === 'high' ? 'H' : t.priority === 'medium' ? 'M' : 'L',
      dueDate: t.dueDate ? new Date(t.dueDate as any).toISOString().slice(0, 10) : null,
      estimateMinutes: (t as any).estimateMinutes || undefined,
      tags: t.tags || [],
      companyId: t.companyId || null,
      personIds: t.assignedTo || [],
      status: t.status === 'completed' ? 'done' : t.status === 'cancelled' ? 'blocked' : 'open',
    }));
  }, [filteredTasks]);

  function getCompanyInfo(companyId?: string | null) {
    if (!companyId) return { name: 'Sin empresa', color: '#6b7280' };
    const c = activeCompanies.find((x) => x.id === companyId);
    return { name: c?.name || 'Empresa no encontrada', color: c?.color || '#3b82f6' };
  }

  async function handleGenerate() {
    try {
      setLoading(true); setError(null);
      const todayISO = new Date().toISOString();
      // Contexto de integraciones (calendar/gmail/drive) desde el backend
      const base = await MiDAIService.getContext(todayISO);
      // Mezclar con tareas locales por si no llegaron por API
      const merged: ContextPack = {
        ...base,
        tasks: base.tasks?.length ? base.tasks : contextTasks,
        settings: { ...(base.settings || DEFAULT_MI_DAI_SETTINGS) },
      };
      setContext(merged);
      // Plan (IA o heurístico, según server config)
      const res = await MiDAIService.generatePlan(merged);
      setPlan(res);
      // Insights (resumen breve, riesgos, sugerencias)
      const ii = await MiDAIService.getInsights(merged).catch(() => ({ insights: [] }));
      setInsights(ii?.insights || []);
    } catch (e: any) {
      setError(e?.message || 'No se pudo generar el plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAgents() {
    try {
      setLoading(true); setError(null);
      const todayISO = new Date().toISOString();
      const result = await MiDAIService.runOrchestrator(todayISO);
      setContext(result.context);
      setPlan(result.plan);
      setInsights(result.insights?.insights || []);
      setAgentLogs(result.logs || []);
    } catch (e: any) {
      setError(e?.message || 'No se pudo ejecutar Mi dAI');
    } finally {
      setLoading(false);
    }
  }

  async function handleTaskStatusChange(taskId: string, completed: boolean) {
    try {
      const newStatus = completed ? 'completed' : 'pending';
      await changeTaskStatus(taskId, newStatus);
    } catch {}
  }

  const pendingTasks = useMemo(() => (contextTasks || []).filter((t) => t.status !== 'done'), [contextTasks]);

  async function checkMeetingPrepNeeded(meetingId: string, meetingTitle: string) {
    const userDecision = meetingPrepDecisions[meetingId];
    if (userDecision && userDecision.userDecided) {
      return { needsPrep: userDecision.needsPrep, shouldAsk: false, confidence: userDecision.confidence, userDecided: true };
    }
    try {
      const prediction = await MeetingPreferencesService.predictPrepNeeded(meetingTitle);
      if (prediction.confidence < 0.7) {
        return { needsPrep: prediction.needsPrep, shouldAsk: true, confidence: prediction.confidence, userDecided: false };
      }
      return { needsPrep: prediction.needsPrep, shouldAsk: false, confidence: prediction.confidence, userDecided: false };
    } catch {
      return { needsPrep: true, shouldAsk: true, confidence: 0.3, userDecided: false };
    }
  }

  async function handlePingClaude() {
    setClaudePingLoading(true);
    try {
      const res = await fetch('/api/ai/health');
      const data = await res.json();
      setClaudeHealth(data);
    } catch (e) {
      setClaudeHealth({ hasEnv: false, ok: false, error: 'ping_failed' });
    } finally {
      setClaudePingLoading(false);
    }
  }

  async function handleConnectClaude() {
    if (!user?.uid || !claudeApiKey.trim()) return;
    try {
      if (!ClaudeIntegrationService.validateApiKeyFormat(claudeApiKey)) throw new Error('API key inválida (formato)');
      const verify = await ClaudeIntegrationService.verifyApiKey(claudeApiKey);
      if (!verify.valid) throw new Error('API key inválida o no autorizada');
      // Pick recommended model
      const model = ClaudeIntegrationService.getRecommendedModel().id;
      await ClaudeIntegrationService.connectClaude(user.uid, claudeApiKey, model as any);
      setClaudeApiKey('');
      await handlePingClaude();
      setShowConnectClaude(false);
    } catch (e: any) {
      alert(e?.message || 'No se pudo conectar Claude');
    }
  }

  async function reloadPrep() {
    if (!openPrepFor || !context) return;
    const ev = context.events.find((e) => e.id === openPrepFor);
    if (!ev) return;
    setPrepLoading(true);
    try {
      const p = await MiDAIService.getMeetingPrep({ event: ev, context });
      setPrep(p);
    } catch (e) {
      console.error(e);
    } finally {
      setPrepLoading(false);
    }
  }

  // Polling ligero para replanificar si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const todayISO = new Date().toISOString();
        const base = await MiDAIService.getContext(todayISO);
        const merged: ContextPack = { ...base, tasks: base.tasks?.length ? base.tasks : contextTasks, settings: { ...(base.settings || DEFAULT_MI_DAI_SETTINGS) } };
        if (!cancelled) setContext(merged);
        const res = await MiDAIService.generatePlan(merged);
        if (!cancelled) setPlan(res);
      } catch {}
    };
    const id = setInterval(tick, 60000);
    tick();
    return () => { cancelled = true; clearInterval(id); };
  }, [autoRefresh, filteredTasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header mejorado */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Mi dAI
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Plan inteligente del día con calendario, emails, docs y tareas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={MIDAI_FEATURE_FLAGS.enabled ? 'default' : 'secondary'}
                className={MIDAI_FEATURE_FLAGS.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
              >
                {MIDAI_FEATURE_FLAGS.enabled ? '🤖 IA ON' : '⚙️ IA OFF'}
              </Badge>
              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? 'Generando…' : 'Generar plan IA'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleRunAgents} 
                disabled={loading}
                className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
              >
                {loading ? 'Corriendo…' : 'Ejecutar agentes'}
              </Button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-gray-500">Auto-refresh</span>
                <Switch checked={autoRefresh} onCheckedChange={(v)=>setAutoRefresh(!!v)} />
              </div>
            </div>
          </div>
        </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Timeline
                </h3>
              </div>
              {plan ? (
                <div className="space-y-3">
                  {plan.blocks.map((b) => (
                    <div key={b.id} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 border border-blue-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{b.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {b.relations?.taskId && (
                        <div className="mt-2 text-xs text-gray-600">
                          Tarea vinculada · {b.relations.taskId}
                        </div>
                      )}
                      {b.relations?.companyId && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCompanyInfo(b.relations.companyId).color }} />
                          {getCompanyInfo(b.relations.companyId).name}
                        </div>
                      )}
                      {b.reason && (
                        <div className="mt-2 text-xs text-gray-500">{b.reason}</div>
                      )}

                      {/* Prep de reunión */}
                      {b.type === 'meeting' && (
                        <MeetingPrepButtons
                          meetingId={b.relations?.meetingId || b.id}
                          meetingTitle={b.title}
                          meetingStart={b.start}
                          meetingEnd={b.end}
                          context={context}
                          onOpenPrep={(meetingId) => { setOpenPrepFor(meetingId); setPrep(null); }}
                          onSetPrep={setPrep}
                          onSetPrepLoading={setPrepLoading}
                          meetingPrepDecisions={meetingPrepDecisions}
                          onSetMeetingPrepDecisions={setMeetingPrepDecisions}
                          onHandleMeetingPrepDecision={async (meetingId, meetingTitle, needsPrep) => {
                            try {
                              await MeetingPreferencesService.learnFromDecision(meetingTitle, needsPrep, needsPrep ? 15 : 0);
                              setMeetingPrepDecisions(prev => ({ ...prev, [meetingId]: { needsPrep, confidence: 1.0, userDecided: true } }));
                            } catch {}
                          }}
                          checkMeetingPrepNeeded={checkMeetingPrepNeeded as any}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📅</div>
                  <div className="text-sm text-gray-500 mb-2">Aún no hay plan</div>
                  <div className="text-xs text-gray-400">Presiona "Generar plan IA" para comenzar</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Tareas Pendientes
                </h3>
              </div>
              {pendingTasks.length ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pendingTasks.map((t) => {
                    const c = getCompanyInfo(t.companyId);
                    return (
                      <div key={t.id} className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                        <Checkbox
                          checked={t.status === 'done'}
                          onCheckedChange={(checked) => handleTaskStatusChange(t.id, checked as boolean)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{t.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="text-xs text-gray-600">{c.name}</span>
                            {t.estimateMinutes && (
                              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                {t.estimateMinutes} min
                              </span>
                            )}
                          </div>
                          {t.tags && t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {t.tags.map((tag, i) => (
                                <span key={i} className={`px-2 py-0.5 text-xs rounded-full ${getTagColor(tag)}`}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="text-sm text-gray-500 mb-2">Sin tareas pendientes</div>
                  <div className="text-xs text-gray-400">¡Excelente trabajo!</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Integraciones
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span>Calendario</span>
                <Badge variant="secondary">Auto</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Emails</span>
                <Badge variant="secondary">Auto</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Documentos</span>
                <Badge variant="secondary">Auto</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Tareas</span>
                <Badge variant="secondary">Local</Badge>
              </div>
            </div>
          </div>

          {/* Preferencias de IA (enseñar al agente) */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Preferencias de IA
                </h3>
              </div>
              <div>
                <Label className="text-xs">Palabras clave (↑ importancia)</Label>
                <Input value={prefsForm.keywordsUp} onChange={(e)=>setPrefsForm(v=>({...v, keywordsUp: e.target.value}))} placeholder="ingresos, contrato, presupuesto" />
              </div>
              <div>
                <Label className="text-xs">Palabras clave (↓ importancia)</Label>
                <Input value={prefsForm.keywordsDown} onChange={(e)=>setPrefsForm(v=>({...v, keywordsDown: e.target.value}))} placeholder="spam, boletín" />
              </div>
              <div>
                <Label className="text-xs">Dominios email (↑)</Label>
                <Input value={prefsForm.domainsUp} onChange={(e)=>setPrefsForm(v=>({...v, domainsUp: e.target.value}))} placeholder="cliente.com, socio.com" />
              </div>
              <div>
                <Label className="text-xs">Dominios email (↓)</Label>
                <Input value={prefsForm.domainsDown} onChange={(e)=>setPrefsForm(v=>({...v, domainsDown: e.target.value}))} placeholder="promos.com" />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSavePrefs} disabled={prefsSaving}>{prefsSaving ? 'Guardando…' : 'Guardar'}</Button>
              </div>
              <div className="text-xs text-gray-500">Estos criterios personalizan tareas, emails y documentos sugeridos en la preparación.</div>
            </div>
          </div>

          {/* Estado de IA (Claude) */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Estado IA (Claude)
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={claudeHealth?.ok ? 'default' : 'secondary'}>
                    {claudeHealth?.ok ? 'Conectado' : 'Desconectado'}
                  </Badge>
                  {claudeHealth?.model && (
                    <span className="text-gray-600">{claudeHealth.model}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePingClaude} disabled={claudePingLoading}>
                    {claudePingLoading ? 'Pinging…' : 'Ping IA'}
                  </Button>
                  {!claudeHealth?.ok && (
                    <Button size="sm" onClick={() => setShowConnectClaude(!showConnectClaude)}>
                      {showConnectClaude ? 'Cerrar' : 'Conectar'}
                    </Button>
                  )}
                </div>
              </div>
              {!claudeHealth?.ok && claudeHealth?.error && (
                <div className="text-xs text-red-600">{claudeHealth.error}</div>
              )}
              {showConnectClaude && (
                <div className="space-y-2 p-3 border rounded-lg">
                  <Label htmlFor="claudeKey">API Key de Anthropic</Label>
                  <Input id="claudeKey" placeholder="sk-ant-..." value={claudeApiKey} onChange={(e)=>setClaudeApiKey(e.target.value)} />
                  <div className="text-xs text-gray-500">La clave se guarda cifrada. Requiere permisos válidos en Anthropic.</div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleConnectClaude} disabled={!claudeApiKey.trim()}>Conectar</Button>
                    <Button size="sm" variant="outline" onClick={()=>window.open('https://console.anthropic.com/','_blank')}>Abrir Anthropic</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Insights
                </h3>
              </div>
              {insights.length ? (
                <ul className="list-disc pl-4 text-sm space-y-1">
                  {insights.map((i, idx) => (<li key={idx}>{i}</li>))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">💡</div>
                  <div className="text-sm text-gray-500">Genera el plan para ver insights</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                  Logs del Orquestador
                </h3>
              </div>
              {agentLogs.length ? (
                <div className="max-h-64 overflow-y-auto text-xs font-mono space-y-1">
                  {agentLogs.map((l, i) => (
                    <div key={i}>
                      <span className="text-gray-500">[{new Date(l.at).toLocaleTimeString()}]</span>{' '}
                      <span className="font-semibold">{l.agent}</span>: {l.message}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-sm text-gray-500">Ejecuta agentes para ver el flujo</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modal de Preparación de Reunión */}
      <Dialog open={!!openPrepFor} onOpenChange={(open) => { if (!open) { setOpenPrepFor(null); setPrep(null); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preparación de reunión</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Encabezado contextual */}
            {openPrepFor && context && (() => {
              const ev = context.events.find((e) => e.id === openPrepFor);
              if (!ev) return null;
              return (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="truncate pr-3">
                    <span className="font-medium">{ev.title}</span>{' '}
                    <span>
                      {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {ev.onlineMeetingUrl && (
                    <a href={ev.onlineMeetingUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline whitespace-nowrap">Abrir enlace</a>
                  )}
                </div>
              );
            })()}
            {prepLoading && <div className="text-sm text-gray-500">Generando...</div>}
            {!prepLoading && prep && (
              <div className="space-y-4 text-sm">
                {/* Resumen */}
                <div className="text-gray-700 whitespace-pre-wrap">{prep.contextSummary}</div>

                {/* Enlaces útiles */}
                {Array.isArray(prep.links) && prep.links.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Enlaces</div>
                    <ul className="list-disc pl-4">
                      {prep.links.map((l: any, i: number) => (
                        <li key={i}><a href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{l.label || l.url}</a></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Checklist */}
                {Array.isArray(prep.checklists) && prep.checklists.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Checklist</div>
                    <ul className="list-disc pl-4">
                      {prep.checklists.map((c: any, i: number) => (<li key={i}>{c.title}</li>))}
                    </ul>
                  </div>
                )}

                {/* Tareas relacionadas */}
                {Array.isArray(prep.relatedTasks) && prep.relatedTasks.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Tareas relacionadas</div>
                    <ul className="list-disc pl-4">
                      {prep.relatedTasks.map((t: any, i: number) => (
                        <li key={i} className="flex items-start justify-between gap-2">
                          <span className="flex-1">{t.title}{t.priority ? ` • ${t.priority}` : ''}{t.dueDate ? ` • vence ${t.dueDate}` : ''}</span>
                          <span className="shrink-0 flex gap-1 text-xs">
                            <button className="px-1 rounded hover:bg-green-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'task', action:'up', meetingId: openPrepFor!, item: { id:t.id, title:t.title, companyId: t.companyId, tags: t.tags } }); await reloadPrep(); }} title="Relevante">👍</button>
                            <button className="px-1 rounded hover:bg-red-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'task', action:'down', meetingId: openPrepFor!, item: { id:t.id, title:t.title, companyId: t.companyId, tags: t.tags } }); await reloadPrep(); }} title="Irrelevante">👎</button>
                            <button className="px-1 rounded hover:bg-blue-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'task', action:'pin', meetingId: openPrepFor!, item: { id:t.id } }); await reloadPrep(); }} title="Fijar">📌</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Emails relacionados */}
                {Array.isArray(prep.relatedEmails) && prep.relatedEmails.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Hilos de email</div>
                    <ul className="list-disc pl-4">
                      {prep.relatedEmails.map((e: any, i: number) => (
                        <li key={i} className="flex items-start justify-between gap-2">
                          <span className="flex-1">{e.subject} • {e.lastFrom} • {new Date(e.lastMessageAt).toLocaleString()}</span>
                          <span className="shrink-0 flex gap-1 text-xs">
                            <button className="px-1 rounded hover:bg-green-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'email', action:'up', meetingId: openPrepFor!, item: { id:e.threadId, subject:e.subject, from:e.lastFrom } }); await reloadPrep(); }} title="Relevante">👍</button>
                            <button className="px-1 rounded hover:bg-red-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'email', action:'down', meetingId: openPrepFor!, item: { id:e.threadId, subject:e.subject, from:e.lastFrom } }); await reloadPrep(); }} title="Irrelevante">👎</button>
                            <button className="px-1 rounded hover:bg-blue-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'email', action:'pin', meetingId: openPrepFor!, item: { id:e.threadId } }); await reloadPrep(); }} title="Fijar">📌</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documentos relacionados */}
                {Array.isArray(prep.relatedDocs) && prep.relatedDocs.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Documentos</div>
                    <ul className="list-disc pl-4">
                      {prep.relatedDocs.map((d: any, i: number) => (
                        <li key={i} className="flex items-start justify-between gap-2">
                          <span className="flex-1">{d.url ? (<a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{d.title}</a>) : d.title}</span>
                          <span className="shrink-0 flex gap-1 text-xs">
                            <button className="px-1 rounded hover:bg-green-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'doc', action:'up', meetingId: openPrepFor!, item: { id:d.docId, title:d.title, type:d.type } }); await reloadPrep(); }} title="Relevante">👍</button>
                            <button className="px-1 rounded hover:bg-red-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'doc', action:'down', meetingId: openPrepFor!, item: { id:d.docId, title:d.title, type:d.type } }); await reloadPrep(); }} title="Irrelevante">👎</button>
                            <button className="px-1 rounded hover:bg-blue-100" onClick={async()=>{ await MiDAIPreferencesService.sendFeedback({ itemType:'doc', action:'pin', meetingId: openPrepFor!, item: { id:d.docId } }); await reloadPrep(); }} title="Fijar">📌</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Puntos adicionales */}
                {Array.isArray(prep.talkingPoints) && prep.talkingPoints.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Puntos a tratar</div>
                    <ul className="list-disc pl-4">
                      {prep.talkingPoints.map((p: any, i: number) => (<li key={i}>{p}</li>))}
                    </ul>
                  </div>
                )}

                {Array.isArray(prep.decisions) && prep.decisions.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Decisiones</div>
                    <ul className="list-disc pl-4">
                      {prep.decisions.map((p: any, i: number) => (<li key={i}>{p}</li>))}
                    </ul>
                  </div>
                )}

                {Array.isArray(prep.risks) && prep.risks.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Riesgos</div>
                    <ul className="list-disc pl-4">
                      {prep.risks.map((p: any, i: number) => (<li key={i}>{p}</li>))}
                    </ul>
                  </div>
                )}

                {Array.isArray(prep.openQuestions) && prep.openQuestions.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium">Preguntas abiertas</div>
                    <ul className="list-disc pl-4">
                      {prep.openQuestions.map((p: any, i: number) => (<li key={i}>{p}</li>))}
                    </ul>
                  </div>
                )}

                {Array.isArray(prep.warnings) && prep.warnings.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium text-red-600">Avisos</div>
                    <ul className="list-disc pl-4 text-red-600">
                      {prep.warnings.map((w: any, i: number) => (<li key={i}>{w}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type MeetingPrepButtonsProps = {
  meetingId: string;
  meetingTitle: string;
  meetingStart: string;
  meetingEnd: string;
  context: ContextPack | null;
  onOpenPrep: (meetingId: string) => void;
  onSetPrep: (p: any) => void;
  onSetPrepLoading: (b: boolean) => void;
  meetingPrepDecisions: Record<string, { needsPrep: boolean; confidence: number; userDecided: boolean }>;
  onSetMeetingPrepDecisions: (u: Record<string, { needsPrep: boolean; confidence: number; userDecided: boolean }>) => void;
  onHandleMeetingPrepDecision: (meetingId: string, meetingTitle: string, needsPrep: boolean) => void;
  checkMeetingPrepNeeded: (meetingId: string, meetingTitle: string) => Promise<{ needsPrep: boolean; shouldAsk: boolean; confidence: number; userDecided: boolean }>;
};

function MeetingPrepButtons({
  meetingId,
  meetingTitle,
  meetingStart,
  meetingEnd,
  context,
  onOpenPrep,
  onSetPrep,
  onSetPrepLoading,
  meetingPrepDecisions,
  onSetMeetingPrepDecisions,
  onHandleMeetingPrepDecision,
  checkMeetingPrepNeeded
}: MeetingPrepButtonsProps) {
  const [prepCheck, setPrepCheck] = useState<{ needsPrep: boolean; shouldAsk: boolean; confidence: number; userDecided: boolean } | null>(null);

  useEffect(() => { (async () => { const r = await checkMeetingPrepNeeded(meetingId, meetingTitle); setPrepCheck(r); })(); }, [meetingId, meetingTitle, checkMeetingPrepNeeded]);

  if (!prepCheck) return <div className="text-xs text-gray-500 mt-2">Cargando...</div>;

  return (
    <div className="flex gap-2 mt-3">
      <button
        className="text-xs text-blue-600 hover:text-blue-800"
        onClick={async () => {
          onOpenPrep(meetingId);
          onSetPrep(null);
          if (!context) return;
          const ev = context.events.find((e) => e.id === meetingId) || { id: meetingId, title: meetingTitle, start: meetingStart, end: meetingEnd, attendees: [], onlineMeetingUrl: undefined, status: 'fixed' as const };
          onSetPrepLoading(true);
          try { const p = await MiDAIService.getMeetingPrep({ event: ev, context }); onSetPrep(p); } catch {} finally { onSetPrepLoading(false); }
        }}
      >
        Ver preparación →
      </button>

      {prepCheck.userDecided ? (
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${prepCheck.needsPrep ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {prepCheck.needsPrep ? '✓ Necesita prep' : '✗ No necesita prep'}
          </span>
          <button
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={() => {
              const copy = { ...meetingPrepDecisions }; delete copy[meetingId]; onSetMeetingPrepDecisions(copy);
              (async () => { const r = await checkMeetingPrepNeeded(meetingId, meetingTitle); setPrepCheck(r); })();
            }}
          >Cambiar</button>
        </div>
      ) : (
        <div className="flex gap-1 items-center">
          <button className="text-xs bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded" onClick={() => onHandleMeetingPrepDecision(meetingId, meetingTitle, true)}>✓ Sí</button>
          <button className="text-xs bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1 rounded" onClick={() => onHandleMeetingPrepDecision(meetingId, meetingTitle, false)}>✗ No</button>
          <span className="text-xs text-gray-500 px-1">prep? ({Math.round(prepCheck.confidence * 100)}%)</span>
        </div>
      )}
    </div>
  );
}
