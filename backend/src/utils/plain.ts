/**
 * Convert a Sequelize model instance into a plain object, optionally
 * selecting a subset of fields. This is the recommended way to hand data to
 * response mappers so we never leak internal Sequelize internals.
 */
export const plain = <T = Record<string, unknown>>(
  instance: unknown,
  fields?: string[],
): T => {
  if (!instance) return instance as T;

  // Handle arrays of instances.
  if (Array.isArray(instance)) {
    return instance.map((item) => plain<T>(item, fields)) as unknown as T;
  }

  // Sequelize instances expose .get(); plain objects pass through.
  const obj: Record<string, unknown> =
    typeof (instance as { get?: (o: unknown) => unknown }).get === 'function'
      ? ((instance as { get: (o: unknown) => Record<string, unknown> }).get({ plain: true }) as Record<string, unknown>)
      : (instance as Record<string, unknown>);

  if (fields && fields.length > 0) {
    const picked: Record<string, unknown> = {};
    for (const field of fields) {
      picked[field] = obj[field];
    }
    return picked as T;
  }

  return obj as T;
};

/** Strip sensitive keys (e.g. password_hash) from a plain object. */
export const stripFields = <T extends Record<string, unknown>>(
  obj: T,
  keys: string[],
): Partial<T> => {
  const clone: Record<string, unknown> = { ...obj };
  for (const key of keys) {
    delete clone[key];
  }
  return clone as Partial<T>;
};
