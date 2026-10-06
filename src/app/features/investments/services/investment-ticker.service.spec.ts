import { TestBed } from '@angular/core/testing';

import { InvestmentTickerService } from './investment-ticker.service';

describe('InvestmentTickerService', () => {
  let service: InvestmentTickerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvestmentTickerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
