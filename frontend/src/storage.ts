export type StoredUser = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  github_login?: string | null;
};

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function loadSetting<T extends object>(key: string, defaults: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return defaults;

  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}
