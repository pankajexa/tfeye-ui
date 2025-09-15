"use client";
import { useEffect, useState, useCallback } from "react";
import { BACKEND_URL } from "@/constants/globalConstants";

interface Point {
  point_name: string;
  [key: string]: any;
}

interface ApiResponse<T> {
  data: T[];
}

export function usePointNames() {
  const [pointDetails, setPointDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPointNames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${BACKEND_URL}/api/ui/point-names`);
      if (!res.ok)
        throw new Error(`Failed to fetch point names: ${res.status}`);

      const data: ApiResponse<Point> = await res.json();
      const formatted = (data?.data || []).map((item) => ({
        ...item,
        name: item?.point_name,
        id: item?.point_name,
      }));

      setPointDetails(formatted);
      return formatted;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPointNames();
  }, [fetchPointNames]);

  return { pointDetails, loading, error, refresh: fetchPointNames };
}
