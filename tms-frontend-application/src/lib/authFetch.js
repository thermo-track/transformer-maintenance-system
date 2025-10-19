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
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {boolean} options.suppressNotFoundError - If true, won't show console error for 404
 */
export async function authFetch(url, options = {}) {
  const { suppressNotFoundError, ...fetchOptions } = options;
  
  const headers = {
    ...getAuthHeaders(),
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
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
  } catch (error) {
    // Re-throw network errors (not HTTP errors)
    throw error;
  }
}

export default authFetch;
