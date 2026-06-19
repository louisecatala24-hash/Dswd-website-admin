import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, memoryLocalCache, getDocs, Query, QuerySnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function safeOnSnapshot(
  q: Query<DocumentData, DocumentData>,
  onNext: (snapshot: QuerySnapshot<DocumentData, DocumentData>) => void,
  onError?: (error: FirestoreError) => void
): () => void {
  let active = true;
  let intervalId: any = null;
  let lastSerialized = '';

  const runQuery = async () => {
    if (!active) return;
    try {
      const snapshot = await getDocs(q);
      if (!active) return;
      
      const docsSerialized = snapshot.docs.map(d => ({ id: d.id, data: d.data() }));
      const serialized = JSON.stringify(docsSerialized);
      if (serialized !== lastSerialized) {
        lastSerialized = serialized;
        onNext(snapshot);
      }
    } catch (err: any) {
      if (onError && active) {
        onError(err);
      }
    }
  };

  runQuery();
  intervalId = setInterval(runQuery, 3500);

  return () => {
    active = false;
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}

export { safeOnSnapshot as onSnapshot };

// Connectivity check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
