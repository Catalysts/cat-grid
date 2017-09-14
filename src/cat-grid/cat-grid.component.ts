import { Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';
import { CatGridConfig } from './cat-grid.config';
import { CatGridDragService } from '../cat-grid-drag.service';
import { CatGridValidationService } from '../cat-grid-validation.service';
import { intersect, toRectangle } from './utils';

@Component({
  selector: 'cat-grid',
  template: `
    <cat-grid-item [config]="item"
                   [x]="getXForItem(item)"
                   [y]="getYForItem(item)"
                   [colWidth]="config.colWidth"
                   [rowHeight]="config.rowHeight"
                   *ngFor="let item of items">
    </cat-grid-item>
    <cat-grid-placeholder [valid]="placeholderConfig.valid"
                          [height]="placeholderConfig.height"
                          [width]="placeholderConfig.width"
                          [left]="placeholderConfig.left"
                          [top]="placeholderConfig.top"></cat-grid-placeholder>
  `,
})
export class CatGridComponent implements OnChanges, OnDestroy {
  @Input() config: CatGridConfig;
  @Input() items: CatGridItemConfig[] = [];

  @Output() onItemsChange  = new EventEmitter();

  @HostBinding('style.cursor')
  cursor = 'auto';

  @HostBinding('style.display')
  display = 'inline-block';

  @HostBinding('style.width.px')
  width = 100;

  @HostBinding('style.height.px')
  height = 100;

  destroyed$ = new Subject();
  placeholderConfig: {
    valid: boolean | null,
    width: number,
    height: number,
    left: number,
    top: number,
  } = {
    valid: null,
    width: 0,
    height: 0,
    left: 0,
    top: 0
  };

  constructor(private elementRef: ElementRef,
              private gridDragService: CatGridDragService,
              private gridPositionService: CatGridValidationService) {
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.unsubscribe();
  }

  ngOnChanges(changes: any) {
    const config = changes.config;

    if (config) {
      this.setSize();
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!!this.gridDragService.dragConfig) {
      this.showPlaceholder(this.gridDragService.dragConfig, e);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.hidePlaceholder();
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!!this.gridDragService.dragConfig) {
      const config = this.gridDragService.dragConfig;
      if (this.validPosition(config, e)) {
        // add to grid
        // remove from others
      }

      this.gridDragService.stopDrag();
      this.hidePlaceholder();
    }
  }

  getXForItem(config: CatGridItemConfig) {
    return (config.col - 1) * this.config.colWidth;
  }

  getYForItem(config: CatGridItemConfig) {
    return (config.row - 1) * this.config.rowHeight;
  }

  setSize() {
    this.width = this.config.cols * this.config.colWidth;
    this.height = this.config.rows * this.config.rowHeight;
  }

  showPlaceholder(config: CatGridItemConfig, e: MouseEvent) {
    this.placeholderConfig = {
      valid: true,
      width: config.colSpan * this.config.colWidth,
      height: config.rowSpan * this.config.rowHeight,
      left: this.getXForItem(this.itemConfigFromEvent(config, e)),
      top: this.getYForItem(this.itemConfigFromEvent(config, e)),
    }
  }

  hidePlaceholder() {
    if (this.placeholderConfig) {
      this.placeholderConfig.valid = null;
    }
  }

  validPosition(item: CatGridItemConfig, event: MouseEvent) {
    const conf = this.itemConfigFromEvent(item, event);
    return this.gridPositionService.validateGridPosition(conf.col!!, conf.row!!, conf, this.config)
      && !this.hasCollisions(item);
  }

  getMousePos(event: MouseEvent) {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  getGridPosition(x: number, y: number) {
    return {
      col: Math.floor(x / this.config.colWidth) + 1,
      row: Math.floor(y / this.config.rowHeight) + 1,
    }
  }

  itemConfigFromEvent(config: CatGridItemConfig, event: MouseEvent): CatGridItemConfig {
    const {x, y} = this.getMousePos(event);
    const {col, row} = this.getGridPosition(x, y);
    return Object.assign({}, config, {col, row});
  }

  hasCollisions(itemConf: CatGridItemConfig): boolean {
    return this.items.filter(c => c.id !== itemConf.id)
      .some((conf: CatGridItemConfig) => intersect(toRectangle(conf), toRectangle(itemConf)));
  }
}
