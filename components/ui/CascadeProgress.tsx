'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CascadeResult, ChainSpec, NodeMetrics, NodeOutput, StreamEvent } from '@/types';

type NodeStatus = 'waiting' | 'running' | 'complete';

interface CascadeProgressProps {
  sessionId: string;
  chainSpec: ChainSpec;
  onNodeComplete: (node: NodeOutput, metrics: NodeMetrics) => void;
  onComplete: (result: CascadeResult) => void;
  onError?: (message: string) => void;
}

const statusClasses: Record<NodeStatus, string> = {
  waiting: 'border-slate-200 bg-slate-100 text-slate-500',
  running: 'border-sky-200 bg-sky-50 text-sky-700',
  complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function createInitialStatuses(chainSpec: ChainSpec) {
  return chainSpec.personas.reduce<Record<string, NodeStatus>>((accumulator, persona, index) => {
    accumulator[persona.id] = index === 0 ? 'running' : 'waiting';
    return accumulator;
  }, {});
}

export default function CascadeProgress({
  sessionId,
  chainSpec,
  onNodeComplete,
  onComplete,
  onError,
}: CascadeProgressProps) {
  const [statusByPersona, setStatusByPersona] = useState<Record<string, NodeStatus>>(() => createInitialStatuses(chainSpec));
  const [statusMessage, setStatusMessage] = useState(
    `Starting with ${chainSpec.personas[0]?.name ?? 'the first persona'}...`
  );
  const didFinishRef = useRef(false);

  // Store latest callbacks in refs so the EventSource handlers always call
  // the most-current version without needing to re-create the EventSource.
  const onNodeCompleteRef = useRef(onNodeComplete);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onNodeCompleteRef.current = onNodeComplete;
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const completedCount = useMemo(
    () => Object.values(statusByPersona).filter((status) => status === 'complete').length,
    [statusByPersona]
  );

  const progress = useMemo(() => Math.round((completedCount / Math.max(chainSpec.personas.length, 1)) * 100), [chainSpec.personas.length, completedCount]);

  const emitError = useCallback((message: string) => {
    onErrorRef.current?.(message);
  }, []);

  const handleStreamEvent = useCallback((payload: StreamEvent, eventSource: EventSource) => {
    if (payload.type === 'node-complete') {
      setStatusByPersona((previous) => {
        const next = { ...previous, [payload.node.personaId]: 'complete' as const };
        const nextPersona = chainSpec.personas[payload.nodeIndex + 1];
        if (nextPersona) next[nextPersona.id] = 'running';
        return next;
      });
      setStatusMessage(`${payload.node.personaName} finished. Moving to the next persona.`);
      onNodeCompleteRef.current(payload.node, payload.metrics);
      return;
    }

    if (payload.type === 'cascade-complete') {
      didFinishRef.current = true;
      setStatusByPersona(
        chainSpec.personas.reduce<Record<string, NodeStatus>>((accumulator, persona) => {
          accumulator[persona.id] = 'complete';
          return accumulator;
        }, {})
      );
      setStatusMessage('Cascade complete. Preparing the result views...');
      eventSource.close();
      onCompleteRef.current(payload.result);
      return;
    }

    if (payload.type === 'error') {
      didFinishRef.current = true;
      setStatusMessage(payload.message);
      eventSource.close();
      emitError(payload.message);
    }
  }, [chainSpec.personas, emitError]);

  useEffect(() => {
    didFinishRef.current = false;

    const eventSource = new EventSource(`/api/cascade?sessionId=${encodeURIComponent(sessionId)}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as StreamEvent;
        handleStreamEvent(payload, eventSource);
      } catch {
        const message = 'Unable to parse a cascade event.';
        didFinishRef.current = true;
        setStatusMessage(message);
        eventSource.close();
        emitError(message);
      }
    };

    eventSource.onerror = () => {
      if (didFinishRef.current) return;
      const message = 'The cascade stream disconnected unexpectedly.';
      didFinishRef.current = true;
      setStatusMessage(message);
      eventSource.close();
      emitError(message);
    };

    return () => {
      didFinishRef.current = true;
      eventSource.close();
    };
  }, [sessionId, handleStreamEvent, emitError]);

  return (
    <section className="w-full max-w-5xl rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Cascade Running</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {completedCount} of {chainSpec.personas.length} personas finished
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{statusMessage}</p>
        </div>
        <div className="min-w-52 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Overall progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-slate-950"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {chainSpec.personas.map((persona, index) => {
          const status = statusByPersona[persona.id] ?? 'waiting';
          return (
            <motion.div
              key={persona.id}
              layout
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Node {index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{persona.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{persona.role}</p>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${persona.id}-${status}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.18 }}
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses[status]}`}
                  >
                    {status}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
