const TOKEN_KEY = "kiosco_token";
const EMPLOYEE_KEY = "kiosco_employee";
const PERMISSIONS_KEY = "kiosco_permissions";
const API = import.meta.env.VITE_API_URL ?? "";

export function getKioscoToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getKioscoEmployee() {
  const raw = sessionStorage.getItem(EMPLOYEE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setKioscoSession({ token, empleado, permisos }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(EMPLOYEE_KEY, JSON.stringify(empleado || null));
  sessionStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permisos || []));
}

export function clearKioscoSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EMPLOYEE_KEY);
  sessionStorage.removeItem(PERMISSIONS_KEY);
}

export async function kioscoFetch(path, options = {}) {
  const token = getKioscoToken();
  const headers = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API}${path}`, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    clearKioscoSession();
  }

  return response;
}

export async function requireKioscoProfile(navigate) {
  const token = getKioscoToken();
  if (!token) {
    navigate("/kiosco/login");
    return null;
  }

  const response = await kioscoFetch("/api/kiosco/perfil");
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    navigate("/kiosco/login");
    return null;
  }

  setKioscoSession({
    token,
    empleado: payload.empleado,
    permisos: payload.permisos || [],
  });

  return payload;
}
