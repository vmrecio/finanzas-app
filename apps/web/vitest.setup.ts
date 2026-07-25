import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

// jsdom has no ResizeObserver; Recharts' `ResponsiveContainer` (used by the
// dashboard charts) requires one to exist. A no-op stub is sufficient since
// dashboard tests assert against the accessible list/table markup rendered
// alongside each chart, never against SVG layout produced by real resizing.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
