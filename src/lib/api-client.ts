// A simple fetch wrapper to standardize API calls

const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  },

  post: async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  },
  
  // We can add put, patch, delete methods later as needed
};

export default apiClient; 