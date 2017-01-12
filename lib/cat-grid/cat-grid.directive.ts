import {
  Directive,
  Output,
  OnInit,
  EventEmitter,
  Input,
  HostListener,
  ComponentRef,
  ElementRef,
  Renderer,
  ViewContainerRef,
  ComponentFactoryResolver
} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {CatGridItemEvent} from '../cat-grid-item/cat-grid-item.event';
import {CatGridPlaceholderComponent} from '../cat-grid-placeholder/cat-grid-placeholder.component';
import {CatGridConfig, CONST_DEFAULT_CONFIG} from './cat-grid.config';
import {CatGridValidationService} from '../cat-grid-validation.service';
import {CatGridItemComponent} from '../cat-grid-item/cat-grid-item.component';
import {CatGridItemConfig} from '../cat-grid-item/cat-grid-item.config';

@Directive({
  selector: '[catGrid]'
})
export class CatGridDirective implements OnInit {
  @Output() public onDragStart = new EventEmitter<CatGridItemComponent>();
  @Output() public onDrag = new EventEmitter<CatGridItemComponent>();
  @Output() public onDragStop = new EventEmitter<CatGridItemComponent>();
  @Output() public onResizeStart = new EventEmitter<CatGridItemComponent>();
  @Output() public onResize = new EventEmitter<CatGridItemComponent>();
  @Output() public onResizeStop = new EventEmitter<CatGridItemComponent>();
  @Output() public onItemChange = new EventEmitter<CatGridItemEvent[]>();
  @Output() public itemDroppedIn = new EventEmitter<any>();

  public mouseMove: Observable<any>;
  public colWidth: number = 250;
  public rowHeight: number = 250;
  public minCols: number = 1;
  public minRows: number = 1;
  public marginTop: number = 10;
  public marginRight: number = 10;
  public marginBottom: number = 10;
  public marginLeft: number = 10;
  public isDragging: boolean = false;
  public isResizing: boolean = false;
  public autoStyle: boolean = true;
  public resizeEnable: boolean = true;
  public dragEnable: boolean = true;
  public minWidth: number = 100;

  public minHeight: number = 100;
  public _items: CatGridItemComponent[] = [];
  private _draggingItem: CatGridItemComponent = null;
  private _resizingItem: CatGridItemComponent = null;
  private _resizeDirection: string = null;
  private _maxCols: number = 0;
  private _maxRows: number = 0;
  private _visibleCols: number = 0;
  private _visibleRows: number = 0;
  private _posOffset: { left: number, top: number } = null;
  public _placeholderRef: ComponentRef<CatGridPlaceholderComponent> = null;
  private _fixToGrid: boolean = false;
  private _autoResize: boolean = false;
  private _maintainRatio: boolean = false;
  private _aspectRatio: number;

  private _preferNew: boolean = false;

  private itemInitialSize: any;
  public _config = CONST_DEFAULT_CONFIG;

  constructor(public _ngEl: ElementRef,
              private _renderer: Renderer,
              private componentFactoryResolver: ComponentFactoryResolver,
              private viewContainer: ViewContainerRef,
              private validationService: CatGridValidationService) {
  }

  get pagePosition() {
    return {
      pageX: this._ngEl.nativeElement.offsetLeft,
      pageY: this._ngEl.nativeElement.offsetTop
    };
  }

  @Input('catGrid')
  set config(v: CatGridConfig) {
    this.setConfig(v);
  }

  public ngOnInit(): void {
    this._renderer.setElementClass(this._ngEl.nativeElement, 'grid', true);
    if (this.autoStyle) {
      this._renderer.setElementStyle(this._ngEl.nativeElement, 'position', 'relative');
    }
    this.setConfig(this._config);
    this.initPlaceholder();
  }

  public setConfig(config: CatGridConfig): void {
    this._config = config;
    this._autoResize = this._config.autoResize;
    this._preferNew = this._config.preferNew;
    this._maintainRatio = this._config.maintainRatio;
    this._fixToGrid = this._config.fixToGrid;
    this._visibleCols = Math.max(this._config.visibleCols, 0);
    this._visibleRows = Math.max(this._config.visibleRows, 0);

    this.setMargins(this._config.margins);

    this.rowHeight = this._config.rowHeight;
    this.colWidth = this._config.colWidth;
    this.resizeEnable = this._config.resizable;
    this.dragEnable = this._config.draggable;
    this.autoStyle = this._config.autoStyle;
    this.minWidth = this._config.minWidth || CONST_DEFAULT_CONFIG.minWidth;
    this.minHeight = this._config.minHeight || CONST_DEFAULT_CONFIG.minHeight;
    this.minCols = Math.max(this._config.minCols, 1);
    this.minRows = Math.max(this._config.minRows, 1);

    this._maxCols = Math.max(this._config.maxCols, 0);
    this._maxRows = Math.max(this._config.maxRows, 0);

    if (this._maintainRatio) {
      if (this.colWidth && this.rowHeight) {
        this._aspectRatio = this.colWidth / this.rowHeight;
      } else {
        this._maintainRatio = false;
      }
    }

    const maxWidth = this._maxCols * this.colWidth;
    const maxHeight = this._maxRows * this.rowHeight;

    if (maxWidth > 0 && this.minWidth > maxWidth) {
      this.minWidth = 0.75 * this.colWidth;
    }
    if (maxHeight > 0 && this.minHeight > maxHeight) {
      this.minHeight = 0.75 * this.rowHeight;
    }

    if (this.minWidth > this.colWidth) {
      this.minCols = Math.max(this.minCols, Math.ceil(this.minWidth / this.colWidth));
    }
    if (this.minHeight > this.rowHeight) {
      this.minRows = Math.max(this.minRows, Math.ceil(this.minHeight / this.rowHeight));
    }

    if (this._maxCols > 0 && this.minCols > this._maxCols) {
      this.minCols = 1;
    }
    if (this._maxRows > 0 && this.minRows > this._maxRows) {
      this.minRows = 1;
    }

    const width = config.colWidth * config.maxCols + 'px';
    const height = config.rowHeight * config.maxRows + 'px';

    this.setSize(width, height);
  }

  public setMargins(margins: number[]): void {
    this.marginTop = (margins[0]);
    this.marginRight = margins.length >= 2 ? (margins[1]) : this.marginTop;
    this.marginBottom = margins.length >= 3 ? (margins[2]) : this.marginTop;
    this.marginLeft = margins.length >= 4 ? (margins[3]) : this.marginRight;
  }

  public addItem(ngItem: CatGridItemComponent): void {
    if (!this._preferNew) {
      const newPos = ngItem.getGridPosition();
      ngItem.setGridPosition(newPos.col, newPos.row);
    }
    this._items.push(ngItem);
    ngItem.recalculateSelf();
  }

  public removeItem(ngItem: CatGridItemComponent): void {
    this._items = this._items.filter(item => item !== ngItem);

    this._items.forEach((item) => item.recalculateSelf());
  }

  public bringToFront(id: string): void {
    const item = this._items.filter(i => i.config.id === id)[0];
    if (item) {
      item.elementRef.nativeElement.style.zIndex = 99999;
    }
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  public onMouseDown(e: any) {
    const mousePos = this._getMousePosition(e);
    const item = this._getItemFromPosition(mousePos);

    if (item != null) {
      if (this.resizeEnable && item.canResize(e) != null) {
        this._resizeStart(e);
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    return true;
  }

  @HostListener('mousemove', ['$event'])
  public onMouseMove(e: any) {
    if (this.isResizing) {
      this._resize(e);
    }
  }

  private _resizeStart(e: any): void {
    if (this.resizeEnable) {
      const mousePos = this._getMousePosition(e);
      const item = this._getItemFromPosition(mousePos);

      item.startMoving();
      this._resizingItem = item;
      this._resizeDirection = item.canResize(e);
      const {col, row} = item.getGridPosition();
      this.itemInitialSize = item.getSize();
      this._placeholderRef.instance.setGridPosition(col, row);
      this.isResizing = true;

      this.onResizeStart.emit(item);
    }
  }

  private _resize(e: any): void {
    if (this.isResizing) {
      const mousePos = this._getMousePosition(e);
      const itemPos = this._resizingItem.getPosition();
      const itemDims = this._resizingItem.getDimensions();
      let newW = this._resizeDirection === 'height' ? itemDims.width : (mousePos.left - itemPos.left + 10);
      let newH = this._resizeDirection === 'width' ? itemDims.height : (mousePos.top - itemPos.top + 10);

      if (newW < this.minWidth) {
        newW = this.minWidth;
      }
      if (newH < this.minHeight) {
        newH = this.minHeight;
      }

      const calcSize = this._calculateGridSize(newW, newH);
      const itemSize = this._resizingItem.getSize();
      const iGridPos = this._resizingItem.getGridPosition();

      if (!this._isWithinBoundsX(iGridPos, calcSize)) {
        calcSize.x = (this._maxCols - iGridPos.col) + 1;
      }

      if (!this._isWithinBoundsY(iGridPos, calcSize)) {
        calcSize.y = (this._maxRows - iGridPos.row) + 1;
      }

      if (calcSize.x !== itemSize.x || calcSize.y !== itemSize.y) {
        this._resizingItem.setSize(calcSize.x, calcSize.y, false);
        this._placeholderRef.instance.setSize(calcSize.x, calcSize.y);
      }

      if (!this._fixToGrid) {
        this._resizingItem.setDimensions(newW, newH);
      }

      const bigGrid = this._maxGridSize(itemPos.left + newW + (2 * e.movementX), itemPos.top + newH + (2 * e.movementY));

      if (this._resizeDirection === 'height') {
        bigGrid.x = iGridPos.col + itemSize.x;
      }
      if (this._resizeDirection === 'width') {
        bigGrid.y = iGridPos.row + itemSize.y;
      }

      const conf = this._resizingItem.config;
      conf.sizex = calcSize.x;
      conf.sizey = calcSize.y;

      this._placeholderRef.instance.valid = this.validationService.validateResize(conf.col, conf.row, conf, this._config)
        && !this.hasCollisions(conf)
        && !this.isOutsideGrid(conf, {
          columns: this._config.maxCols,
          rows: this._config.maxRows
        });

      this.onResize.emit(this._resizingItem);
    }
  }


  private hasCollisions(itemConf: CatGridItemConfig): boolean {
    return this._items
      .map(c => c._config)
      .filter(c => !(c.col === itemConf.col && c.row === itemConf.row))
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
    return (col + sizex - 1 > gridSize.columns)
      || (row + sizey - 1 > gridSize.rows);
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('touchend', ['$event'])
  @HostListener('document:mouseup', ['$event'])
  public _onMouseUp(e: any): boolean {
    if (this.isDragging) {
      this._dragStop();
      return false;
    } else if (this.isResizing) {
      this._resizeStop();
      return false;
    }
    return true;
  }

  private _dragStop(): void {
    if (this.isDragging) {
      this.isDragging = false;

      this._draggingItem.stopMoving();
      this.onDragStop.emit(this._draggingItem);
      this._draggingItem = null;
      this._posOffset = null;
      this.onItemChange.emit(this._items.map(item => item.getEventOutput()));
    }
  }

  private _resizeStop(): void {
    if (this.isResizing) {
      this.isResizing = false;

      const itemDims = this._resizingItem.getSize();

      const conf = this._resizingItem.config;
      conf.sizex = itemDims.x;
      conf.sizey = itemDims.y;

      if (this.validationService.validateResize(conf.col, conf.row, conf, this._config)
        && !this.hasCollisions(conf)
        && !this.isOutsideGrid(conf, {
          columns: this._config.maxCols,
          rows: this._config.maxRows
        })) {
        this._resizingItem.setSize(itemDims.x, itemDims.y);
      } else {
        this._resizingItem.setSize(this.itemInitialSize.x, this.itemInitialSize.y);
      }

      this._resizingItem.stopMoving();
      this.onResizeStop.emit(this._resizingItem);
      this._resizingItem = null;
      this._resizeDirection = null;

      this.onItemChange.emit(this._items.map(item => item.getEventOutput()));
    }
  }

  private _maxGridSize(w: number, h: number): { x: number, y: number } {
    const sizex = Math.ceil(w / (this.colWidth + this.marginLeft + this.marginRight));
    const sizey = Math.ceil(h / (this.rowHeight + this.marginTop + this.marginBottom));
    return {'x': sizex, 'y': sizey};
  }

  private _calculateGridSize(width: number, height: number): { x: number, y: number } {
    width += this.marginLeft + this.marginRight;
    height += this.marginTop + this.marginBottom;

    let sizex = Math.max(this.minCols, Math.round(width / (this.colWidth + this.marginLeft + this.marginRight)));
    let sizey = Math.max(this.minRows, Math.round(height / (this.rowHeight + this.marginTop + this.marginBottom)));

    if (!this._isWithinBoundsX({col: 1, row: 1}, {x: sizex, y: sizey})) {
      sizex = this._maxCols;
    }
    if (!this._isWithinBoundsY({col: 1, row: 1}, {x: sizex, y: sizey})) {
      sizey = this._maxRows;
    }

    return {'x': sizex, 'y': sizey};
  }

  public _calculateGridPosition(left: number, top: number): { col: number, row: number } {
    let {row, col} = this._calculateGridPositionInternal(left, top);
    col = Math.max(1, col);
    row = Math.max(1, row);

    if (!this._isWithinBoundsX({col: col, row: row}, {x: 1, y: 1})) {
      col = this._maxCols;
    }
    if (!this._isWithinBoundsY({col: col, row: row}, {x: 1, y: 1})) {
      row = this._maxRows;
    }

    return {'col': col, 'row': row};
  }

  private _calculateGridPositionInternal(left: number, top: number): { col: number, row: number } {
    let col = Math.round(left / (this.colWidth + this.marginLeft + this.marginRight)) + 1;
    let row = Math.round(top / (this.rowHeight + this.marginTop + this.marginBottom)) + 1;
    return {'col':col, 'row':row};
  }

  private _isWithinBoundsX(pos: { col: number, row: number }, dims: { x: number, y: number }) {
    return (this._maxCols === 0 || (pos.col + dims.x - 1) <= this._maxCols);
  }

  private _isWithinBoundsY(pos: { col: number, row: number }, dims: { x: number, y: number }) {
    return (this._maxRows === 0 || (pos.row + dims.y - 1) <= this._maxRows);
  }

  private setSize(width: string, height: string) {
    this._renderer.setElementStyle(this._ngEl.nativeElement, 'width', width);
    this._renderer.setElementStyle(this._ngEl.nativeElement, 'height', height);
  }

  private _getMousePosition(e: any): { left: number, top: number } {
    if (((<any>window).TouchEvent && e instanceof TouchEvent) || (e.touches || e.changedTouches)) {
      e = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
    }
    const refPos = this._ngEl.nativeElement.getBoundingClientRect();

    let left = e.clientX - refPos.left;
    let top = e.clientY - refPos.top;

    return {
      left,
      top
    };
  }

  private _getItemFromPosition(position: { left: number, top: number }): CatGridItemComponent {
    const isPositionInside = (size: {width: number, height: number}, pos: {left: number, top: number}) => {
      return position.left > (pos.left + this.marginLeft) && position.left < (pos.left + this.marginLeft + size.width) &&
        position.top > (pos.top + this.marginTop) && position.top < (pos.top + this.marginTop + size.height);
    };

    return this._items.find(el => isPositionInside(el.getDimensions(), el.getPosition()));
  }

  public getItem(e: MouseEvent) {
    return this._getItemFromPosition(this._getMousePosition(e));
  }

  public getGridPositionOfEvent(event, offset) {
    let {left, top} = this._getMousePosition(event);
    return this._calculateGridPosition(left - offset.left, top - offset.top);
  }

  public isPositionInside(event:any):boolean {
    let {left, top} = this._getMousePosition(event);
    let position = this._calculateGridPositionInternal(left, top);

    return position.col > 0 &&
      position.row > 0 &&
      this._isWithinBoundsX(position, {x: 1, y: 1}) &&
      this._isWithinBoundsY(position, {x: 1, y: 1});
  }

  private initPlaceholder() {
    const factory = this.componentFactoryResolver.resolveComponentFactory(CatGridPlaceholderComponent);
    this._placeholderRef = this.viewContainer.createComponent(factory);
    this._placeholderRef.instance.registerGrid(this);
    this._placeholderRef.instance.setSize(0, 0);
  }
}

