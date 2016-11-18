import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Output,
  EventEmitter,
  ViewContainerRef,
  ViewChild,
  ComponentRef,
  ElementRef,
  Renderer,
  Input,
  HostListener,
  ComponentFactoryResolver, HostBinding
} from '@angular/core';
import {CatGridItemEvent} from './cat-grid-item.event';
import {CatGridItemConfig, ITEM_DEFAULT_CONFIG} from './cat-grid-item.config';
import {CatGridDirective} from '../cat-grid/cat-grid.directive';

@Component({
  selector: 'cat-grid-item',
  templateUrl: './cat-grid-item.component.html',
  styleUrls: ['./cat-grid-item.component.css']
})
export class CatGridItemComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output()
  public onItemChange: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>(false);
  @Output()
  public onDragStart: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onDrag: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onDragStop: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onDragAny: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onResizeStart: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onResize: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onResizeStop: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onResizeAny: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onChangeStart: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onChange: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onChangeStop: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public onChangeAny: EventEmitter<CatGridItemEvent> = new EventEmitter<CatGridItemEvent>();
  @Output()
  public ngGridItemChange: EventEmitter<CatGridItemConfig> = new EventEmitter<CatGridItemConfig>();

  @ViewChild('componentContainer', {read: ViewContainerRef})
  private componentContainer: ViewContainerRef;

  @HostBinding('style.cursor')
  private cursor: string;

  @HostBinding('style.transform')
  private transform: string;

  @HostBinding('style.width')
  private _elemWidth: string;

  @HostBinding('style.height')
  private _elemHeight: string;

  private componentRef: ComponentRef<any>;

  public isFixed: boolean = false;
  public isDraggable: boolean = true;
  public isResizable: boolean = true;

  private _col: number = 1;
  private _row: number = 1;
  private _sizex: number = 1;
  private _sizey: number = 1;
  public _config: CatGridItemConfig = ITEM_DEFAULT_CONFIG;
  private _dragHandle: string;
  private _resizeHandle: string;
  private _borderSize: number;
  private _elemLeft: number;
  private _elemTop: number;
  private _added: boolean = false;

  private isResizing: boolean = false;

  constructor(public elementRef: ElementRef,
              private renderer: Renderer,
              private componentFactoryResolver: ComponentFactoryResolver,
              public _ngGrid: CatGridDirective,
              public containerRef: ViewContainerRef) {
  }

  @Input('item')
  set config(v: CatGridItemConfig) {
    v = Object.assign({}, ITEM_DEFAULT_CONFIG, v);

    this.setConfig(v);
    this.recalculateSelf();
  }

  get config(): CatGridItemConfig {
    return this._config;
  }

  public ngOnInit(): void {
    this.renderer.setElementClass(this.elementRef.nativeElement, 'grid-item', true);
    this.renderer.setElementStyle(this.elementRef.nativeElement, 'position', 'absolute');
    this.recalculateSelf();

    if (!this._added) {

      this._added = true;
      this._ngGrid.addItem(this);
    }
  }

  public ngOnDestroy(): void {
    if (this._added) {
      this._ngGrid.removeItem(this);
    }
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => this.injectComponent(), 1);
  }

  public canDrag(e: any): boolean {
    if (!this.isDraggable) {
      return false;
    }

    if (this._dragHandle) {
      const parent = e.target.parentElement;
      return parent.querySelector(this._dragHandle) === e.target;
    }

    return true;
  }

  public canResize(e: any): string {
    if (!this.isResizable) {
      return null;
    }
    const mousePos = this._getMousePosition(e);
    const width = parseInt(this._elemWidth, 10);
    const height = parseInt(this._elemHeight, 10);
    if (mousePos.left < width && mousePos.left > width - this._borderSize
      && mousePos.top < height && mousePos.top > height - this._borderSize) {
      return 'both';
    } else if (mousePos.left < width && mousePos.left > width - this._borderSize) {
      return 'width';
    } else if (mousePos.top < height && mousePos.top > height - this._borderSize) {
      return 'height';
    }

    return null;
  }

  @HostListener('mousemove', ['$event'])
  public onMouseMove(e: MouseEvent): void {
    switch (this.canResize(e)) {
      case 'both':
        this.cursor = 'nwse-resize';
        break;
      case 'width':
        this.cursor = 'ew-resize';
        break;
      case 'height':
        this.cursor = 'ns-resize';
        break;
      default:
        this.cursor = 'auto';
    }
  }

  @HostListener('window:mouseup')
  public onMouseUp() {
    this.isResizing = false;
  }

  public getDimensions(): { width: number, height: number } {
    return {width: parseInt(this._elemWidth, 10), height: parseInt(this._elemHeight, 10)};
  }

  public getSize(): { x: number, y: number } {
    return {x: this._sizex, y: this._sizey};
  }

  public getPosition(): { left: number, top: number } {
    return {left: this._elemLeft, top: this._elemTop};
  }

  public getPagePosition() {
    return {
      left: this.elementRef.nativeElement.getBoundingClientRect().left,
      top: this.elementRef.nativeElement.getBoundingClientRect().top + window.scrollY
    };
  }

  public getGridPosition(): { col: number, row: number } {
    return {col: this._col, row: this._row};
  }

  public setConfig(config: CatGridItemConfig): void {
    this._config = config;

    this._col = config.col || ITEM_DEFAULT_CONFIG.col;
    this._row = config.row || ITEM_DEFAULT_CONFIG.row;
    this._sizex = config.sizex || ITEM_DEFAULT_CONFIG.sizex;
    this._sizey = config.sizey || ITEM_DEFAULT_CONFIG.sizey;
    this._dragHandle = config.dragHandle;
    this._resizeHandle = config.resizeHandle;
    this._borderSize = config.borderSize;
    this.isDraggable = config.draggable;
    this.isResizable = config.resizable;
    this.isFixed = config.fixed;
  }

  public setSize(x: number, y: number, update = true): void {
    this._sizex = x;
    this._sizey = y;

    this.config.sizex = this._sizex;
    this.config.sizey = this._sizey;
    if (update) {
      this._recalculateDimensions();
    }

    this.onItemChange.emit(this.getEventOutput());
  }

  public setGridPosition(col: number, row: number, update = true): void {
    this._col = col;
    this._row = row;
    if (update) {
      this._recalculateDimensions();
    }

    this.onItemChange.emit(this.getEventOutput());
  }

  public getEventOutput(): CatGridItemEvent {
    return {
      col: this._col,
      row: this._row,
      sizex: this._sizex,
      sizey: this._sizey,
      width: parseInt(this._elemWidth, 10),
      height: parseInt(this._elemHeight, 10),
      left: this._elemLeft,
      top: this._elemTop
    };
  }

  public move(event: MouseEvent, offset) {
    const parentTop = this.elementRef.nativeElement.parentElement.getBoundingClientRect().top + window.scrollY;
    const parentLeft = this.elementRef.nativeElement.parentElement.getBoundingClientRect().left + window.scrollX;
    this.setPosition(event.pageX - offset.left - parentLeft, event.pageY - offset.top - parentTop);
  }

  public setDimensions(w: number, h: number): void {
    this._elemWidth = w + 'px';
    this._elemHeight = h + 'px';
  }

  public setPosition(left: number, top: number) {
    this._elemLeft = left;
    this._elemTop = top;
    this.transform = `translate(${this._elemLeft}px, ${this._elemTop}px)`;
  }

  public startMoving(): void {
    this.renderer.setElementStyle(this.elementRef.nativeElement, 'pointer-events', 'none');
  }

  public stopMoving(): void {
    this.renderer.setElementStyle(this.elementRef.nativeElement, 'pointer-events', 'auto');
  }

  public recalculateSelf(): void {
    this._recalculatePosition();
    this._recalculateDimensions();
  }

  private _recalculatePosition(): void {
    this.setPosition(
      (Math.max(this._ngGrid.minWidth, this._ngGrid.colWidth) + this._ngGrid.marginLeft + this._ngGrid.marginRight)
      * (this._col - 1) + this._ngGrid.marginLeft,
      (Math.max(this._ngGrid.minHeight, this._ngGrid.rowHeight) + this._ngGrid.marginTop + this._ngGrid.marginBottom)
      * (this._row - 1) + this._ngGrid.marginTop
    );
  }

  private _recalculateDimensions(): void {
    const newWidth = Math.max(this._ngGrid.minWidth, this._ngGrid.colWidth) * this._sizex;
    const newHeight = Math.max(this._ngGrid.minHeight, this._ngGrid.rowHeight) * this._sizey;
    const w = newWidth + ((this._ngGrid.marginLeft + this._ngGrid.marginRight) * (this._sizex - 1));
    const h = newHeight + ((this._ngGrid.marginTop + this._ngGrid.marginBottom) * (this._sizey - 1));

    this.setDimensions(w, h);
  }

  private injectComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    const factory = this.componentFactoryResolver.resolveComponentFactory(this._config.component.type);
    this.componentRef = this.componentContainer.createComponent(factory);
    Object.assign(this.componentRef.instance, this._config.component.data);
    this.componentRef.changeDetectorRef.detectChanges();
  }

  private _getMousePosition(e: any): { left: number, top: number } {
    if (e.originalEvent && e.originalEvent.touches) {
      const oe = e.originalEvent;
      e = oe.touches.length ? oe.touches[0] : oe.changedTouches[0];
    }

    const refPos = this.elementRef.nativeElement.getBoundingClientRect();

    return {
      left: e.clientX - refPos.left,
      top: e.clientY - refPos.top
    };
  }
}
