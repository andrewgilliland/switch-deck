/// <reference types="astro/client" />

interface Window {
  switchDeck: {
    captureInput(label?: string): void;
    releaseInput(): void;
    readonly isCaptured: boolean;
  };
}
