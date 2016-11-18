/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CatGridValidationService } from './cat-grid-validation.service';

describe('Service: NgGridValidation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CatGridValidationService]
    });
  });

  it('should ...', inject([CatGridValidationService], (service: CatGridValidationService) => {
    expect(service).toBeTruthy();
  }));
});
