/**
 * Utility function to get authentication headers for fetch requests
 */
export function getAuthHeaders() {
  const auth = localStorage.getItem('auth');
  if (auth) {
    const { username, password } = JSON.parse(auth);
    const credentials = btoa(`${username}:${password}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Authenticated fetch wrapper
 * Use this instead of plain fetch for API calls that require authentication
 */
export async function authFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send cookies
  });

  // Handle 401 - redirect to login
  if (response.status === 401) {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return response;
}

export default authFetch;
