"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * İlan detayı/modalı açıldığında görüntülenme sayacını bir artırır.
 * useRef guard ile React Strict Mode'un çift useEffect çağrısını eler.
 * Görsel çıktısı yoktur.
 */
export function GoruntulemeSayaci({ ilanId }: { ilanId: string }) {
  const sayilanlar = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (sayilanlar.current.has(ilanId)) return;
    sayilanlar.current.add(ilanId);
    void createClient()
      .rpc("ilan_goruntulendi", { p_id: ilanId })
      .then(() => undefined, () => undefined);
  }, [ilanId]);
  return null;
}
