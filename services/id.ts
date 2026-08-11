// Collision-resistant ID generator.
// Date.now() alone collides when multiple records are created in the same
// millisecond (e.g. batch operations like delete-entry which fires 1 delete
// log + N stock-update logs simultaneously). Silent Supabase PK conflicts
// caused missing activity logs and understated purchase ledger.
export const genId = (prefix = ''): string => {
  const uid =
    typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
      ? (crypto as any).randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}${uid}` : uid;
};
