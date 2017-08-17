import {
  Component,
  OnInit,
  HostListener,
  Output,
  Input,
  OnDestroy,
  EventEmitter,
  ViewChild,
  ElementRef, HostBinding
} from '@angular/core';
import {Subject, Observable, Subscription} from 'rxjs/Rx';
import {CatGridItemConfig} from '../cat-grid-item/cat-grid-item.config';
import {CatGridConfig} from './cat-grid.config';
import {CatGridDirective} from './cat-grid.directive';
import {CatGridDragService, ItemDragEvent} from '../cat-grid-drag.service';
import {CatGridValidationService} from '../cat-grid-validation.service';
import {CatGridItemComponent} from '../cat-grid-item/cat-grid-item.component';
import {intersect, toRectangle} from './utils';

@Component({
  selector: 'cat-grid',
  template: `
    <div [catGrid]="config" (onResizeStop)="resizeFinished($event)">
      <cat-grid-item [item]="item"
                     *ngFor="let item of items">
      </cat-grid-item>
    </div>
  `,
})
export class CatGridComponent implements OnInit, OnDestroy {
  static GRID_POSITIONS_OFFSET = 1;

  @Output() itemResizeStop = new EventEmitter<CatGridItemConfig>();

  @ViewChild(CatGridDirective)
  ngGrid: CatGridDirective;

  @Input()
  config: CatGridConfig;

  @Input()
  items: CatGridItemConfig[] = [];

  @HostBinding('style.cursor')
  cursor: string = 'auto';

  private destroyed$ = new Subject();
  newItemAdd$: Subject<any> = new Subject();

  constructor(private gridDragService: CatGridDragService,
              private gridPositionService: CatGridValidationService) {
  }

  ngOnInit() {
    const {inside, outside, release} = this.gridDragService.registerGrid(this);
  }

  ngOnDestroy(): any {
    this.destroyed$.next();
    this.destroyed$.unsubscribe();

    this.gridDragService.unregisterGrid(this);
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
    this.ngGrid._placeholderRef.instance.setSize(0, 0);
    if (!this.ngGrid._placeholderRef.instance.valid) {
      this.cursor = 'no-drop';
    } else {
      this.cursor = 'auto';
    }
  }

  private itemConfigFromEvent(config: CatGridItemConfig, event: MouseEvent): CatGridItemConfig {
    const refPos = this.ngGrid._ngEl.nativeElement.getBoundingClientRect();
    const left = event.clientX - refPos.left;
    const top = event.clientY - refPos.top;
    let positionX = left;
    let positionY = top;
    if (this.gridDragService.posOffset.left && this.gridDragService.posOffset.top) {
      positionX -= this.gridDragService.posOffset.left;
      positionY -= this.gridDragService.posOffset.top;
    }
    const {col, row} = this.ngGrid._calculateGridPosition(positionX, positionY);
    return Object.assign({}, config, {col, row});
  }

  private hasCollisions(itemConf: CatGridItemConfig): boolean {
    return this.items.filter(c => c.id !== itemConf.id)
      .some((conf: CatGridItemConfig) => intersect(toRectangle(conf), toRectangle(itemConf)));
  }

  private isOutsideGrid(item: CatGridItemConfig, gridSize: any): boolean {
    const {col, row} = item;
    const {sizex, sizey} = item;
    return (col + sizex - CatGridComponent.GRID_POSITIONS_OFFSET > gridSize.columns)
      || (row + sizey - CatGridComponent.GRID_POSITIONS_OFFSET > gridSize.rows);
  }
}
