import { useEffect, useState, useCallback } from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_API_URL || "https://trafficeye.onrender.com";

export function useAnalyses(status = "", limit = 50, offset = 0) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/v1/analyses?status=${status}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [status, limit, offset]);

  useEffect(() => {
    if (status) {
      fetchAnalyses();
    }
  }, [status, limit, offset, fetchAnalyses]);

  return { data, loading, error, refetch: fetchAnalyses };
}
