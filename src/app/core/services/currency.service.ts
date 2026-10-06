import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  readonly rates = signal<Record<string, number>>({
    USD: 1.08,
    GBP: 0.86,
    CHF: 0.95,
    JPY: 162.5
  });

  readonly sortedRates = computed(() =>
    Object.entries(this.rates())
      .map(([symbol, rate]) => ({ symbol, rate }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
  );
}
