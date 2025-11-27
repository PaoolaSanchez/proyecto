import { TestBed } from '@angular/core/testing';

import { Destino, DestinoService } from './destino';

describe('Destino', () => {
  let service: DestinoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DestinoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
