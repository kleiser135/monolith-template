// A simple fetch wrapper to standardize API calls

const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Use the error message from the API if available
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data as T;
  },

  post: async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
    const response = await fetch(`/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      // Use the error message from the API if available
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data as T;
  },
  
  // We can add put, patch, delete methods later as needed
};

export default apiClient; 