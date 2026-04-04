'use client';

import { startTransition, useReducer, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ViewSwitcher from '@/components/ViewSwitcher';
import ChainPreview from '@/components/ui/ChainPreview';
import CascadeProgress from '@/components/ui/CascadeProgress';
import DisagreementScore from '@/components/ui/DisagreementScore';
import InputPanel from '@/components/ui/InputPanel';
import TimelineView from '@/components/views/TimelineView';
import { generateSessionId } from '@/lib/utils';
import type { AppState, CascadeResult, ChainSpec, NodeMetrics, NodeOutput } from '@/types';

type Action =
  | { type: 'set-input-text'; value: string }
  | { type: 'set-input-url'; value: string }
  | { type: 'fetch-url-start' }
  | { type: 'analyze-start' }
  | { type: 'analyze-success'; inputText: string; chainSpec: ChainSpec }
  | { type: 'cascade-start'; sessionId: string }
  | { type: 'node-complete'; node: NodeOutput; metrics: NodeMetrics; chainDepth: number }
  | { type: 'cascade-complete'; result: CascadeResult }
  | { type: 'set-active-view'; view: AppState['activeView'] }
  | { type: 'back-to-input' }
  | { type: 'error'; message: string };

interface FetchUrlResponse {
  cleanText: string;
  title: string;
  source: string;
  wordCount: number;
}

interface AnalyzeResponse {
  chainSpec: ChainSpec;
}

interface CascadeStartResponse {
  sessionId: string;
}

const initialState: AppState = {
  phase: 'idle',
  sessionId: null,
  inputText: '',
  inputUrl: '',
  chainSpec: null,
  cascadeProgress: 0,
  partialNodes: [],
  partialMetrics: [],
  result: null,
  error: null,
  activeView: 'timeline',
};

function upsertNode(list: NodeOutput[], node: NodeOutput) {
  const existingIndex = list.findIndex((entry) => entry.personaId === node.personaId);
  if (existingIndex === -1) return [...list, node];
  const next = [...list];
  next[existingIndex] = node;
  return next;
}

function upsertMetrics(list: NodeMetrics[], metrics: NodeMetrics) {
  const existingIndex = list.findIndex((entry) => entry.personaId === metrics.personaId);
  if (existingIndex === -1) return [...list, metrics];
  const next = [...list];
  next[existingIndex] = metrics;
  return next;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set-input-text':
      return { ...state, inputText: action.value, error: null };
    case 'set-input-url':
      return { ...state, inputUrl: action.value, error: null };
    case 'fetch-url-start':
      return { ...state, phase: 'fetching-url', error: null };
    case 'analyze-start':
      return { ...state, phase: 'analyzing', error: null };
    case 'analyze-success':
      return {
        ...state,
        phase: 'chain-preview',
        inputText: action.inputText,
        chainSpec: action.chainSpec,
        sessionId: null,
        cascadeProgress: 0,
        partialNodes: [],
        partialMetrics: [],
        result: null,
        error: null,
      };
    case 'cascade-start':
      return {
        ...state,
        phase: 'cascading',
        sessionId: action.sessionId,
        cascadeProgress: 0,
        partialNodes: [],
        partialMetrics: [],
        result: null,
        error: null,
      };
    case 'node-complete': {
      const partialNodes = upsertNode(state.partialNodes, action.node);
      const partialMetrics = upsertMetrics(state.partialMetrics, action.metrics);
      return {
        ...state,
        partialNodes,
        partialMetrics,
        cascadeProgress: Math.round((partialNodes.length / Math.max(action.chainDepth, 1)) * 100),
      };
    }
    case 'cascade-complete':
      return {
        ...state,
        phase: 'complete',
        sessionId: action.result.sessionId,
        chainSpec: action.result.chainSpec,
        cascadeProgress: 100,
        partialNodes: action.result.nodes,
        partialMetrics: action.result.metrics,
        result: action.result,
        error: null,
      };
    case 'set-active-view':
      return { ...state, activeView: action.view };
    case 'back-to-input':
      return {
        ...state,
        phase: 'idle',
        sessionId: null,
        chainSpec: null,
        cascadeProgress: 0,
        partialNodes: [],
        partialMetrics: [],
        result: null,
        error: null,
      };
    case 'error':
      return { ...state, phase: 'error', error: action.message };
    default:
      return state;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed.');
  }

  return data;
}

function renderLoadingCard(message: string, detail: string) {
  return (
    <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/90 p-10 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">{message}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{detail}</p>
    </section>
  );
}

export default function AnalyzePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLaunchingCascade, setIsLaunchingCascade] = useState(false);

  const handleAnalyzeText = async () => {
    const text = state.inputText.trim();
    dispatch({ type: 'analyze-start' });

    try {
      const data = await postJson<AnalyzeResponse>('/api/analyze', { text });
      dispatch({ type: 'analyze-success', inputText: text, chainSpec: data.chainSpec });
    } catch (error) {
      dispatch({ type: 'error', message: error instanceof Error ? error.message : 'Unable to analyze the text.' });
    }
  };

  const handleAnalyzeUrl = async () => {
    const url = state.inputUrl.trim();
    dispatch({ type: 'fetch-url-start' });

    try {
      const extracted = await postJson<FetchUrlResponse>('/api/fetch-url', { url });
      dispatch({ type: 'set-input-text', value: extracted.cleanText });
      dispatch({ type: 'analyze-start' });

      const analyzed = await postJson<AnalyzeResponse>('/api/analyze', { text: extracted.cleanText });
      dispatch({ type: 'analyze-success', inputText: extracted.cleanText, chainSpec: analyzed.chainSpec });
    } catch (error) {
      dispatch({ type: 'error', message: error instanceof Error ? error.message : 'Unable to analyze the URL.' });
    }
  };

  const handleRunCascade = async () => {
    if (!state.chainSpec) return;

    setIsLaunchingCascade(true);
    const sessionId = generateSessionId();

    try {
      const response = await postJson<CascadeStartResponse>('/api/cascade', {
        sessionId,
        source: state.inputText,
        chainSpec: state.chainSpec,
      });
      dispatch({ type: 'cascade-start', sessionId: response.sessionId });
    } catch (error) {
      dispatch({ type: 'error', message: error instanceof Error ? error.message : 'Unable to start the cascade.' });
    } finally {
      setIsLaunchingCascade(false);
    }
  };

  const completeView = state.result ? (
    <section className="w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Cascade Complete</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            The source drifted through {state.result.chainSpec.chainDepth} personas.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{state.result.chainSpec.contentSummary}</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <ViewSwitcher activeView={state.activeView} onChange={(view) => dispatch({ type: 'set-active-view', view })} />
          <button
            type="button"
            onClick={() => dispatch({ type: 'back-to-input' })}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Analyze another source
          </button>
        </div>
      </div>

      <DisagreementScore score={state.result.disagreementScore} />

      {state.activeView === 'timeline' ? (
        <TimelineView
          source={state.result.source}
          chainSpec={state.result.chainSpec}
          nodes={state.result.nodes}
          metrics={state.result.metrics}
        />
      ) : null}

      {state.activeView === 'river' ? (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-sm leading-7 text-slate-600">
          River view is still scaffolded in this repo, but the timeline already shows the complete node-by-node cascade with live metrics.
        </section>
      ) : null}

      {state.activeView === 'damage' ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Damage Report</h2>
          <div className="mt-5 grid gap-3">
            {(state.result.damageSegments ?? []).length > 0 ? (
              state.result.damageSegments?.map((segment, index) => (
                <article key={`${segment.text}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm leading-7 text-slate-700">{segment.text}</p>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {segment.fate}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-slate-600">No segment-level damage data was returned for this run.</p>
            )}
          </div>
        </section>
      ) : null}
    </section>
  ) : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_42%,#eef2ff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
        <AnimatePresence mode="wait">
          {state.phase === 'idle' || state.phase === 'error' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="flex w-full justify-center"
            >
              <InputPanel
                inputText={state.inputText}
                inputUrl={state.inputUrl}
                phase={state.phase}
                error={state.error}
                onTextChange={(value) => dispatch({ type: 'set-input-text', value })}
                onUrlChange={(value) => dispatch({ type: 'set-input-url', value })}
                onSubmitText={handleAnalyzeText}
                onSubmitUrl={handleAnalyzeUrl}
              />
            </motion.div>
          ) : null}

          {state.phase === 'fetching-url' ? (
            <motion.div
              key="fetching-url"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="flex w-full justify-center"
            >
              {renderLoadingCard('Fetching article', 'Drift is extracting the clean article body before the analyzer runs.')}
            </motion.div>
          ) : null}

          {state.phase === 'analyzing' ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="flex w-full justify-center"
            >
              {renderLoadingCard('Analyzing source', 'The content analyzer is deciding which personas and distortion pattern fit this source.')}
            </motion.div>
          ) : null}

          {state.phase === 'chain-preview' && state.chainSpec ? (
            <motion.div
              key="chain-preview"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="flex w-full justify-center"
            >
              <ChainPreview
                chainSpec={state.chainSpec}
                isStarting={isLaunchingCascade}
                onConfirm={handleRunCascade}
                onBack={() => dispatch({ type: 'back-to-input' })}
              />
            </motion.div>
          ) : null}

          {state.phase === 'cascading' && state.chainSpec && state.sessionId ? (
            <motion.div
              key="cascading"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="flex w-full justify-center"
            >
              <CascadeProgress
                sessionId={state.sessionId}
                chainSpec={state.chainSpec}
                onNodeComplete={(node, metrics) =>
                  dispatch({ type: 'node-complete', node, metrics, chainDepth: state.chainSpec?.chainDepth ?? 1 })
                }
                onComplete={(result) => startTransition(() => dispatch({ type: 'cascade-complete', result }))}
                onError={(message) => dispatch({ type: 'error', message })}
              />
            </motion.div>
          ) : null}

          {state.phase === 'complete' && completeView ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="flex w-full justify-center"
            >
              {completeView}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
