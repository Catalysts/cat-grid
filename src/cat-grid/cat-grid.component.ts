import {
  Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, Output,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';
import { CatGridConfig } from './cat-grid.config';
import { CatGridDragService } from '../cat-grid-drag.service';
import { CatGridValidationService } from '../cat-grid-validation.service';
import { intersect, toRectangle } from './utils';
import { CatGridPlaceholderComponent } from '../cat-grid-placeholder/cat-grid-placeholder.component';

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
    <cat-grid-placeholder class="grid-placeholder"></cat-grid-placeholder>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class CatGridComponent implements OnChanges, OnDestroy {
  @Input() config: CatGridConfig;
  @Input() items: CatGridItemConfig[] = [];
  @Output() onItemsChange = new EventEmitter();
  @HostBinding('style.cursor') cursor = 'auto';
  @HostBinding('style.width.px') width = 100;
  @HostBinding('style.height.px') height = 100;
  @ViewChild(CatGridPlaceholderComponent) placeholder: CatGridPlaceholderComponent;

  destroyed$ = new Subject();

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
      if (this.validPosition(config)) {
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
    const newConfig = this.itemConfigFromEvent(config, e);
    const x = this.getXForItem(newConfig);
    const y = this.getYForItem(newConfig);
    const width = newConfig.colSpan * this.config.colWidth;
    const height = newConfig.rowSpan * this.config.rowHeight;

    // only revalidate if position changed
    if (x !== this.placeholder.x || y !== this.placeholder.y
      || width !== this.placeholder.width || height !== this.placeholder.height) {
      this.placeholder.setValid(this.validPosition(newConfig));
    }

    this.placeholder.setPosition(x, y);
    this.placeholder.setSize(width, height);
    this.placeholder.show();
  }

  hidePlaceholder() {
    this.placeholder.hide();
  }

  validPosition(config: CatGridItemConfig) {
    return this.gridPositionService.validateGridPosition(config.col, config.row, config, this.config)
      && !this.hasCollisions(config);
  }

  getMousePos(event: MouseEvent) {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const nodeConfig = this.gridDragService.nodeConfig;
    return {
      x: event.clientX - rect.left - (nodeConfig.clientX - nodeConfig.left),
      y: event.clientY - rect.top - (nodeConfig.clientY - nodeConfig.top)
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
    let {col, row} = this.getGridPosition(x, y);

    // if position is outside, keep the current position on each axis accordingly
    if (col + config.colSpan - 1 > this.config.cols) {
      col = this.config.cols - config.colSpan + 1;
    }
    if (row + config.rowSpan - 1 > this.config.rows) {
      row = this.config.rows - config.rowSpan + 1;
    }
    if (col <= 0) {
      col = 1;
    }
    if (row <= 0) {
      row = 1;
    }
    return Object.assign({}, config, {col, row});
  }

  hasCollisions(itemConf: CatGridItemConfig): boolean {
    return this.items.filter(c => c.id !== itemConf.id)
      .some((conf: CatGridItemConfig) => intersect(toRectangle(conf), toRectangle(itemConf)));
  }
}
