import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentTickerWidgetComponent } from './investment-ticker-widget.component';

describe('InvestmentTickerWidgetComponent', () => {
  let component: InvestmentTickerWidgetComponent;
  let fixture: ComponentFixture<InvestmentTickerWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentTickerWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentTickerWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
