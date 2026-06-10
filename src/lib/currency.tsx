import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Currency = "USD" | "INR";

const FALLBACK_USD_TO_INR = 83.5;
const STORAGE_KEY = "planora_currency";
const RATE_KEY = "planora_usd_inr_rate";
const RATE_TS_KEY = "planora_usd_inr_rate_ts";
const RATE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggle: () => void;
  usdToInr: number;
  format: (usd: number) => string;
};

const CurrencyContext = createContext<Ctx | null>(null);

function readInitialCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "INR" || v === "USD" ? v : "USD";
}

function readCachedRate(): number {
  if (typeof window === "undefined") return FALLBACK_USD_TO_INR;
  const r = Number(window.localStorage.getItem(RATE_KEY));
  return r > 0 ? r : FALLBACK_USD_TO_INR;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(readInitialCurrency);
  const [usdToInr, setUsdToInr] = useState<number>(readCachedRate);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const toggle = useCallback(() => {
    setCurrency(currency === "USD" ? "INR" : "USD");
  }, [currency, setCurrency]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ts = Number(window.localStorage.getItem(RATE_TS_KEY) ?? 0);
    if (Date.now() - ts < RATE_TTL_MS && readCachedRate() > 0) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        const resp = await fetch("https://open.er-api.com/v6/latest/USD", {
          signal: ctrl.signal,
        });
        if (!resp.ok) return;
        const json = (await resp.json()) as { rates?: Record<string, number> };
        const r = json.rates?.INR;
        if (r && r > 0) {
          setUsdToInr(r);
          window.localStorage.setItem(RATE_KEY, String(r));
          window.localStorage.setItem(RATE_TS_KEY, String(Date.now()));
        }
      } catch {
        /* ignore — use cached/fallback rate */
      }
    })();
    return () => ctrl.abort();
  }, []);

  const format = useCallback(
    (usd: number) => formatMoney(usd, currency, usdToInr),
    [currency, usdToInr]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggle, usdToInr, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): Ctx {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export function formatMoney(usd: number, currency: Currency, usdToInr: number): string {
  if (!usd || usd < 1) return "Free";
  if (currency === "INR") {
    const v = Math.round(usd * usdToInr);
    return `₹${v.toLocaleString("en-IN")}`;
  }
  return `$${Math.round(usd).toLocaleString()}`;
}

/** Sync snapshot for non-React code (e.g. PDF export). */
export function getCurrencySnapshot(): { currency: Currency; usdToInr: number } {
  return { currency: readInitialCurrency(), usdToInr: readCachedRate() };
}
