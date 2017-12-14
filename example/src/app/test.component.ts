import { Component } from '@angular/core';
import { ICatGridItemComponent } from './lib/src/cat-grid-item/cat-grid-item.interface';
import { CatGridItemConfig } from './lib/src/cat-grid-item/cat-grid-item.config';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'test',
  template: `<span>test</span>`
})
export class TestComponent implements ICatGridItemComponent{
  catGridItemLoaded(config: CatGridItemConfig): void {
  }

  catGridItemResized(config: CatGridItemConfig): void {
  }

  dataChangedObservable() {
    return Observable.empty();
  }
}
