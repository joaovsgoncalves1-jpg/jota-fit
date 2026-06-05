/**
 * CRUD Firestore compatível com a interface Base44 (filter/list/create/update/delete).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit as fsLimit,
} from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';

function requireDb() {
  if (!firestoreDb) {
    throw new Error(
      '[firestore] Firebase não configurado. Preencha VITE_FIREBASE_* em .env.local'
    );
  }
  return firestoreDb;
}

function docToRecord(snap) {
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

function sortRecords(records, sortKey) {
  if (!sortKey || !records.length) return records;
  const desc = sortKey.startsWith('-');
  const field = desc ? sortKey.slice(1) : sortKey;
  return [...records].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

/**
 * @param {string} collectionName — ex: StudentProfile, Routine
 */
export function createFirestoreEntity(collectionName) {
  const colRef = () => collection(requireDb(), collectionName);

  return {
    /**
     * @param {Record<string, unknown>} criteria
     * @param {string} [sort]
     * @param {number} [max]
     */
    async filter(criteria = {}, sort, max) {
      const entries = Object.entries(criteria).filter(([, v]) => v !== undefined);

      if (entries.length === 1 && entries[0][0] === 'id') {
        const snap = await getDoc(doc(colRef(), String(entries[0][1])));
        const one = docToRecord(snap);
        return one ? [one] : [];
      }

      const constraints = entries.map(([k, v]) => where(k, '==', v));
      if (typeof max === 'number') constraints.push(fsLimit(max));

      const q = constraints.length ? query(colRef(), ...constraints) : query(colRef());
      const snap = await getDocs(q);
      let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows = sortRecords(rows, sort);
      if (typeof max === 'number' && !constraints.some((c) => c.type === 'limit')) {
        rows = rows.slice(0, max);
      }
      return rows;
    },

    async list(sort, max = 500) {
      const snap = await getDocs(query(colRef(), fsLimit(Math.min(max, 500))));
      let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows = sortRecords(rows, sort);
      return rows.slice(0, max);
    },

    async create(data) {
      const now = new Date().toISOString();
      const payload = {
        ...data,
        created_date: data.created_date || now,
        updated_date: now,
      };
      const ref = await addDoc(colRef(), payload);
      const snap = await getDoc(ref);
      return docToRecord(snap);
    },

    async update(id, patch) {
      const ref = doc(colRef(), id);
      await updateDoc(ref, {
        ...patch,
        updated_date: new Date().toISOString(),
      });
      const snap = await getDoc(ref);
      return docToRecord(snap);
    },

    async delete(id) {
      await deleteDoc(doc(colRef(), id));
    },
  };
}

export function createFirestoreDb() {
  const cache = {};
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        const name = String(prop);
        if (!cache[name]) cache[name] = createFirestoreEntity(name);
        return cache[name];
      },
    }
  );
}