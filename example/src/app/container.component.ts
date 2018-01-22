import { Component } from '@angular/core';
import { CatGridConfig } from './lib/src/cat-grid/cat-grid.config';
import { CatGridItemConfig } from './lib/src/cat-grid-item/cat-grid-item.config';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'cat-container',
  template: '<cat-grid [config]="gridConfig" [items]="items" (onItemsChange)="onItemsChange($event)"></cat-grid>',
  styles: [`
    cat-grid {
      border: 1px solid black;
    }
  `]
})
export class ContainerComponent {
  gridConfig: CatGridConfig = {
    id: '1',
    maxCols: 4,
    maxRows: 2,
    colWidth: 100,
    rowHeight: 100
  };

  items: CatGridItemConfig[] = [];

  dataChanged$ = new Subject();

  onItemsChange = (items: CatGridItemConfig[]) => this.dataChanged$.next({items});

  catGridItemLoaded(config: CatGridItemConfig): void {
  }

  dataChangedObservable() {
    return this.dataChanged$.asObservable();
  }
}
