import { Component } from '@angular/core';
import { CatGridConfig } from './lib/src/cat-grid/cat-grid.config';
import { CatGridItemConfig } from './lib/src/cat-grid-item/cat-grid-item.config';
import { TestComponent } from './test.component';
import { ContainerComponent } from './container.component';

@Component({
  selector: 'my-app',
  template: `<h1>Hello {{name}}</h1>
  <span [dragula]="'id'"><div [catGridDraggableDragula]="itemConfig">Test</div></span>
  <div [catGridDraggable]="containerConfig">Container</div>
  <cat-grid [config]="gridConfig" [items]="items"></cat-grid>
  `,
})
export class AppComponent {
  name = 'Angular';

  gridConfig: CatGridConfig = {
    id: '1',
    maxCols: 5,
    maxRows: 5,
    colWidth: 100,
    rowHeight: 100
  };

  itemConfig: CatGridItemConfig = {
    id: '2',
    col: 2,
    row: 2,
    sizex: 4,
    sizey: 1,
    draggable: false,
    component: {
      type: TestComponent,
      data: {}
    }
  };

  containerConfig: CatGridItemConfig = {
    id: '3',
    col: 2,
    row: 2,
    sizex: 4,
    sizey: 2,
    component: {
      type: ContainerComponent,
      data: {}
    }
  };

  items: CatGridItemConfig[] = [
    this.itemConfig,
  ];
}
