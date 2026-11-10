import { useCallback, useEffect, useState } from 'react';
import type { FundraisingEvent, ISODate } from '../types/event';
import { isValidISODate } from '../utils/dateUtils';
import { clearDemoState, createInitialState, loadDemoState, saveDemoState, type DemoState } from '../utils/demoStorage';

/**
 * Owns the demo dataset and the as-of date. Every change is written to
 * localStorage so edits survive a page refresh until "Reset Demo Data".
 */
export function useEventData() {
  const [state, setState] = useState<DemoState>(loadDemoState);

  useEffect(() => {
    saveDemoState(state);
  }, [state]);

  const setAsOfDate = useCallback((date: ISODate) => {
    if (!isValidISODate(date)) return;
    setState((s) => ({ ...s, asOfDate: date }));
  }, []);

  const updateEvent = useCallback((id: string, updater: (event: FundraisingEvent) => FundraisingEvent) => {
    setState((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? updater(e) : e)) }));
  }, []);

  const resetDemo = useCallback(() => {
    clearDemoState();
    setState(createInitialState());
  }, []);

  return { events: state.events, asOfDate: state.asOfDate, setAsOfDate, updateEvent, resetDemo };
}
