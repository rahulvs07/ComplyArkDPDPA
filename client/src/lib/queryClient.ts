import { QueryClient } from "@tanstack/react-query";

const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const response = await fetch(queryKey[0], {
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "An error occurred");
  }
  
  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      retry: false
    },
  },
});

export const getQueryFn = (options?: { on401: "returnNull" | "throwError" }) => {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const response = await fetch(queryKey[0], {
      credentials: 'include'
    });
    
    if (response.status === 401 && options?.on401 === "returnNull") {
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  };
};

export const apiRequest = async (
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: any
) => {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If the response is not JSON, use the default error message
    }
    
    throw new Error(errorMessage);
  }

  // For DELETE requests or other cases where there's no response body
  if (response.status === 204) {
    return response;
  }

  // Otherwise, attempt to parse the JSON
  return response;
};