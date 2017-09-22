import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';
import { CatGridConfig } from './cat-grid.config';
import { CatGridDragService } from '../cat-grid-drag.service';
import { CatGridValidationService } from '../cat-grid-validation.service';
import { intersect, toRectangle } from './utils';
import { CatGridPlaceholderComponent } from '../cat-grid-placeholder/cat-grid-placeholder.component';
import { CatGridItemComponent } from '../cat-grid-item/cat-grid-item.component';

@Component({
  selector: 'cat-grid',
  template: `
    <cat-grid-item [config]="item"
                   [x]="getXForItem(item)"
                   [y]="getYForItem(item)"
                   [colWidth]="config.colWidth"
                   [rowHeight]="config.rowHeight"
                   (dataChanged)="itemDataChanged($event, item.id)"
                   *ngFor="let item of items">
    </cat-grid-item>
    <cat-grid-placeholder class="grid-placeholder"></cat-grid-placeholder>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatGridComponent implements OnChanges, OnDestroy, OnInit {
  @Input() config: CatGridConfig;
  @Input() items: CatGridItemConfig[] = [];
  @Output() onItemsChange = new EventEmitter();
  @HostBinding('style.cursor') cursor = 'auto';
  @HostBinding('style.width.px') width = 100;
  @HostBinding('style.height.px') height = 100;
  @ViewChild(CatGridPlaceholderComponent) placeholder: CatGridPlaceholderComponent;
  @ViewChildren(CatGridItemComponent) itemsComponents: QueryList<CatGridItemComponent>;

  destroyed$ = new Subject();
  droppedItem: CatGridItemConfig | null = null;

  constructor(private elementRef: ElementRef,
              private changeDetectorRef: ChangeDetectorRef,
              private gridDragService: CatGridDragService,
              private gridPositionService: CatGridValidationService) {
  }

  ngOnInit() {
    this.gridDragService.itemDroppedObservable()
      .takeUntil(this.destroyed$)
      .subscribe(droppedItem => {
        if (droppedItem) {
          const index = this.items.findIndex(item => item.id === droppedItem.id);
          if (index > -1) {
            this.items.splice(index, 1);
          }

          if (this.droppedItem) {
            this.items.push(this.droppedItem);
            this.droppedItem = null;
          }
        }
        this.itemsComponents.forEach(item => item.show());
        this.onItemsChange.emit(this.items);
        this.changeDetectorRef.markForCheck();
      });
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
    if (e.target === this.elementRef.nativeElement || this.elementRef.nativeElement.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      if (!!this.gridDragService.dragConfig) {
        this.gridDragService.mouseMoveInside(e);
        this.showPlaceholder(this.gridDragService.dragConfig, e);
      } else {
        this.hidePlaceholder();
      }
    } else {
      this.hidePlaceholder();
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
      this.gridDragService.mouseUpInside(e);
      const config = this.itemConfigFromEvent(this.gridDragService.dragConfig, e);
      if (this.validPosition(config)) {
        this.droppedItem = config;
        this.gridDragService.stopDrag();
        this.gridDragService.itemDropped(config);
      } else {
        this.gridDragService.itemDropped(null);
      }
      this.hidePlaceholder();
    }
    this.gridDragService.stopDrag();
  }

  itemDataChanged(data: any, id: string) {
    const index = this.items.findIndex(item => item.id === id);
    if (index > -1) {
      this.items[index].component.data = data;
      this.onItemsChange.emit(this.items);
    }
    this.changeDetectorRef.markForCheck();
  }

  getXForItem(config: CatGridItemConfig) {
    return (config.col - 1) * this.config.colWidth;
  }

  getYForItem(config: CatGridItemConfig) {
    return (config.row - 1) * this.config.rowHeight;
  }

  setSize() {
    this.width = this.config.maxCols * this.config.colWidth;
    this.height = this.config.maxRows * this.config.rowHeight;
  }

  showPlaceholder(config: CatGridItemConfig, e: MouseEvent) {
    const placeholders = document.getElementsByClassName('grid-placeholder');
    for (let i = 0; i < placeholders.length; ++i) {
      (placeholders[i] as HTMLElement).style.display = 'none';
    }

    const newConfig = this.itemConfigFromEvent(config, e);
    const x = this.getXForItem(newConfig);
    const y = this.getYForItem(newConfig);
    const width = newConfig.sizex * this.config.colWidth;
    const height = newConfig.sizey * this.config.rowHeight;

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
    if (col + config.sizex - 1 > this.config.maxCols) {
      col = this.config.maxCols - config.sizex + 1;
    }
    if (row + config.sizey - 1 > this.config.maxRows) {
      row = this.config.maxRows - config.sizey + 1;
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
