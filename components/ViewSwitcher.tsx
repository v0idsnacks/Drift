'use client';

import { motion } from 'framer-motion';
import type { ActiveView } from '@/types';

interface ViewSwitcherProps {
  activeView: ActiveView;
  onChange: (view: ActiveView) => void;
}

const views: { id: ActiveView; label: string }[] = [
  { id: 'river', label: 'River' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'damage', label: 'Damage' },
];

export default function ViewSwitcher({ activeView, onChange }: ViewSwitcherProps) {
  return (
    <div 
      className="flex gap-6 border-b border-slate-200 px-4" 
      role="tablist" 
      aria-label="Visualization views"
    >
      {views.map((view) => {
        const isActive = activeView === view.id;
        
        return (
          <button
            key={view.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${view.id}-tab-panel`}
            id={`${view.id}-tab`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(view.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentIndex = views.findIndex((v) => v.id === activeView);
                let nextIndex = e.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
                if (nextIndex < 0) nextIndex = views.length - 1;
                if (nextIndex >= views.length) nextIndex = 0;
                onChange(views[nextIndex].id);
                // Also focus the newly selected tab
                const nextTab = document.getElementById(`${views[nextIndex].id}-tab`);
                nextTab?.focus();
              }
            }}
            className={`relative py-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {view.label}
            {isActive && (
              <motion.div
                layoutId="view-switcher-underline"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-sky-500"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
