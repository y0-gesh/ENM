const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

let accessTokenInMemory = '';

export function setAccessToken(token: string) {
  accessTokenInMemory = token;
}

export function getAccessToken() {
  return accessTokenInMemory;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessTokenInMemory) {
    headers.set('Authorization', `Bearer ${accessTokenInMemory}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || 'include' // auto pass cookies for refresh
  };

  let response = await fetch(url, fetchOptions);

  // If unauthorized, attempt to perform token refresh
  if (
    response.status === 401 &&
    path !== '/auth/login' &&
    path !== '/auth/register' &&
    path !== '/auth/refresh'
  ) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.data.accessToken;
        setAccessToken(newAccessToken);

        // Retry original request
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        // Refresh token expired/invalid, trigger logout event
        setAccessToken('');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-logout'));
        }
      }
    } catch (error) {
      console.error('[API Client] Token refresh failed:', error);
      setAccessToken('');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-logout'));
      }
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    (error as any).status = response.status;
    (error as any).code = data.code;
    (error as any).errors = data.errors;
    throw error;
  }

  return data;
}
