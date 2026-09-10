import { useCallback, useEffect, useRef, useState } from 'react';
import { createDemo, loadDemo } from '../lib/demo';
import { DEFAULT_SETTINGS } from '../lib/finance';
import * as api from '../services/api';
export default function useLedger(auth) {
  const [data, setData] = useState(() => ({ entries: [], settings: DEFAULT_SETTINGS }));
  const dataRef = useRef(data);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const identity = auth.isAuthenticated ? auth.token : 'demo';
  const session = useRef({ identity, generation: 0 });
  if (session.current.identity !== identity)
    session.current = { identity, generation: session.current.generation + 1 };
  const setLedger = useCallback((next) => {
    dataRef.current = next;
    setData(next);
  }, []);
  useEffect(() => {
    let active = true;
    if (auth.loading) return;
    setLoading(true);
    setError('');
    setLedger({ entries: [], settings: DEFAULT_SETTINGS });
    if (!auth.isAuthenticated) {
      setLedger(loadDemo());
      setLoading(false);
    } else {
      Promise.all([api.getEntries(), api.getSettings()])
        .then(([entries, settings]) => {
          if (active) setLedger({ entries, settings });
        })
        .catch(() => {
          if (active)
            setError('We couldn’t load your workspace. Check your connection and try again.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [auth.isAuthenticated, auth.loading, auth.token, revision, setLedger]);
  const commit = (origin, update) => {
    if (origin !== session.current) return;
    const next = update(dataRef.current);
    if (origin.identity === 'demo') {
      try {
        localStorage.setItem('tally-demo-v1', JSON.stringify({ ...next, version: 1 }));
      } catch (_) {
        setError('Browser storage is unavailable. Demo changes will last for this session only.');
      }
    }
    setLedger(next);
  };
  const saveEntry = async (entry, id) => {
    const origin = session.current;
    const saved = auth.isAuthenticated
      ? await (id ? api.updateEntry(id, entry) : api.createEntry(entry))
      : { ...entry, id: id || `demo-${window.crypto?.randomUUID?.() || Date.now()}` };
    commit(origin, (current) => ({
      ...current,
      entries: id
        ? current.entries.map((e) => (e.id === id ? saved : e))
        : [saved, ...current.entries],
    }));
  };
  const removeEntry = async (id) => {
    const origin = session.current;
    if (auth.isAuthenticated) await api.deleteEntry(id);
    commit(origin, (current) => ({
      ...current,
      entries: current.entries.filter((e) => e.id !== id),
    }));
  };
  const saveSettings = async (settings) => {
    const origin = session.current;
    const saved = auth.isAuthenticated ? await api.updateSettings(settings) : settings;
    commit(origin, (current) => ({ ...current, settings: saved }));
  };
  return {
    ...data,
    loading,
    error,
    saveEntry,
    removeEntry,
    saveSettings,
    reset: () => commit(session.current, () => createDemo()),
    refresh: () => setRevision((n) => n + 1),
  };
}
