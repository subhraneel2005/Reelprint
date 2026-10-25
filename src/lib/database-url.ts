const WEAK_SSL_MODE = /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i;
const LIBPQ_COMPAT = /([?&])uselibpqcompat=true(?=&|$)/i;

/**
 * node-postgres currently treats `prefer`, `require`, and `verify-ca` as
 * `verify-full` aliases, but logs a security warning for them. Make the
 * existing behavior explicit so the warning does not pollute production logs.
 * Leave `uselibpqcompat=true` untouched because it opts into existing libpq
 * semantics deliberately.
 */
export function normalizeDatabaseUrl(value: string): string {
  if (LIBPQ_COMPAT.test(value)) return value;
  return value.replace(WEAK_SSL_MODE, "$1sslmode=verify-full");
}
