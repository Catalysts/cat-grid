import {Injectable} from '@angular/core';
import {CatGridComponent} from './cat-grid/cat-grid.component';
import {Observable, Subject} from 'rxjs';
import {CatGridItemConfig} from './cat-grid-item/cat-grid-item.config';
import {CatGridItemComponent} from './cat-grid-item/cat-grid-item.component';
import {isArray} from 'rxjs/util/isArray';

@Injectable()
export class CatGridDragService {
  private window = window;
  public itemDragged$: Observable<any>;
  public itemReleased$: Subject<any> = new Subject();
  public itemAdded$: Subject<any> = new Subject();

  private windowMouseMove$: Observable<any>;
  private windowMouseUp$: Observable<any>;
  private windowDragOver$: Observable<any>;
  private windowDrop$: Observable<any>;

  public draggedItem: CatGridItemComponent | null;
  public initialGrid: CatGridComponent | null;
  public dragItemConf: CatGridItemConfig | null;
  private grids: Array<CatGridComponent> = [];

  public posOffset: any = {};

  private removing: boolean = false;

  private static equalScreenPosition(e1, e2): boolean {
    return e1.screenX === e2.screenX && e1.screenY === e2.screenY;
  }

  public constructor() {
    this.windowMouseMove$ = Observable.fromEvent(this.window, 'mousemove').map(e => ({grid: null, event: e}));
    this.windowMouseUp$ = Observable.fromEvent(this.window, 'mouseup').map(e => ({
      grid: null,
      event: e,
      item: this.draggedItem
    }));
    this.windowDragOver$ = Observable.fromEvent(this.window, 'dragover').map(e => ({grid: null, event: e}));
    this.windowDrop$ = Observable.fromEvent(this.window, 'drop').map(e => ({grid: null, event: e}));

    this.itemDragged$ = this.windowMouseMove$
      .filter(() => !!this.draggedItem)
      .map(event => ({
        item: this.draggedItem,
        event
      }));

    this.windowMouseUp$.subscribe(e => this.mouseUp(e));
  }

  public removeItemById(id: string) {
    this.removing = true;
    this.grids.forEach(grid => {
      if (grid.items.map(item => item.id).includes(id)) {
        grid.removeItemById(id);
        this.removing = false;
        this.changeSubgridItemsConfig(grid.ngGrid._config.id, grid.items);
      }
    });
  }

  public getPlacedItems() {
    return this.grids[0].items;
  }

  public registerGrid(grid: CatGridComponent) {
    const mouseMoveCombined = grid.mouseMove$.merge(this.windowMouseMove$)
      .distinct((a, b) => CatGridDragService.equalScreenPosition(a.event, b.event));
    const dragCombined = mouseMoveCombined
      .withLatestFrom(this.itemDragged$, (x, y) => ({
        itemDragged: y,
        event: x.event,
        grid: x.grid
      }));
    const inside = dragCombined.filter(it => it.grid != null);
    const outside = dragCombined.filter(it => it.grid == null);
    const release = this.itemReleased$.withLatestFrom(inside, (x, y) => ({release: x, move: y}))
      .filter(x => CatGridDragService.equalScreenPosition(x.release.event, x.move.event));
    grid.newItemAdd$
      .merge(this.windowMouseUp$)
      .distinct((a, b) => CatGridDragService.equalScreenPosition(a.event, b.event))
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
    const placedItems = this.getPlacedItems();
    const subgridIndex = placedItems.findIndex(item => item.id === id && isArray(item.component.data.items));
    if (subgridIndex > -1) {
      placedItems[subgridIndex].component.data.items = items;
    }
  }

  public mouseMove(event) {
    if (this.draggedItem) {
      this.draggedItem.move(event, this.posOffset);
    }
  }

  public mouseUp(event) {
    if (this.draggedItem) {
      this.itemReleased$.next({
        item: this.draggedItem,
        event: event.event,
      });
    }
  }

  public dragStart(item: CatGridItemComponent, grid: CatGridComponent, event) {
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
