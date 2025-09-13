import { useEffect, useState, useCallback } from "react";
import { BACKEND_URL } from "@/constants/globalConstants";

export function useAnalyses(initialUrl?: string) {
  const [url, setUrl] = useState(initialUrl); // keep track of current URL
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async (newUrl?: string) => {
    const finalUrl = newUrl || url; // use newUrl if passed, else last stored url
    if (!finalUrl) return;

    try {
      setLoading(true);

      // Allow both relative paths ("api/v1/...") and full URLs
      const fullUrl = `${BACKEND_URL}/${finalUrl}`;

      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);

      if (newUrl) setUrl(newUrl); // update stored URL if new one is passed
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUrl) {
      fetchAnalyses(initialUrl);
    }
  }, [initialUrl, fetchAnalyses]);

  return { data, loading, error, refetch: fetchAnalyses };
}
