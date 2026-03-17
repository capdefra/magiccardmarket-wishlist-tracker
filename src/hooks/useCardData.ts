import { useState, useCallback, useEffect, useRef } from 'react';
import { TrackerData, PriceEntry } from '../types';
import { loadData, saveData, mergeNewPrices } from '../utils/storage';
import { getToken, saveToGist, loadFromGist } from '../utils/gist';

export function useCardData() {
  const [data, setData] = useState<TrackerData>(() => loadData());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const syncTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Debounced save to Gist
  const syncToGist = useCallback((newData: TrackerData) => {
    const token = getToken();
    if (!token) return;

    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await saveToGist(token, newData);
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }, 1500);
  }, []);

  // Save locally + sync to Gist
  const persist = useCallback((newData: TrackerData) => {
    saveData(newData);
    syncToGist(newData);
  }, [syncToGist]);

  // Load from Gist on mount if token exists
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    setSyncStatus('syncing');
    loadFromGist(token)
      .then((remote) => {
        const local = loadData();
        // Merge remote into local
        const remotePrices: Record<string, PriceEntry[]> = {};
        for (const [name, card] of Object.entries(remote.cards)) {
          remotePrices[name] = card.prices;
        }
        const merged = mergeNewPrices(local, remotePrices);
        // Merge local into merged (for cards only in local)
        const localPrices: Record<string, PriceEntry[]> = {};
        for (const [name, card] of Object.entries(local.cards)) {
          localPrices[name] = card.prices;
        }
        const fullyMerged = mergeNewPrices(merged, localPrices);
        saveData(fullyMerged);
        setData(fullyMerged);
        saveToGist(token, fullyMerged).catch(() => {});
        setSyncStatus('synced');
      })
      .catch(() => {
        setSyncStatus('error');
      });
  }, []);

  const addPrices = useCallback((newPrices: Record<string, PriceEntry[]>) => {
    setData((prev) => {
      const merged = mergeNewPrices(prev, newPrices);
      persist(merged);
      return merged;
    });
  }, [persist]);

  const replaceData = useCallback((newData: TrackerData) => {
    persist(newData);
    setData(newData);
  }, [persist]);

  const deleteCard = useCallback((cardName: string) => {
    setData((prev) => {
      const updated = { cards: { ...prev.cards } };
      delete updated.cards[cardName];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearAll = useCallback(() => {
    const empty: TrackerData = { cards: {} };
    persist(empty);
    setData(empty);
  }, [persist]);

  const forceSync = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setSyncStatus('syncing');
    try {
      const remote = await loadFromGist(token);
      const allPrices: Record<string, PriceEntry[]> = {};
      for (const [name, card] of Object.entries(remote.cards)) {
        allPrices[name] = card.prices;
      }
      const merged = mergeNewPrices(data, allPrices);
      saveData(merged);
      setData(merged);
      await saveToGist(token, merged);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [data]);

  return { data, addPrices, replaceData, deleteCard, clearAll, syncStatus, forceSync };
}
