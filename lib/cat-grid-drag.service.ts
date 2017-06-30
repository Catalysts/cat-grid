import {Injectable} from '@angular/core';
import {CatGridComponent} from './cat-grid/cat-grid.component';
import {Observable, Subject} from 'rxjs/Rx';
import {CatGridItemConfig} from './cat-grid-item/cat-grid-item.config';
import {CatGridItemComponent} from './cat-grid-item/cat-grid-item.component';
import {isArray} from 'rxjs/util/isArray';

export interface ItemDragEvent {
  item: CatGridItemConfig;
  event: MouseEvent;
}

@Injectable()
export class CatGridDragService {
  private window = window;
  public itemDragged$: Observable<any>;
  public itemReleased$: Subject<any> = new Subject();
  public itemAdded$: Subject<any> = new Subject();
  private windowMouseMove$: Observable<any>;
  private windowMouseUp$: Observable<any>;
  public draggedItem: CatGridItemComponent | null;
  public initialGrid: CatGridComponent | null;
  public dragItemConf: CatGridItemConfig | null;
  private grids: Array<CatGridComponent> = [];

  private dragging$ = new Subject<ItemDragEvent>();
  private drop$ = new Subject<ItemDragEvent>();

  public posOffset: any = {};

  private removing: boolean = false;

  public static equalScreenPosition(e1: any, e2: any): boolean {
    return e1 && e2 && e1.screenX === e2.screenX && e1.screenY === e2.screenY;
  }

  public constructor() {
    this.windowMouseMove$ = Observable.fromEvent(this.window, 'mousemove').map(e => ({grid: null, event: e}));
    this.windowMouseUp$ = Observable.fromEvent(this.window, 'mouseup').map(e => ({
      grid: null,
      event: e,
      item: this.draggedItem
    }));

    this.itemDragged$ = this.windowMouseMove$
      .filter(() => !!this.draggedItem)
      .map(event => ({
        item: this.draggedItem,
        event
      }));

    this.windowMouseUp$.subscribe(e => this.mouseUp(e));
  }

  public draggingObservable(): Observable<ItemDragEvent> {
    return this.dragging$.asObservable();
  }

  public dropObservable(): Observable<ItemDragEvent> {
    return this.drop$.asObservable();
  }

  public addDraggingSource(dragSource$: Observable<ItemDragEvent>, dropSource$: Observable<ItemDragEvent>) {
    dragSource$.subscribe(e => this.dragging$.next(e));
    dropSource$.subscribe(e => this.drop$.next(e));
  }

  public removeItemById(id: string) {
    this.removing = true;
    this.grids.forEach(grid => {
      if (grid.items.map(item => item.id).indexOf(id) > -1) {
        grid.removeItemById(id);
        this.removing = false;
        this.changeSubgridItemsConfig(grid.ngGrid._config.id, grid.items);
      }
    });
  }

  public getPlacedItems() {
    return this.grids[0].items;
  }

  public unregisterGrid(grid: CatGridComponent) {
    let index = this.grids.indexOf(grid, 0);
    if (index > -1) {
      this.grids.splice(index, 1);
    }
  }

  public registerGrid(grid: CatGridComponent) {
    const mouseMoveCombined = grid.onMouseMove$.merge(this.windowMouseMove$);
    const dragCombined = mouseMoveCombined
      .withLatestFrom(this.itemDragged$, (x, y) => ({
        itemDragged: y,
        event: x.event,
        grid: x.grid
      }));
    const outside = dragCombined.filter(it => it.grid == null && !!this.draggedItem);
    const inside = dragCombined.filter(it => {
      if (!(it.grid != null && this.draggedItem)) {
        return false;
      }
      let isChildGrid = false;
      for (let gridIter of this.grids) {
        if (gridIter === grid) {
          isChildGrid = true;
        } else if (isChildGrid) {
          if (gridIter.isPositionInside(it.event)) {
            // we are dragging over a child-grid, we don't want to propagate such drag-events to the
            //  parent grid
            // console.log('not propagating event because of nested grid');
            // NOTE: would be cleaner to do this by inserting an artificial event into the outside observable
            grid.itemDragOutside();
            return false;
          }
        }
      }
      return true;
    });

    const release = this.itemReleased$.withLatestFrom(inside, (x, y) => ({release: x, move: y}))
      .filter(x => CatGridDragService.equalScreenPosition(x.release.event, x.move.event));
    grid.newItemAdd$
      .merge(this.windowMouseUp$)
      .filter(x => !x.grid)
      .subscribe((x) => {
        if (this.initialGrid && this.draggedItem) {
          this.initialGrid.removeItem(this.draggedItem.config);
          this.initialGrid.addItem(this.draggedItem.config);
          this.draggedItem = null;
          this.initialGrid = null;
        }
      });

    grid.newItemAdd$.subscribe(v => {
      if (this.initialGrid) {
        this.initialGrid.removeItem(v.oldConfig);
        this.changeSubgridItemsConfig(this.initialGrid.ngGrid._config.id, this.initialGrid.items);
      }
      this.draggedItem = null;
      this.initialGrid = null;
      this.changeSubgridItemsConfig(grid.ngGrid._config.id, grid.items.concat(v.newConfig));
      grid.addItem(v.newConfig);
      this.itemAdded$.next(this.getPlacedItems());
    });
    this.itemDragged$.subscribe(v => this.mouseMove(v.event.event));
    this.grids.push(grid);
    return {
      inside,
      outside,
      release
    };
  }

  private changeSubgridItemsConfig(id: string, items: CatGridItemConfig[]) {
    this.changeSubgridItemsConfigAux(id, items, this.getPlacedItems());
  }

  private changeSubgridItemsConfigAux(id: string, items: CatGridItemConfig[], placedItems: CatGridItemConfig[]) {
    const subgridIndex = placedItems.findIndex(item => {
      if (isArray(item.component.data.items)) {
        if (item.id == id) {
          return true;
        } else if (item.component.data.items.length > 0) {
          this.changeSubgridItemsConfigAux(id, items, item.component.data.items);
        }
      }
      return false;
    });
    if (subgridIndex > -1) {
      placedItems[subgridIndex].component.data.items = items;
    }
  }

  public mouseMove(event: any) {
    if (this.draggedItem) {
      this.draggedItem.move(event, this.posOffset);
    }
  }

  public mouseUp(event: any) {
    if (this.draggedItem) {
      this.itemReleased$.next({
        item: this.draggedItem,
        event: event.event,
      });
    }
  }

  public dragStart(item: CatGridItemComponent, grid: CatGridComponent, event: any) {
    event.preventDefault();
    this.draggedItem = item;
    this.initialGrid = grid;
    const itemPos = item.getPagePosition();
    this.posOffset = {'left': (event.pageX - itemPos.left), 'top': (event.pageY - itemPos.top)};
    item.startMoving();
  }

  public bringToFront(itemId: string) {
    this.grids[0].ngGrid.bringToFront(itemId);
  }
}
