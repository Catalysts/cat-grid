import {Component, OnInit, HostListener, Output, Input, OnDestroy, EventEmitter, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {CatGridItemConfig} from '../cat-grid-item/cat-grid-item.config';
import {CatGridConfig} from './cat-grid.config';
import {CatGridDirective} from './cat-grid.directive';
import {CatGridDragService} from '../cat-grid-drag.service';
import {CatGridValidationService} from '../cat-grid-validation.service';
import {CatGridItemComponent} from '../cat-grid-item/cat-grid-item.component';

@Component({
  selector: 'cat-grid',
  templateUrl: './cat-grid.component.html',
  styleUrls: ['./cat-grid.component.css']
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

  public mouseMove$: Subject<any> = new Subject();
  public newItemAdd$: Subject<any> = new Subject();

  constructor(private gridDragService: CatGridDragService,
              private gridPositionService: CatGridValidationService) {
  }

  ngOnInit() {
    const {inside, outside, release} = this.gridDragService.registerGrid(this);
    inside.subscribe(v => this.itemDraggedInside(v));
    outside.subscribe(v => this.itemDragOutside());
    release.subscribe(v => this.itemReleased(v));
  }

  ngOnDestroy(): any {
    this.ngGrid._items.forEach(item => item.ngOnDestroy());
  }

  @HostListener('mousemove', ['$event'])
  private mouseMove(e) {
    this.mouseMove$.next(this.toObserverEvent(e));
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
      if (this.gridPositionService.validateGridPosition(conf.col!!, conf.row!!, v.itemDragged.item, this.ngGrid._config)
        && !this.hasCollisions(conf, v.itemDragged.item.config)
        && !this.isOutsideGrid(conf, {
          columns: this.ngGrid._config.maxCols,
          rows: this.ngGrid._config.maxRows
        })) {
        this.ngGrid._placeholderRef.instance.valid = true;
      } else {
        this.ngGrid._placeholderRef.instance.valid = false;
      }
      this.ngGrid._placeholderRef.instance.setSize(dims.x, dims.y);
      this.ngGrid._placeholderRef.instance.setGridPosition(conf.col!!, conf.row!!);
    }
  }

  public itemDragOutside() {
    this.ngGrid._placeholderRef.instance.setSize(0, 0);
  }

  public itemReleased(v) {
    const conf = this.itemConfigFromEvent(v.release.item.config, v.move.event);

    if (this.gridPositionService.validateGridPosition(conf.col!!, conf.row!!, v.release.item, this.ngGrid._config)
      && !this.hasCollisions(conf, v.release.item.config)
      && !this.isOutsideGrid(conf, {columns: this.ngGrid._config.maxCols, rows: this.ngGrid._config.maxRows})) {
      this.newItemAdd$.next({
        grid: this,
        newConfig: conf,
        oldConfig: v.release.item.config,
        event: v.release.event
      });
    }
    v.release.item.stopMoving();
    this.ngGrid._placeholderRef.instance.setSize(0, 0);
  }

  private itemConfigFromEvent(config: CatGridItemConfig, event: MouseEvent): CatGridItemConfig {
    const {col, row} = this.ngGrid.getGridPositionOfEvent(event, this.gridDragService.posOffset);
    return Object.assign({}, config, {col, row});
  }

  private hasCollisions(itemConf: CatGridItemConfig, initialConf: CatGridItemConfig): boolean {
    return this.items
      .filter(c => !(c.col === initialConf.col && c.row === initialConf.row))
      .some((conf: CatGridItemConfig) => intersect(
        toRectangle(conf), toRectangle(itemConf)
      ));

    function intersect(r1, r2) {
      return !(r2.left > r1.right ||
      r2.right < r1.left ||
      r2.top > r1.bottom ||
      r2.bottom < r1.top);
    }

    function toRectangle(conf: CatGridItemConfig) {
      return {
        left: conf.col,
        top: conf.row,
        right: conf.col + conf.sizex - 1,
        bottom: conf.row + conf.sizey - 1
      };
    }
  }

  private isOutsideGrid(item: CatGridItemConfig, gridSize: any): boolean {
    const {col, row} = item;
    const {sizex, sizey} = item;
    return (col + sizex - CatGridComponent.GRID_POSITIONS_OFFSET > gridSize.columns)
      || (row + sizey - CatGridComponent.GRID_POSITIONS_OFFSET > gridSize.rows);
  }

  @HostListener('dragover', ['$event'])
  private dragOver(e) {
    const item = this.gridDragService.dragItemConf;
    if (!item) {
      return;
    }
    const dims = {
      x: item.sizex,
      y: item.sizey
    };
    const conf: CatGridItemConfig = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
    conf.sizex = dims.x;
    conf.sizey = dims.y;
    this.ngGrid._placeholderRef.instance.setGridPosition(conf.col!!, conf.row!!);
    if (this.gridPositionService.validateGridPosition(conf.col!!, conf.row!!, item, this.ngGrid._config)
      && !this.hasCollisions(conf, item)
      && !this.isOutsideGrid(conf, {columns: this.ngGrid._config.maxCols, rows: this.ngGrid._config.maxRows})) {
      this.ngGrid._placeholderRef.instance.valid = true;
    } else {
      this.ngGrid._placeholderRef.instance.valid = false;
    }
    this.ngGrid._placeholderRef.instance.setSize(dims.x!!, dims.y!!);
    e.preventDefault();
  }

  @HostListener('dragleave', ['$event'])
  private dragLeave(e) {
    this.ngGrid._placeholderRef.instance.setSize(0, 0);
  }

  @HostListener('drop', ['$event'])
  private drop(e) {
    const content = this.gridDragService.dragItemConf;
    this.gridDragService.dragItemConf = null;
    if (content) {
      const conf: CatGridItemConfig = this.ngGrid.getGridPositionOfEvent(e, {left: 0, top: 0});
      conf.sizex = content.sizex;
      conf.sizey = content.sizey;
      if (this.gridPositionService.validateGridPosition(conf.col!!, conf.row!!, content, this.ngGrid._config)
        && !this.hasCollisions(conf, content)
        && !this.isOutsideGrid(conf, {
          columns: this.ngGrid._config.maxCols,
          rows: this.ngGrid._config.maxRows
        })) {
        const itemConfig = Object.assign(content, conf);
        this.newItemAdd$.next({
          grid: this,
          newConfig: itemConfig,
          event: e
        });
      }
    }
    this.ngGrid._placeholderRef.instance.setSize(0, 0);
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

  @HostListener('mousedown', ['$event'])
  private mouseDown(e) {
    const i = this.ngGrid.getItem(e);
    if (i) {
      if (i.canResize(e)) {

      } else if (i.canDrag(e)) {
        this.gridDragService.dragStart(i, this, e);
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  private mouseUp(e: MouseEvent) {
    this.ngGrid._placeholderRef.instance.setSize(0, 0);
  }

  private toObserverEvent(event) {
    return {
      grid: this,
      event,
    };
  }
}
