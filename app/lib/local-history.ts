export type HistoryRecord = {
  id: string;
  category: "Conteúdo" | "Títulos e Legendas" | "Roteiro" | "Thumbnail" | "Ideia" | "Palavra-chave";
  title: string;
  content: string;
  image?: string;
  createdAt: string;
  favorite: boolean;
};

const databaseName = "dra-platform-local";
const storeName = "history";
const databaseVersion = 1;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("O armazenamento local não está disponível neste navegador."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o histórico local."));
  });
}

export async function listHistory(): Promise<HistoryRecord[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve((request.result as HistoryRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      request.onerror = () => reject(request.error ?? new Error("Não foi possível carregar o histórico."));
    });
  } finally {
    database.close();
  }
}

async function writeRecord(record: HistoryRecord): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível salvar no histórico local."));
      transaction.onabort = () => reject(transaction.error ?? new Error("O armazenamento local recusou o registro."));
    });
  } finally {
    database.close();
  }
}

export async function saveHistory(record: HistoryRecord): Promise<void> {
  await writeRecord(record);
}

export async function updateHistory(id: string, update: Partial<Pick<HistoryRecord, "favorite">>): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) store.put({ ...request.result, ...update });
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível atualizar o registro local."));
      transaction.onabort = () => reject(transaction.error ?? new Error("A atualização local foi cancelada."));
    });
  } finally {
    database.close();
  }
}

export async function deleteHistory(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível excluir o registro local."));
      transaction.onabort = () => reject(transaction.error ?? new Error("A exclusão local foi cancelada."));
    });
  } finally {
    database.close();
  }
}
