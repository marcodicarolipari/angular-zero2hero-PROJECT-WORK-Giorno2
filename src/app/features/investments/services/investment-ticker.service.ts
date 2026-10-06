// app/features/investments/services/investment-ticker.service.ts
import { Injectable, computed, effect, signal } from '@angular/core';

export type TickerSymbol = 'ENI' | 'ISP' | 'UCG' | 'AAPL' | 'MSFT';

export interface TickerPrice {
  symbol: TickerSymbol;
  price: number; // prezzo corrente in EUR/USD
  delta: number; // variazione assoluta vs tick precedente
  ts: number; // timestamp Unix (ms) dell'ultimo aggiornamento
}

@Injectable({ providedIn: 'root' })
// providedIn: 'root' = singleton — una sola istanza per tutta l'app
// Il servizio "vive" finché vive l'app — NON viene distrutto con i componenti
export class InvestmentTickerService {
  // === DOMAIN STATE (source of truth) — PRIVATO ===
  // signal<Record<...>>: mappa symbol → prezzo. Privato = solo questo servizio può scrivere.
  // I componenti leggono SOLO tramite i computed pubblici qui sotto.
  private readonly _prices = signal<Record<TickerSymbol, TickerPrice>>({
    ENI: { symbol: 'ENI', price: 14.2, delta: 0, ts: Date.now() },
    ISP: { symbol: 'ISP', price: 3.1, delta: 0, ts: Date.now() },
    UCG: { symbol: 'UCG', price: 32.4, delta: 0, ts: Date.now() },
    AAPL: { symbol: 'AAPL', price: 189.0, delta: 0, ts: Date.now() },
    MSFT: { symbol: 'MSFT', price: 411.0, delta: 0, ts: Date.now() },
  });

  private readonly _connected = signal<boolean>(false);
  private readonly _lastError = signal<string | null>(null);

  // intervalId come campo: necessario per clearInterval corretto in disconnect()
  // Se non salviamo l'ID non possiamo fermare il timer → memory leak / zombie process
  private _intervalId: ReturnType<typeof setInterval> | null = null;

  // === READ MODEL (computed — PUBBLICI) ===
  // I componenti leggono SOLO questi computed, mai i signal privati.
  // computed() è puro e memoizzato: si ricalcola solo quando cambia _prices()
  readonly pricesList = computed(() => Object.values(this._prices()));
  readonly isConnected = computed(() => this._connected());
  readonly lastError = computed(() => this._lastError());

  // === SIDE EFFECT (effect per telemetria) ===
  // effect() per logging/analytics: NON scrive su nessun signal letto → nessun loop
  // In produzione: sostituire console.debug con un servizio APM (es. Datadog, Sentry)
  private readonly _telemetry = effect(() => {
    if (!this._connected()) return;
    // Legge pricesList() come dipendenza — si esegue quando isConnected o pricesList cambia
    console.debug(
      `[Ticker] live — ${this.pricesList().length} simboli monitorati`,
    );
  });

  // === WRITE METHODS ===

  connect(): void {
    // Idempotente: chiamare connect() due volte non duplica il timer
    if (this._connected()) return;
    this._connected.set(true);
    this._lastError.set(null);
    this._startSimulation();
  }

  disconnect(): void {
    this._connected.set(false);
    // Pulizia esplicita del timer: fondamentale per non lasciare processi zombie
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  // === SIMULAZIONE STREAM ===
  // In produzione: sostituire setInterval con WebSocket / SSE / SignalR
  private _startSimulation(): void {
    const symbols: TickerSymbol[] = ['ENI', 'ISP', 'UCG', 'AAPL', 'MSFT'];

    this._intervalId = setInterval(() => {
      if (!this._connected()) {
        this.disconnect(); // cleanup nel caso disconnect() sia stato chiamato
        return;
      }

      try {
        // Aggiorna UN simbolo casuale per tick: simula WebSocket granulare
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];

        // IMMUTABILITÀ CRITICA: .update() deve restituire un NUOVO oggetto
        // ❌ NON FARE: current[symbol].price = v; return current; ← stessa reference = no trigger
        // ✅ CORRETTO: spread per nuovo oggetto radice E nuovo oggetto del simbolo
        this._prices.update((current) => {
          const prev = current[symbol];
          const noise = (Math.random() - 0.49) * 0.8; // fluttuazione controllata
          const nextPrice = Math.max(
            0.01,
            parseFloat((prev.price + noise).toFixed(2)),
          );
          const delta = parseFloat((nextPrice - prev.price).toFixed(2));

          return {
            ...current, // ← nuovo oggetto radice (spread)
            [symbol]: {
              // ← nuovo oggetto per il simbolo aggiornato
              symbol,
              price: nextPrice,
              delta,
              ts: Date.now(),
            },
          };
        });
      } catch (error) {
        this._lastError.set('Errore nella simulazione del ticker');
        this.disconnect();
      }
    }, 1000);
  }
}
