import { Component } from '@angular/core';
import { CatGridConfig } from './lib/src/cat-grid/cat-grid.config';
import { CatGridItemConfig } from './lib/src/cat-grid-item/cat-grid-item.config';
import { TestComponent } from './test.component';

@Component({
  selector: 'my-app',
  template: `<h1>Hello {{name}}</h1>
  <div [catGridDraggable]="itemConfig">Test</div>
  <cat-grid [config]="gridConfig" [items]="items"></cat-grid>
  `,
})
export class AppComponent {
  name = 'Angular';

  gridConfig: CatGridConfig = {
    id: '1',
    cols: 5,
    rows: 5,
    colWidth: 100,
    rowHeight: 100
  };

  itemConfig: CatGridItemConfig = {
    id: '1',
    col: 2,
    row: 2,
    colSpan: 4,
    rowSpan: 1,
    component: {
      type: TestComponent,
      data: {}
    }
  };

  items: CatGridItemConfig[] = [
    this.itemConfig,
  ]
}