import { Component } from '@angular/core';
import { ICatGridItemComponent } from './lib/src/cat-grid-item/cat-grid-item.interface';
import { CatGridItemConfig } from './lib/src/cat-grid-item/cat-grid-item.config';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'test',
  template: `<div style="background-color: red; width: 100%; height: 100%">test</div>`
})
export class TestComponent implements ICatGridItemComponent{
  configChangedObservable(): Observable<CatGridItemConfig> {
    return Observable.empty();
  }
  catGridItemLoaded(config: CatGridItemConfig): void {
  }

  catGridItemResized(config: CatGridItemConfig): void {
  }

  dataChangedObservable() {
    return Observable.empty();
  }
}
