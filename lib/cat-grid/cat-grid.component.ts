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
  public ngGrid: CatGridDirective;

  @Input()
  private config: CatGridConfig;

  @Input()
  public items: CatGridItemConfig[] = [];

  @HostBinding('style.cursor')
  public cursor: string = 'auto';

  public mouseMove$ = new Subject<MouseEvent>();
  public mouseUp$ = new Subject<MouseEvent>();
  public mouseLeave$ = new Subject<MouseEvent>();
  public onMouseMove$ = new Subject<any>();
  public newItemAdd$: Subject<any> = new Subject();

  private subscriptions: Subscription[] = [];

  constructor(private gridDragService: CatGridDragService,
              private gridPositionService: CatGridValidationService,
              private elementRef: ElementRef) {
    const dragOver$ = this.combineEqualScreen(this.gridDragService.draggingObservable(), this.mouseMoveObservable());
    const drop$ = this.combineEqualScreen(this.gridDragService.dropObservable(), this.mouseUpObservable());

    this.subscriptions.push(dragOver$.subscribe(({item, event}) => this.dragInside(item, event)));
    this.subscriptions.push(drop$.subscribe(({item, event}) => this.dropInside(item, event)));
  }

  ngOnInit() {
    const {inside, outside, release} = this.gridDragService.registerGrid(this);
    this.subscriptions.push(inside.subscribe(v => this.itemDraggedInside(v)));
    this.subscriptions.push(outside.subscribe(v => this.itemDragOutside()));
    this.subscriptions.push(release.subscribe(v => this.itemReleased(v)));
  }

  ngOnDestroy(): any {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.ngGrid._items.forEach(item => item.ngOnDestroy());
    this.gridDragService.unregisterGrid(this);
  }

  @HostListener('mousemove', ['$event'])
  private onMouseMove(e: MouseEvent) {
    this.mouseMove$.next(e);
    this.onMouseMove$.next(this.toObserverEvent(e));
    e.preventDefault();
  }

  @HostListener('mouseleave', ['$event'])
  private onMouseLeave(e: MouseEvent) {
    this.mouseLeave$.next(e);
    this.hidePlaceholder();
  }

  @HostListener('mousedown', ['$event'])
  private onMouseDown(e) {
    e.preventDefault();
    const i = this.ngGrid.getItem(e);
    if (i && i.canDrag(e)) {
      this.gridDragService.dragStart(i, this, e);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  @HostListener('mouseup', ['$event'])
  private onMouseUp(e: MouseEvent) {
    this.hidePlaceholder();
    this.mouseUp$.next(e);
  }

  public mouseMoveObservable(): Observable<MouseEvent> {
    return this.mouseMove$.asObservable();
  }

  public mouseUpObservable() {
    return this.mouseUp$.asObservable();
  }

  private combineEqualScreen(o1$: Observable<ItemDragEvent>, o2$: Observable<MouseEvent>): Observable<ItemDragEvent> {
    return o1$.withLatestFrom(o2$)
      .filter(([{event}, mouseMoveEvent]) => CatGridDragService.equalScreenPosition(event, mouseMoveEvent))
      .map(([itemDragEvent]) => itemDragEvent);
  }

  private dragInside(item: CatGridItemConfig, event: MouseEvent) {
    if (event.buttons == 0) {
      // fix additional drag-event after mouse was released
      return;
    }
    const conf = this.itemConfigFromEvent(item, event);

    this.ngGrid._placeholderRef.instance.valid = this.gridPositionService
        .validateGridPosition(conf.col!!, conf.row!!, conf, this.config)
      && !this.hasCollisions(conf);
    if (!this.ngGrid._placeholderRef.instance.valid) {
      this.cursor = 'no-drop';
    } else {
      this.cursor = 'auto';
    }
    this.ngGrid._placeholderRef.instance.setSize(item.sizex, item.sizey);
    this.ngGrid._placeholderRef.instance.setGridPosition(conf.col!!, conf.row!!);
  }

  private dropInside(item, event) {
    const conf = this.itemConfigFromEvent(item, event);
    this.hidePlaceholder();
    if (this.gridPositionService.validateGridPosition(conf.col, conf.row, item, this.config)
      && !this.hasCollisions(conf)) {
      this.items.push(conf);
      this.gridDragService.itemAdded$.next(this.gridDragService.getPlacedItems());
    }
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

  public itemDraggedInside(v) {
    if (this.gridDragService.draggedItem) {
      const {item, event} = v.itemDragged;

      const conf = this.itemConfigFromEvent(item.config, event.event);
      const dims = item.getSize();
      this.ngGrid._placeholderRef.instance.valid = this.gridPositionService
          .validateGridPosition(conf.col!!, conf.row!!, v.itemDragged.item, this.config)
        && !this.hasCollisions(conf)
        && !this.isOutsideGrid(conf, {
          columns: this.config.maxCols,
          rows: this.config.maxRows
        });
      if (!this.ngGrid._placeholderRef.instance.valid) {
        this.cursor = 'no-drop';
      } else {
        this.cursor = 'auto';
      }
      this.ngGrid._placeholderRef.instance.setSize(dims.x, dims.y);
      this.ngGrid._placeholderRef.instance.setGridPosition(conf.col!!, conf.row!!);
    }
  }

  public itemDragOutside() {
    this.hidePlaceholder();
  }

  public itemReleased(v) {
    const conf = this.itemConfigFromEvent(v.release.item.config, v.move.event);
    this.hidePlaceholder();

    if (this.gridPositionService.validateGridPosition(conf.col!!, conf.row!!, v.release.item, this.config)
      && !this.hasCollisions(conf)
      && !this.isOutsideGrid(conf, {columns: this.config.maxCols, rows: this.config.maxRows})) {
      this.newItemAdd$.next({
        grid: this,
        newConfig: conf,
        oldConfig: v.release.item.config,
        event: v.release.event
      });
    }
    v.release.item.stopMoving();
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

  public removeItem(item: CatGridItemConfig) {
    let removed = false;
    this.items = this.items.filter(i => {
      if (i.col === item.col && i.row === item.row && !removed) {
        removed = true;
        return false;
      } else {
        return true;
      }
    });
  }

  public removeItemById(id: string) {
    this.items = this.items.filter(i => i.id !== id);
  }

  public addItem(item: CatGridItemConfig) {
    this.items = this.items.concat([item]);
  }

  private toObserverEvent(event) {
    return {
      grid: this,
      event,
    };
  }

  public isPositionInside(event:any):boolean {
    return this.ngGrid.isPositionInside(event);
  }
}
