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
import {Subject} from 'rxjs/Rx';
import {CatGridItemConfig} from '../cat-grid-item/cat-grid-item.config';
import {CatGridConfig} from './cat-grid.config';
import {CatGridDragService, DragOffset} from '../cat-grid-drag.service';
import {CatGridValidationService} from '../cat-grid-validation.service';
import {intersect, toRectangle} from './utils';
import {CatGridPlaceholderComponent} from '../cat-grid-placeholder/cat-grid-placeholder.component';
import {CatGridItemComponent} from '../cat-grid-item/cat-grid-item.component';
import {CatGridItemEvent} from '../cat-grid-item/cat-grid-item.event';

@Component({
  selector: 'cat-grid',
  template: `
    <cat-grid-item [config]="item"
                   [x]="getXForItem(item)"
                   [y]="getYForItem(item)"
                   [colWidth]="colWidth"
                   [rowHeight]="config.rowHeight"
                   (dataChanged)="itemDataChanged($event, item.id)"
                   (onResize)="itemResizing($event, item.id)"
                   (onResizeStop)="itemResizeStop($event, item.id)"
                   *ngFor="let item of displayedItems">
    </cat-grid-item>
    <cat-grid-placeholder class="grid-placeholder"></cat-grid-placeholder>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `],
  host: {'class': 'grid'},
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
  displayedItems: CatGridItemConfig[] = [];
  destroyed$ = new Subject();
  droppedItem: CatGridItemConfig | null = null;

  constructor(private elementRef: ElementRef,
              private changeDetectorRef: ChangeDetectorRef,
              private gridDragService: CatGridDragService,
              private gridPositionService: CatGridValidationService) {
  }

  get colWidth():number {
    return this.config.colWidth;
  }

  getSizeFromPx(px: number) {
    return Math.max(1, Math.ceil(px / this.config.colWidth));
  }

  itemResizing(ev: CatGridItemEvent, id: string) {
    const idx = this.displayedItems.findIndex(i => i.id === id)
    if (idx >= 0) {
      const itemConfig = this.displayedItems[idx];
      let newSizeX = this.getSizeFromPx(ev.width);
      if (newSizeX + itemConfig.col > this.config.maxCols) {
        newSizeX = this.config.maxCols - itemConfig.col + 1;
      }
      let newSizeY = this.getSizeFromPx(ev.height);
      if (newSizeY + itemConfig.row > this.config.maxRows) {
        newSizeY = this.config.maxRows - itemConfig.row + 1;
      }
      const newConfig = {...itemConfig, sizex: newSizeX, sizey: newSizeY};
      this.showPlaceholder(this.gridDragService.dragConfig, newConfig);
    }
  }

  itemResizeStop(ev: CatGridItemEvent, id: string) {
    const idx = this.displayedItems.findIndex(i => i.id === id)
    if (idx >= 0) {
      const itemConfig = this.displayedItems[idx];
      let newSizeX = this.getSizeFromPx(ev.width);
      if (newSizeX + itemConfig.col > this.config.maxCols) {
        newSizeX = this.config.maxCols - itemConfig.col + 1;
      }
      let newSizeY = this.getSizeFromPx(ev.height);
      if (newSizeY + itemConfig.row > this.config.maxRows) {
        newSizeY = this.config.maxRows - itemConfig.row + 1;
      }
      const newConfig = {...itemConfig, sizex: newSizeX, sizey: newSizeY};
      if (this.validPosition(newConfig)) {
        this.displayedItems.splice(idx, 1);
        this.displayedItems.push(newConfig);
        const itemIdx = this.items.findIndex(i => i.id === id)
        if (itemIdx > -1) {
          // propagate change to item (should always be found)
          this.items[itemIdx].sizex = newSizeX;
          this.items[itemIdx].sizey = newSizeY;
        }
        this.onItemsChange.emit(this.items);
        this.itemsComponents.forEach(item => item.show());
        this.changeDetectorRef.markForCheck();
      }
    }
  }

  ngOnInit() {
    this.gridDragService.itemDroppedObservable()
      .takeUntil(this.destroyed$)
      .subscribe(droppedItem => {
        if (droppedItem) {
          const displayItemsIndex = this.displayedItems.findIndex(item => item.id === droppedItem.id);
          const itemsIndex = this.items.findIndex(item => item.id === droppedItem.id);
          let changed = false;

          if (displayItemsIndex > -1) {
            this.displayedItems.splice(displayItemsIndex, 1);
            this.items.splice(itemsIndex, 1);
            changed = true;
          }

          if (this.droppedItem) {
            this.displayedItems.push(this.droppedItem);
            this.items.push(this.droppedItem);
            this.droppedItem = null;
            changed = true;
          }

          if (changed) {
            this.onItemsChange.emit(this.items);
          }
        }
        this.itemsComponents.forEach(item => item.show());
        this.changeDetectorRef.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();

    this.itemsComponents.forEach(item => item.ngOnDestroy());
  }

  ngOnChanges(changes: any) {
    const config = changes.config;

    if (config) {
      this.setSize();
    }

    if (changes.items) {
      // remove items which not longer are displayed
      for (let i=this.displayedItems.length-1; i>=0; i--) {
        // iterate in reverse to be able to remove items without breaking iteration
        const item = this.displayedItems[i];
        const currentIdx = changes.items.currentValue.findIndex((cItem: any) => cItem.id === item.id);
        if (currentIdx < 0) {
          this.displayedItems.splice(i, 1);
        }
      }
      changes.items.currentValue.forEach((item: any) => {
        const i = this.displayedItems.findIndex(displayedItem => displayedItem.id === item.id);
        if (i < 0) {
          // it is a new item
          this.displayedItems.push(item);
        } else {
          // this is an old item
          const itemRef = this.itemsComponents.find(cmp => cmp.config.id === item.id);
          if (itemRef) {
            const oldConfig = changes.items.previousValue.find((i: any) => i.id === item.id);
            if (JSON.stringify(oldConfig) !== JSON.stringify(item)) {
              // itemRef.setPosition(this.getXForItem(item), this.getYForItem(item));
              // itemRef.applyConfigChanges(item);
              this.displayedItems[i] = item;
            }
          }
        }
      });
    }
    this.changeDetectorRef.markForCheck();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: any) {
    if (!e.dirty && (e.target === this.elementRef.nativeElement || this.elementRef.nativeElement.contains(e.target))) {
      e.dirty = true;
      if (!!this.gridDragService.dragConfig) {
        this.gridDragService.mouseMoveInside(e);
        this.showPlaceholder(this.gridDragService.dragConfig,
          this.itemConfigFromEvent(this.gridDragService.dragConfig, e, this.gridDragService.getDragOffset()));
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
  onMouseUp(e: any) {
    if (e.dirty) {
      return;
    }
    e.dirty = true;
    if (!!this.gridDragService.dragConfig) {
      this.gridDragService.mouseUpInside(e);
      const config = this.itemConfigFromEvent(this.gridDragService.dragConfig, e, this.gridDragService.getDragOffset());
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
    const index = this.displayedItems.findIndex(item => item.id === id);
    if (index > -1) {
      this.displayedItems[index].component.data = data;
      // this.items[index].component.data = data;
      this.onItemsChange.emit(this.displayedItems);
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

  showPlaceholder(config: CatGridItemConfig, newConfig: CatGridItemConfig) {
    const placeholders = document.getElementsByClassName('grid-placeholder');
    for (let i = 0; i < placeholders.length; ++i) {
      (placeholders[i] as HTMLElement).style.display = 'none';
    }

    const x = this.getXForItem(newConfig);
    const y = this.getYForItem(newConfig);
    const width = newConfig.sizex * this.config.colWidth;
    const height = newConfig.sizey * this.config.rowHeight;

    // only revalidate if position changed
    if (x !== this.placeholder.x || y !== this.placeholder.y
      || width !== this.placeholder.width || height !== this.placeholder.height) {
      const valid = this.validPosition(newConfig);
      if (valid) {
        this.cursor = 'pointer';
      } else {
        this.cursor = 'no-drop';
      }
      this.placeholder.setValid(valid);
    }

    this.placeholder.setPosition(x, y);
    this.placeholder.setSize(width, height);
    this.placeholder.show();
    this.changeDetectorRef.markForCheck();
  }

  hidePlaceholder() {
    this.cursor = 'auto';
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

  itemConfigFromEvent(config: CatGridItemConfig, event: MouseEvent, dragOffset: DragOffset = {x: 0, y: 0}): CatGridItemConfig {
    let {x, y} = this.getMousePos(event);
    x = x - dragOffset.x;
    y = y - dragOffset.y;
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
    return this.displayedItems.filter(c => c.id !== itemConf.id)
      .some((conf: CatGridItemConfig) => intersect(toRectangle(conf), toRectangle(itemConf)));
  }
}
