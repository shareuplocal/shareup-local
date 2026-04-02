import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── OperationType : gardé pour compatibilité avec les appels existants ───────
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// ─── handleFirestoreError → handleSupabaseError ───────────────────────────────
// Renommé mais gardé sous l'ancien nom pour ne pas avoir à modifier tous les imports

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  _userOverride?: any
): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Supabase Error [${operationType}] on ${path}:`, errorMessage);
  throw new Error(errorMessage);
}

// Alias moderne
export const handleSupabaseError = handleFirestoreError;

// ─── commitInChunks : n'est plus utilisé avec Supabase ───────────────────────
// Gardé pour compatibilité. Supabase n'a pas la limite de 500 ops de Firestore.
export async function commitInChunks(
  _db: any,
  actions: (() => Promise<void>)[],
  _chunkSize: number = 450
): Promise<void> {
  for (const action of actions) {
    await action();
  }
}
