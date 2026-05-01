export function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function extractMessage(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed || null;
  }

  if (Array.isArray(payload)) {
    const parts = payload
      .map((item) => extractMessage(item))
      .filter((item): item is string => Boolean(item));

    return parts.length > 0 ? parts.join(" ") : null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    const directKeys = ["message", "error", "detail"];
    for (const key of directKeys) {
      const value = extractMessage(record[key]);
      if (value) return value;
    }

    const nestedKeys = ["errors", "details"];
    for (const key of nestedKeys) {
      const value = extractMessage(record[key]);
      if (value) return value;
    }
  }

  return null;
}

export function extractToken(payload: unknown): string | null {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const token = extractToken(item);
      if (token) return token;
    }
    return null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    const tokenKeys = [
      "token",
      "accessToken",
      "access_token",
      "jwt",
      "jwtToken",
    ];

    for (const key of tokenKeys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    for (const value of Object.values(record)) {
      const nestedToken = extractToken(value);
      if (nestedToken) return nestedToken;
    }
  }

  return null;
}

export function extractUsername(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    const usernameKeys = ["username", "name", "displayName"];
    for (const key of usernameKeys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    const nestedKeys = ["user", "data", "account", "profile"];
    for (const key of nestedKeys) {
      const nested = extractUsername(record[key]);
      if (nested) return nested;
    }

    for (const value of Object.values(record)) {
      const nested = extractUsername(value);
      if (nested) return nested;
    }
  }

  return null;
}