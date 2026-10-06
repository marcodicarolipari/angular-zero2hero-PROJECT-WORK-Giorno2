import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InvestmentTickerWidgetComponent } from './features/investments/components/investment-ticker-widget/investment-ticker-widget.component';
import { CurrencyConverterComponent } from './features/dashboard/currency-converter/currency-converter.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InvestmentTickerWidgetComponent, CurrencyConverterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-pw-2';
}
