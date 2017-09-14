import { Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';
import { CatGridConfig } from './cat-grid.config';
import { CatGridDragService } from '../cat-grid-drag.service';
import { CatGridValidationService } from '../cat-grid-validation.service';
import { CatGridItemComponent } from '../cat-grid-item/cat-grid-item.component';
import { intersect, toRectangle } from './utils';

@Component({
  selector: 'cat-grid',
  template: `
    <div (onResizeStop)="resizeFinished($event)">
      <cat-grid-item [config]="item"
                     [colWidth]="config.colWidth"
                     [rowHeight]="config.rowHeight"
                     *ngFor="let item of items">
      </cat-grid-item>
    </div>
  `,
})
export class CatGridComponent implements OnChanges, OnDestroy {
  static GRID_POSITIONS_OFFSET = 1;

  @Output() itemResizeStop = new EventEmitter<CatGridItemConfig>();
  @Input() config: CatGridConfig;
  @Input() items: CatGridItemConfig[] = [];

  @HostBinding('style.cursor')
  cursor = 'auto';

  @HostBinding('style.width.px')
  width = 100;

  @HostBinding('style.height.px')
  height: 100;

  private destroyed$ = new Subject();
  newItemAdd$: Subject<any> = new Subject();

  constructor(private gridDragService: CatGridDragService,
              private gridPositionService: CatGridValidationService) {
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.unsubscribe();
  }

  ngOnChanges(changes: any) {
    const config = changes.config;

    if (config) {

    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!!this.gridDragService.dragConfig) {
      this.showPlaceholder();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.hidePlaceholder();
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(e: MouseEvent) {
    if (!!this.gridDragService.dragConfig) {
      const config = this.gridDragService.dragConfig;
      console.log(config);
      if (this.validPosition(config, e)) {
        // add to grid
        // remove from others
      }

      this.gridDragService.stopDrag();
      this.hidePlaceholder();
    }
  }

  showPlaceholder() {

  }

  private validPosition(item: CatGridItemConfig, event: MouseEvent) {
    const conf = this.itemConfigFromEvent(item, event);
    return this.gridPositionService.validateGridPosition(conf.col!!, conf.row!!, conf, this.config)
      && !this.hasCollisions(item);
  }

  resizeFinished(itemComponent: CatGridItemComponent) {
    this.itemResizeStop.emit(itemComponent.config);
    this.items.push(itemComponent.config);
    const ids = this.items.map(i => i.id);
    this.items = this.items.filter((item, i, arr) => ids.indexOf(item.id) === i);
  }

  private hidePlaceholder() {
  }

  private itemConfigFromEvent(config: CatGridItemConfig, event: MouseEvent): CatGridItemConfig {
    // const refPos = this.ngGrid._ngEl.nativeElement.getBoundingClientRect();
    // const left = event.clientX - refPos.left;
    // const top = event.clientY - refPos.top;
    // let positionX = left;
    // let positionY = top;
    // if (this.gridDragService.posOffset.left && this.gridDragService.posOffset.top) {
    //   positionX -= this.gridDragService.posOffset.left;
    //   positionY -= this.gridDragService.posOffset.top;
    // }
    // const {col, row} = this.ngGrid._calculateGridPosition(positionX, positionY);
    return Object.assign({}, config, {});
  }

  private hasCollisions(itemConf: CatGridItemConfig): boolean {
    return this.items.filter(c => c.id !== itemConf.id)
      .some((conf: CatGridItemConfig) => intersect(toRectangle(conf), toRectangle(itemConf)));
  }
}
