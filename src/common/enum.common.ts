export function getEnumFromValue<T extends Record<string, string>>(enumObj: T, value: string): T[keyof T] {
  const key = (Object.keys(enumObj) as (keyof T)[]).find((k) => enumObj[k] === value);

  if (!key) {
    throw new Error(`Value "${value}" not found in enum`);
  }

  return enumObj[key];
}
