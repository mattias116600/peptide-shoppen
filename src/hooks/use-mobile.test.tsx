import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './use-mobile';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('useIsMobile', () => {
  it('returns true below 768 pixels and false at 768 pixels', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(767);
    const mobile = renderHook(() => useIsMobile());
    expect(mobile.result.current).toBe(true);
    mobile.unmount();
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(768);
    const desktop = renderHook(() => useIsMobile());
    expect(desktop.result.current).toBe(false);
  });

  it('updates on a media change and removes the listener on unmount', () => {
    let change: (() => void) | undefined;
    const remove = vi.fn();
    const width = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(900);
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: false, media: query, onchange: null,
      addEventListener: (_event: string, listener: unknown) => { if (typeof listener === 'function') change = () => listener(); },
      removeEventListener: remove, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => true,
    }));
    const hook = renderHook(() => useIsMobile());
    expect(hook.result.current).toBe(false);
    width.mockReturnValue(390);
    act(() => change?.());
    expect(hook.result.current).toBe(true);
    hook.unmount();
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
  });
});