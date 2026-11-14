"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteHistory, listHistory, saveHistory, updateHistory, type HistoryRecord } from "./local-history";

export function useLocalHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setRecords(await listHistory());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico local.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void listHistory().then((loaded) => {
      if (active) {
        setRecords(loaded);
        setError("");
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico local.");
    }).finally(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  const addRecord = useCallback(async (category: HistoryRecord["category"], title: string, content: string, image?: string): Promise<string | null> => {
    const record: HistoryRecord = {
      id: crypto.randomUUID(),
      category,
      title: title.trim() || category,
      content,
      image,
      createdAt: new Date().toISOString(),
      favorite: false,
    };
    try {
      await saveHistory(record);
      setRecords((current) => [record, ...current]);
      setError("");
      return record.id;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar no dispositivo.");
      return null;
    }
  }, []);

  const add = useCallback(async (category: HistoryRecord["category"], title: string, content: string, image?: string) => {
    return !!(await addRecord(category, title, content, image));
  }, [addRecord]);

  const updateRecord = useCallback(async (id: string, update: Pick<HistoryRecord, "title" | "content">) => {
    try {
      await updateHistory(id, update);
      setRecords((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
      setError("");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o registro local.");
      return false;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const record = records.find((item) => item.id === id);
    if (!record) return;
    try {
      await updateHistory(id, { favorite: !record.favorite });
      setRecords((current) => current.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o favorito.");
    }
  }, [records]);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteHistory(id);
      setRecords((current) => current.filter((item) => item.id !== id));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir o registro.");
    }
  }, []);

  return { records, ready, error, add, addRecord, updateRecord, toggleFavorite, remove, reload };
}
