import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { watchFileChanges } from '../lib/reload';

class FakeXHR {
  static responses: string[] = [];
  static requestCount = 0;
  responseText = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  open(): void {}
  send(): void {
    FakeXHR.requestCount++;
    this.responseText = FakeXHR.responses.length > 0 ? FakeXHR.responses.shift()! : 'same';
    this.onload?.();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeXHR.responses = [];
  FakeXHR.requestCount = 0;
  vi.stubGlobal('XMLHttpRequest', FakeXHR);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('watchFileChanges', () => {
  it('fires onChange only when content actually changes', () => {
    FakeXHR.responses = ['old', 'old', 'new'];
    const onChange = vi.fn();
    const stop = watchFileChanges('file:///doc.md', 1000, 'old', onChange);

    vi.advanceTimersByTime(2000);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('new');
    stop();
  });

  it('does not refire for the same content twice', () => {
    FakeXHR.responses = ['new', 'new'];
    const onChange = vi.fn();
    const stop = watchFileChanges('file:///doc.md', 1000, 'old', onChange);
    vi.advanceTimersByTime(2000);
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
  });

  it('stops polling after stop() is called', () => {
    const stop = watchFileChanges('file:///doc.md', 1000, 'same', () => {});
    vi.advanceTimersByTime(1000);
    stop();
    vi.advanceTimersByTime(5000);
    expect(FakeXHR.requestCount).toBe(1);
  });

  it('ignores empty responses (editor truncate-then-write saves)', () => {
    FakeXHR.responses = ['', 'new'];
    const onChange = vi.fn();
    const stop = watchFileChanges('file:///doc.md', 1000, 'old', onChange);
    vi.advanceTimersByTime(1000);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenCalledWith('new');
    stop();
  });
});
