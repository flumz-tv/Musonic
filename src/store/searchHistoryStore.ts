/**
 * @file searchHistoryStore.ts
 * @description Zustand + MMKV store for recent search terms. Keeps the last 10
 *   unique queries; shown in SearchActive when the input is focused and empty.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

const MAX_HISTORY = 10;

type SearchHistoryState = {
  history: string[];
  addTerm: (term: string) => void;
  removeTerm: (term: string) => void;
  clearHistory: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    set => ({
      history: [],
      addTerm: (term: string) =>
        set(state => {
          const clean = term.trim();
          if (!clean) return state;
          const deduped = state.history.filter(h => h !== clean);
          return {history: [clean, ...deduped].slice(0, MAX_HISTORY)};
        }),
      removeTerm: (term: string) =>
        set(state => ({history: state.history.filter(h => h !== term)})),
      clearHistory: () => set({history: []}),
    }),
    {
      name: 'musonic-search-history',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
