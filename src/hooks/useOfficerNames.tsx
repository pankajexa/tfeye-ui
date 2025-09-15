"use client";
import { useEffect, useState, useCallback } from "react";
import { BACKEND_URL } from "@/constants/globalConstants";

interface Officer {
  officer_name: string;
  [key: string]: any;
}

interface ApiResponse<T> {
  data: T[];
}

export function useOfficerNames() {
  const [officerDetails, setOfficerDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOfficerNames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${BACKEND_URL}/api/ui/officer-names`);
      if (!res.ok)
        throw new Error(`Failed to fetch officer names: ${res.status}`);

      const data: ApiResponse<Officer> = await res.json();
      const formatted = (data?.data || []).map((item) => ({
        ...item,
        name: item?.officer_name,
        id: item?.officer_name,
      }));

      setOfficerDetails(formatted);
      return formatted;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficerNames();
  }, [fetchOfficerNames]);

  return { officerDetails, loading, error, refresh: fetchOfficerNames };
}
