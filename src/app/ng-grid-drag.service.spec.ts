/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CatGridDragService } from './cat-grid-drag.service';

describe('Service: NgGridDrag', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CatGridDragService]
    });
  });

  it('should ...', inject([CatGridDragService], (service: CatGridDragService) => {
    expect(service).toBeTruthy();
  }));
});
