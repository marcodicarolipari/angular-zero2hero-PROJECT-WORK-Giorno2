// app/features/investments/components/investment-ticker-widget/investment-ticker-widget.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
// Con @if/@for (Angular 17+) NON serve importare CommonModule per le direttive strutturali.
// Importiamo solo le pipe che effettivamente usiamo → tree-shaking più efficace.
// DecimalPipe: per | number:'1.2-2'  |  DatePipe: per | date:'HH:mm:ss'
import { InvestmentTickerService, TickerPrice } from '../../services/investment-ticker.service';

type SortBy = 'symbol' | 'price' | 'delta';

@Component({
  selector: 'app-investment-ticker-widget',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './investment-ticker-widget.component.html',
  styleUrl: './investment-ticker-widget.component.scss', // singolare (Angular 17+)
  // OnPush OBBLIGATORIO per widget ad alta frequenza:
  // Angular aggiorna il DOM solo quando cambiano i Signals letti nel template.
  // Senza OnPush ogni tick (anche per altri component) rigenererebbe questa view.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentTickerWidgetComponent implements OnDestroy {

  // === DEPENDENCY INJECTION con inject() — stile Angular 19 ===
  // inject() funziona in contesti di injection (field initializer, constructor, factory)
  // Vantaggio vs constructor: composabile in funzioni helper — approfondiremo nel Giorno 5
  private readonly ticker = inject(InvestmentTickerService);

  // === UI STATE (locale al componente — NON nel servizio) ===
  // Questi signals descrivono "come l'utente vuole vedere i dati",
  // non "quali sono i dati" — quello è responsabilità del servizio.
  readonly filter     = signal<string>('');
  readonly sortBy     = signal<SortBy>('symbol');
  readonly onlyMovers = signal<boolean>(false);

  // === DOMAIN STATE (dal servizio — read-only, Single Source of Truth) ===
  // NON copiamo i dati in signals locali: leggiamo i computed del servizio direttamente.
  // Copiare i dati creerebbe una "doppia sorgente di verità" — antipattern critico.
  readonly isConnected = this.ticker.isConnected;
  readonly lastError   = this.ticker.lastError;

  // === DERIVED VIEW MODEL (computed puro) ===
  // Dipende da: ticker.pricesList(), filter(), sortBy(), onlyMovers()
  // Si ricalcola SOLO quando cambia almeno uno di questi — non ad ogni tick dell'app.
  // Questo è il "Read Model" del pattern CQRS: trasforma il domain state per la view.
  readonly viewModel = computed(() => {
    const filterText = this.filter().trim().toUpperCase();
    const sort       = this.sortBy();
    const movers     = this.onlyMovers();
    const allPrices  = this.ticker.pricesList(); // lettura → registra dipendenza

    const filtered = allPrices.filter(p => {
      if (movers && p.delta === 0) return false;      // nasconde titoli fermi
      if (!filterText)             return true;       // nessun filtro attivo
      return p.symbol.startsWith(filterText);         // filtra per inizio simbolo
    });

    // [...filtered]: spread per non mutare l'array originale (immutabilità)
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'symbol': return a.symbol.localeCompare(b.symbol);
        case 'price':  return b.price - a.price;                         // decrescente
        case 'delta':  return Math.abs(b.delta) - Math.abs(a.delta);    // più mover in cima
      }
    });

    // Il computed restituisce tutto ciò che il template necessita — niente logica nel template
    return { items: sorted, total: sorted.length };
  });

  // === SIDE EFFECT: auto-connect alla creazione del widget ===
  // effect() è il posto giusto per "avvia connessione se non già connessa".
  // Gli effect creati come field (contesto di injection) vengono puliti automaticamente
  // alla distruzione del componente — no cleanup manuale necessario per l'effect stesso.
  private readonly _autoConnect = effect(() => {
    // Legge isConnected() e lastError() come dipendenze
    if (!this.isConnected() && !this.lastError()) {
      this.ticker.connect(); // side effect controllato
    }
  });

  // === CLEANUP ===
  ngOnDestroy(): void {
    // Disconnetti il servizio quando il widget viene smontato.
    // In un'app reale potresti voler mantenere la connessione in background
    // (es. il servizio è root e altri widget la usano) — valuta il design.
    this.ticker.disconnect();
  }

  // === HANDLERS (separati dal template per leggibilità e testabilità) ===

  onFilterChange(event: Event): void {
    // Cast esplicito: $event.target è EventTarget, non HTMLInputElement
    const value = (event.target as HTMLInputElement).value;
    this.filter.set(value);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SortBy;
    this.sortBy.set(value);
  }

  onToggleMovers(): void {
    // update() per derivare il nuovo valore dall'attuale: pattern corretto
    this.onlyMovers.update(v => !v);
  }
}