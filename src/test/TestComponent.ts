/**
 * Created by tudorgergely on 5/24/16.
 */
import {
  Component, Input, ChangeDetectorRef, OnInit, OnDestroy,
} from '@angular/core';
import {CatGridDragService} from '../lib/cat-grid-drag.service';

@Component({
  selector: 'testComponent',
  template: `
        <div style="width: 100px; height: 100px; background: red;">Hello, {{name}}
            <button (mousedown)="clickButton($event)">Test</button>
        </div>
    `,
})
export class ItemTestComponent implements OnDestroy {
  name: string = 'aa';
  id: string;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private gridDragService: CatGridDragService) {
  }

  ngOnDestroy() {
    console.log('destroyed');
  }

  clickButton(e) {
    this.gridDragService.removeItemById(this.id);
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
}
