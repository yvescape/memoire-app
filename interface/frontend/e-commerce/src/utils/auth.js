// src/utils/auth.js

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const setTokens = (access, refresh) => {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
  window.dispatchEvent(new Event("auth-change"));
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.dispatchEvent(new Event("auth-change"));
};

// Vérifie si le token JWT est expiré
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Refresh le token, retourne le nouveau access ou null
export const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh || isTokenExpired(refresh)) {
    clearTokens();
    return null;
  }

  try {
    const response = await fetch("/api/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setTokens(data.access, data.refresh || refresh);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
};

// Fetch authentifié avec refresh automatique
export const authFetch = async (url, options = {}) => {
  let token = getAccessToken();

  // Si le token est expiré, tenter un refresh
  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
    if (!token) return null; // déconnecté
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // Si 401, tenter un refresh une fois
  if (response.status === 401) {
    token = await refreshAccessToken();
    if (!token) return null;

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return response;
};

// Vérifie si l'utilisateur est réellement connecté
export const isAuthenticated = () => {
  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (!access && !refresh) return false;
  if (access && !isTokenExpired(access)) return true;
  if (refresh && !isTokenExpired(refresh)) return true;
  return false;
};