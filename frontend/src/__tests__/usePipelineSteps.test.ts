import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSteps, usePipelineSteps } from '../hooks/usePipelineSteps';
import type { ProcessFormValues } from '../types';

const base: ProcessFormValues = {
  filterType: 'none',
  watermarkPosition: 'bottom-right',
  watermarkSize: 30,
  compressionQuality: 1.0,
};

describe('buildSteps', () => {
  it('always starts with upload step', () => {
    const steps = buildSteps(base);
    expect(steps[0].key).toBe('upload');
  });

  it('always ends with compress step', () => {
    const steps = buildSteps(base);
    expect(steps[steps.length - 1].key).toBe('compress');
  });

  it('minimum pipeline is upload + compress', () => {
    const steps = buildSteps(base);
    expect(steps).toHaveLength(2);
  });

  it('adds resize step when resizeWidth is provided', () => {
    const steps = buildSteps({ ...base, resizeWidth: 800 });
    expect(steps.some((s) => s.key === 'resize')).toBe(true);
  });

  it('adds resize step when resizeHeight is provided', () => {
    const steps = buildSteps({ ...base, resizeHeight: 600 });
    expect(steps.some((s) => s.key === 'resize')).toBe(true);
  });

  it('does not add filter step when filterType is none', () => {
    const steps = buildSteps(base);
    expect(steps.some((s) => s.key === 'filter')).toBe(false);
  });

  it('adds filter step when filterType is grayscale', () => {
    const steps = buildSteps({ ...base, filterType: 'grayscale' });
    expect(steps.some((s) => s.key === 'filter')).toBe(true);
  });

  it('adds filter step when filterType is sepia', () => {
    const steps = buildSteps({ ...base, filterType: 'sepia' });
    expect(steps.some((s) => s.key === 'filter')).toBe(true);
  });

  it('adds filter step when filterType is brightness', () => {
    const steps = buildSteps({ ...base, filterType: 'brightness' });
    expect(steps.some((s) => s.key === 'filter')).toBe(true);
  });

  it('adds watermark step when watermarkText is non-empty', () => {
    const steps = buildSteps({ ...base, watermarkText: 'Hello' });
    expect(steps.some((s) => s.key === 'watermark')).toBe(true);
  });

  it('does not add watermark step when watermarkText is empty', () => {
    const steps = buildSteps({ ...base, watermarkText: '' });
    expect(steps.some((s) => s.key === 'watermark')).toBe(false);
  });

  it('full pipeline has all 5 steps in expected order', () => {
    const steps = buildSteps({
      ...base,
      resizeWidth: 800,
      filterType: 'sepia',
      watermarkText: 'test',
    });
    expect(steps.map((s) => s.key)).toEqual([
      'upload',
      'resize',
      'filter',
      'watermark',
      'compress',
    ]);
  });

  it('compress description includes percentage', () => {
    const steps = buildSteps({ ...base, compressionQuality: 0.8 });
    const compress = steps.find((s) => s.key === 'compress');
    expect(compress?.description).toContain('80%');
  });
});

describe('usePipelineSteps', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with empty steps and no running state', () => {
    const { result } = renderHook(() => usePipelineSteps());
    expect(result.current.steps).toHaveLength(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('populates steps after startSimulation', () => {
    const { result } = renderHook(() => usePipelineSteps());
    act(() => result.current.startSimulation(base));
    expect(result.current.steps.length).toBeGreaterThan(0);
    expect(result.current.isRunning).toBe(true);
  });

  it('first step is process immediately after start', () => {
    const { result } = renderHook(() => usePipelineSteps());
    act(() => result.current.startSimulation(base));
    expect(result.current.steps[0].status).toBe('process');
  });

  it('marks all steps as finish after completeAll', () => {
    const { result } = renderHook(() => usePipelineSteps());
    act(() => result.current.startSimulation(base));
    act(() => result.current.completeAll());
    expect(result.current.steps.every((s) => s.status === 'finish')).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('marks current step as error after failCurrent', () => {
    const { result } = renderHook(() => usePipelineSteps());
    act(() => result.current.startSimulation(base));
    act(() => result.current.failCurrent());
    expect(result.current.steps.some((s) => s.status === 'error')).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('clears steps after reset', () => {
    const { result } = renderHook(() => usePipelineSteps());
    act(() => result.current.startSimulation(base));
    act(() => result.current.reset());
    expect(result.current.steps).toHaveLength(0);
    expect(result.current.isRunning).toBe(false);
  });
});
