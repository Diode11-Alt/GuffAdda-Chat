const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}:3000`;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        headers['Authorization'] = `Bearer ${data.accessToken}`;

        return fetch(`${API_URL}${path}`, { ...options, headers });
      }
    }

    // Refresh failed — clear and redirect
    localStorage.clear();
    window.location.href = '/';
  }

  return res;
}
