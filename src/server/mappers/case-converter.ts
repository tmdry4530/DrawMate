function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeys(
  obj: unknown,
  converter: (key: string) => string
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeys(item, converter));
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        converter(key),
        convertKeys(value, converter),
      ])
    );
  }
  return obj;
}

export function toSnakeCaseKeys<T = unknown>(obj: unknown): T {
  return convertKeys(obj, toSnakeCase) as T;
}

export function toCamelCaseKeys<T = unknown>(obj: unknown): T {
  return convertKeys(obj, toCamelCase) as T;
}
