// src/electron.d.ts
export interface ElectronAPI {
  createBandwidthMinor: (args: any) => void;
  onBandwidthMinorReply: (callback: (response: any) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
