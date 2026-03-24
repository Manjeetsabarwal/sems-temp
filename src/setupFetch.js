const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  return originalFetch(url, {
    ...options,
    headers,
  });
};
