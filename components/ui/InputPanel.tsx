'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AppPhase } from '@/types';

type InputTab = 'paste' | 'url';

interface InputPanelProps {
  inputText: string;
  inputUrl: string;
  phase: AppPhase;
  error?: string | null;
  onTextChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onSubmitText: () => void | Promise<void>;
  onSubmitUrl: () => void | Promise<void>;
}

const tabStyles =
  'relative rounded-full px-4 py-2 text-sm font-medium transition-colors';

export default function InputPanel({
  inputText,
  inputUrl,
  phase,
  error,
  onTextChange,
  onUrlChange,
  onSubmitText,
  onSubmitUrl,
}: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<InputTab>(inputUrl && !inputText ? 'url' : 'paste');

  const isBusy = phase === 'fetching-url' || phase === 'analyzing';
  const trimmedLength = inputText.trim().length;
  const canSubmitText = trimmedLength >= 50 && !isBusy;
  const canSubmitUrl = inputUrl.trim().length > 0 && !isBusy;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeTab === 'paste') {
      if (!canSubmitText) return;
      await onSubmitText();
      return;
    }

    if (!canSubmitUrl) return;
    await onSubmitUrl();
  };

  const submitLabel =
    activeTab === 'paste'
      ? phase === 'analyzing'
        ? 'Analyzing text...'
        : 'Analyze Text'
      : phase === 'fetching-url'
        ? 'Fetching article...'
        : phase === 'analyzing'
          ? 'Analyzing article...'
          : 'Analyze URL';

  return (
    <section className="w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Analyze Source</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Feed Drift the original text before the chain warps it.
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-slate-500">
          Paste a source passage or pull a live article from a URL. The analyzer will build the persona chain
          before any cascade runs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/80 p-1">
          <button
            type="button"
            className={`${tabStyles} ${activeTab === 'paste' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('paste')}
            disabled={isBusy}
          >
            {activeTab === 'paste' ? (
              <motion.span
                layoutId="input-panel-tab"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
            ) : null}
            <span className="relative">Paste Text</span>
          </button>
          <button
            type="button"
            className={`${tabStyles} ${activeTab === 'url' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('url')}
            disabled={isBusy}
          >
            {activeTab === 'url' ? (
              <motion.span
                layoutId="input-panel-tab"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
            ) : null}
            <span className="relative">URL</span>
          </button>
        </div>

        {activeTab === 'paste' ? (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="source-text">
              Source text
            </label>
            <textarea
              id="source-text"
              value={inputText}
              onChange={(event) => onTextChange(event.target.value)}
              placeholder="Paste an article excerpt, policy memo, research abstract, or any other source text."
              className="min-h-72 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              disabled={isBusy}
            />
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className={trimmedLength >= 50 ? 'text-emerald-600' : 'text-slate-500'}>
                Minimum 50 characters. Current length: {trimmedLength}
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!canSubmitText}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="source-url">
              Article URL
            </label>
            <input
              id="source-url"
              type="url"
              value={inputUrl}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://example.com/article"
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              disabled={isBusy}
            />
            <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>We extract the clean article text first, then analyze the cleaned source.</p>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!canSubmitUrl}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </form>
    </section>
  );
}
