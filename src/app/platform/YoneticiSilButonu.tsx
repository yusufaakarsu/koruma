"use client";

import { yoneticiSil } from "./actions";

/** Onay soran süper yönetici silme butonu. */
export function YoneticiSilButonu({ id }: { id: string }) {
  return (
    <form
      action={yoneticiSil.bind(null, id)}
      onSubmit={(e) => {
        if (
          !confirm(
            "Bu süper yönetici kaldırılsın mı? Veri saklanır. (Ajansları etkilenmez.)",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button className="rounded-lg border border-red-400/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10">
        Yöneticiyi Kaldır
      </button>
    </form>
  );
}
