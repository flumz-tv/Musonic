import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export type ColorScheme = 'dark' | 'light' | 'system';
export type Locale = 'fr' | 'en';

export type Server = {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
};

type SettingsState = {
  servers: Server[];
  activeServerId: string | null;
  colorScheme: ColorScheme;
  accentColor: string;
  crossfadeDuration: number;
  setColorScheme: (scheme: ColorScheme) => void;
  setAccentColor: (color: string) => void;
  setCrossfadeDuration: (duration: number) => void;
  addServer: (server: Server) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string) => void;
  disconnectServer: () => void;
  getActiveServer: () => Server | null;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  useWaveformScrubber: boolean;
  setUseWaveformScrubber: (use: boolean) => void;
  rotationLocked: boolean;
  setRotationLocked: (locked: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: null,
      colorScheme: 'system',
      accentColor: '#FF6B35',
      crossfadeDuration: 0,
      setColorScheme: scheme => set({colorScheme: scheme}),
      setAccentColor: color => set({accentColor: color}),
      setCrossfadeDuration: duration => set({crossfadeDuration: duration}),
      addServer: server =>
        set(state => ({servers: [...state.servers, server]})),
      removeServer: id =>
        set(state => ({servers: state.servers.filter(s => s.id !== id)})),
      setActiveServer: id => set({activeServerId: id}),
      disconnectServer: () => set({activeServerId: null}),
      locale: 'fr',
      setLocale: locale => set({locale}),
      useWaveformScrubber: false,
      setUseWaveformScrubber: use => set({useWaveformScrubber: use}),
      rotationLocked: false,
      setRotationLocked: locked => set({rotationLocked: locked}),
      getActiveServer: () => {
        const {servers, activeServerId} = get();
        return servers.find(s => s.id === activeServerId) ?? null;
      },
    }),
    {
      name: 'musonic-settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
