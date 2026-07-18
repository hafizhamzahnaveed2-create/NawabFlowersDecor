"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";

const STORAGE_KEY = "nawab-wa-btn-pos";
const SIZE = 52;
const MARGIN = 16;
/** Keep clear of cart trigger (bottom-right ~56px) and mobile safe areas. */
const CART_CLEARANCE = 72;

type Pos = { x: number; y: number };

function defaultPos(): Pos {
  return {
    x: window.innerWidth - SIZE - MARGIN,
    y: window.innerHeight - SIZE - MARGIN - CART_CLEARANCE,
  };
}

function clamp(pos: Pos): Pos {
  const maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
  const maxY = Math.max(
    MARGIN,
    window.innerHeight - SIZE - MARGIN - CART_CLEARANCE,
  );
  return {
    x: Math.min(maxX, Math.max(MARGIN, pos.x)),
    y: Math.min(maxY, Math.max(MARGIN, pos.y)),
  };
}

function readStoredPos(): Pos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return clamp(JSON.parse(raw) as Pos);
  } catch {
    /* ignore */
  }
  return clamp(defaultPos());
}

export function WhatsAppFloat({ number }: { number: string | null }) {
  const hydrated = useHydrated();
  const [pos, setPos] = useState<Pos | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const origin = useRef({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    if (!hydrated) return;
    setPos(readStoredPos());
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    function onResize() {
      setPos((p) => {
        const base = p ?? readStoredPos();
        const next = clamp(base);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hydrated]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!pos) return;
      dragging.current = true;
      moved.current = false;
      origin.current = {
        x: e.clientX,
        y: e.clientY,
        px: pos.x,
        py: pos.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;
    setPos(
      clamp({
        x: origin.current.px + dx,
        y: origin.current.py + dy,
      }),
    );
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setPos((p) => {
      if (!p) return p;
      const next = clamp(p);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  if (!number || !pos) return null;

  const href = `https://wa.me/${number}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => {
        if (moved.current) e.preventDefault();
      }}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-40 flex size-[52px] cursor-grab items-center justify-center rounded-full bg-[#25D366] text-white shadow-bloom-lg touch-none hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy active:cursor-grabbing"
    >
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="currentColor"
        aria-hidden
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}
