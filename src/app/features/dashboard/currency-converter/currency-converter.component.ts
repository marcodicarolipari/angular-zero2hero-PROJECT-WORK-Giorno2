import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-currency-converter',
  imports: [CurrencyPipe],
  templateUrl: './currency-converter.component.html',
  styleUrl: './currency-converter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrencyConverterComponent {
  private readonly currencyService = inject(CurrencyService);

  readonly amount = signal<number>(1000);
  readonly selectedCurrency = signal<string>('USD');

  readonly currencies = computed(() => this.currencyService.sortedRates());

  readonly convertedAmount = computed(
    () => this.amount() * (this.currencyService.rates()[this.selectedCurrency()] ?? 0)
  );

  constructor() {
    effect(() => {
      const currency = this.selectedCurrency();
      const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
        this.convertedAmount()
      );
      console.log(`Convertito €${this.amount()} → ${formatted}`);
    });
  }

  onAmountChange(event: Event): void {
    this.amount.set(Number((event.target as HTMLInputElement).value) || 0);
  }

  onCurrencyChange(event: Event): void {
    this.selectedCurrency.set((event.target as HTMLSelectElement).value);
  }
}
