'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  defaultOpenId?: string;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ items, defaultOpenId }) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || items[0]?.id || null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3.5 max-w-3xl mx-auto">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'bg-white border-accent shadow-md'
                : 'bg-white border-sable/60 hover:border-accent/40 shadow-xs'
            }`}
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="font-display font-bold text-base sm:text-lg text-sombre flex items-center gap-2.5">
                <HelpCircle className={`w-5 h-5 shrink-0 ${isOpen ? 'text-accent' : 'text-sombre/40'}`} />
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-sombre/60 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-accent' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-sombre/80 font-sans leading-relaxed border-t border-sable/30 animate-in fade-in duration-200">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
