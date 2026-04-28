import {create} from 'zustand';

type NetworkState = {
  isOffline: boolean;
  serverReachable: boolean;
  setOffline: (v: boolean) => void;
  setServerReachable: (v: boolean) => void;
};

export const useNetworkStore = create<NetworkState>(set => ({
  isOffline: false,
  serverReachable: true,  // optimistic default — avoids flash on startup
  setOffline: v => set({isOffline: v}),
  setServerReachable: v => set({serverReachable: v}),
}));
