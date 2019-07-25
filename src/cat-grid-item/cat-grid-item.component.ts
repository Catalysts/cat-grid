import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2, SimpleChange, Type,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { CatGridItemEvent } from './cat-grid-item.event';
import { CatGridItemConfig } from './cat-grid-item.config';
import { CatGridDragService } from '../cat-grid-drag.service';
import { partition, fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil, filter, mergeMap, map, tap } from 'rxjs/operators';

@Component({
  selector: 'cat-grid-item',
  template: '<ng-template #componentContainer></ng-template>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatGridItemComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() config: CatGridItemConfig;
  @Input() x: number;
  @Input() y: number;
  @Input() colWidth: number;
  @Input() rowHeight: number;

  @Output() onResize = new EventEmitter<CatGridItemEvent>();
  @Output() onResizeStop = new EventEmitter<CatGridItemEvent>();
  @Output() dataChanged = new EventEmitter<any>();

  @ViewChild('componentContainer', {read: ViewContainerRef, static: true})
  private componentContainer: ViewContainerRef;

  @HostBinding('style.z-index')
  zIndex: number = 2;

  @HostBinding('style.cursor')
  cursor: string;

  @HostBinding('style.transform')
  transform: string;

  @HostBinding('style.width.px')
  elemWidth: number;

  @HostBinding('style.height.px')
  elemHeight: number;

  private mouseUp$: Observable<MouseEvent>;
  private mouseMove$: Observable<MouseEvent>;

  private dragStart$: Observable<any>;

  private resizeStart$: Observable<any>;
  private resize$: Observable<any>;

  private destroyed$ = new Subject();

  private componentRef: ComponentRef<any>;

  constructor(private elementRef: ElementRef,
              private renderer: Renderer2,
              private changeDetectorRef: ChangeDetectorRef,
              private catGridDragService: CatGridDragService,
              private componentFactoryResolver: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    this.renderer.addClass(this.elementRef.nativeElement, 'grid-item');
    this.renderer.setStyle(this.elementRef.nativeElement, 'position', 'absolute');

    [this.dragStart$, this.resizeStart$] = partition(fromEvent(this.elementRef.nativeElement, 'mousedown'),
      (e: any) => !this.canResize(e));

    this.mouseUp$ = fromEvent(this.elementRef.nativeElement, 'mouseup');
    this.mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');

    this.setSize(this.config.sizex * this.colWidth, this.config.sizey * this.rowHeight);

    this.mouseMove$.pipe(takeUntil(this.destroyed$))
      .subscribe(e => {
        this.setResizeCursor(e);
      });

    this.dragStart$.pipe(
      filter(() => this.config.draggable),
      takeUntil(this.destroyed$))
      .subscribe((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.catGridDragService.startDrag(this.config, e, this.elementRef.nativeElement);
        this.hide();
        this.changeDetectorRef.markForCheck();
      });

    this.resize$ = this.resizeStart$.pipe(mergeMap((dragStart: MouseEvent) => {
      const initialHeight = this.elemHeight;
      const initialWidth = this.elemWidth;
      const type = this.canResize(dragStart);
      return this.mouseMove$.pipe(map((mm: MouseEvent) => {
        mm.preventDefault();

        const newWidth = initialWidth + mm.clientX - dragStart.clientX;
        const newHeight = initialHeight + mm.clientY - dragStart.clientY;

        return {
          newWidth,
          newHeight,
          event: mm,
          type
        };
      }),
        takeUntil(fromEvent(window, 'mouseup')),
        tap(
          size => {},
          null,
          () => {
            this.onResizeStop.emit({x: this.config.col, y: this.config.row, width: this.elemWidth, height: this.elemHeight});

            if (this.componentRef.instance.catGridItemLoaded) {
              this.componentRef.instance.catGridItemLoaded(this.config);
            }
            this.changeDetectorRef.markForCheck();
          }
        ));
    }));

    this.resize$.pipe(
      takeUntil(this.destroyed$))
      .subscribe(size => {
        const {type} = size;

        let newWidth = this.elemWidth;
        let newHeight = this.elemHeight;

        if (type === 'both' || type === 'width') {
          newWidth = size.newWidth;
          this.onResize.emit({x: this.config.col, y: this.config.row, width: size.newWidth, height: this.elemHeight});
        }
        if (type === 'both' || type === 'height') {
          newHeight = size.newHeight;
          this.onResize.emit({x: this.config.col, y: this.config.row, width: this.elemWidth, height: size.newHeight});
        }

        this.setSize(newWidth, newHeight);
      });
  }

  ngOnChanges(changes: any) {
    const config: SimpleChange = changes.config;
    if (changes.x || changes.y) {
      this.setPosition(this.x, this.y);
    }
    if (changes.colWidth || changes.rowHeight) {
      this.setSize(this.config.sizex * this.colWidth, this.config.sizey * this.rowHeight);
      this.changeDetectorRef.markForCheck();
      this.injectComponent();
    }
    if (!config) {
      return;
    }
    if (JSON.stringify(config.currentValue) !== JSON.stringify(config.previousValue)) {
      this.applyConfigChanges(config.currentValue);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.injectComponent(), 1);
  }

  applyConfigChanges(config:CatGridItemConfig) {
      this.config = config;
      this.setSize(config.sizex * this.colWidth, config.sizey * this.rowHeight);
      this.injectComponent();
  }

  setResizeCursor(e: any): string {
    if (this.catGridDragService.dragConfig) {
      this.cursor = 'no-drop';
      return null;
    }
    const resizeType = this.canResize(e);
    switch (resizeType) {
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
    return resizeType;
  }

  hide() {
    this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'none');
  }

  show() {
    this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'inline-block');
  }

  canResize(e: MouseEvent): string | null {
    if (!this.config.resizable) {
      return null;
    }
    const refPos = this.elementRef.nativeElement.getBoundingClientRect();
    const mousePos = {
      left: e.clientX - refPos.left,
      top: e.clientY - refPos.top
    };
    if (mousePos.left < this.elemWidth && mousePos.left > this.elemWidth - 10
      && mousePos.top < this.elemHeight && mousePos.top > this.elemHeight - 10) {
      return 'both';
    } else if (mousePos.left < this.elemWidth && mousePos.left > this.elemWidth - 10) {
      return 'width';
    } else if (mousePos.top < this.elemHeight && mousePos.top > this.elemHeight - 10) {
      return 'height';
    }
    // if (e.offsetX < this.elemWidth && e.offsetX > this.elemWidth - this.config.borderSize
    //   && e.offsetY < this.elemHeight && e.offsetY > this.elemHeight - this.config.borderSize) {
    //   return 'both';
    // } else if (e.offsetX < this.elemWidth && e.offsetX > this.elemWidth - this.config.borderSize) {
    //   return 'width';
    // } else if (e.offsetY < this.elemHeight && e.offsetY > this.elemHeight - this.config.borderSize) {
    //   return 'height';
    // }

    return null;
  }

  setPosition(left: number, top: number) {
    this.transform = `translate(${left}px, ${top}px)`;
  }

  setSize(width: number, height: number) {
    this.elemWidth = width;
    this.elemHeight = height;
  }

  injectComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    const factory = this.componentFactoryResolver.resolveComponentFactory(this.config.component.type);
    this.componentRef = this.componentContainer.createComponent(factory);
    Object.assign(this.componentRef.instance, this.config.component.data);

    this.checkInstanceInterface(this.componentRef.instance, factory.componentType);

    if (this.componentRef.instance.catGridItemLoaded) {
      this.componentRef.instance.catGridItemLoaded(this.config);
    }

    if (this.componentRef.instance.cellSizeChanged) {
      this.componentRef.instance.cellSizeChanged(this.colWidth, this.rowHeight);
    }

    if (this.componentRef.instance.dataChangedObservable) {
      this.componentRef.instance.dataChangedObservable().pipe(takeUntil(this.destroyed$)).subscribe((data: any) => {
        this.config.component.data = data;
        this.dataChanged.emit(data);
        this.changeDetectorRef.markForCheck();
      });
    }

    if (this.componentRef.instance.configChangedObservable) {
      this.componentRef.instance.configChangedObservable().pipe(takeUntil(this.destroyed$)).subscribe((config: CatGridItemConfig) => {
        this.applyConfigChanges(config);
      });
    }

    this.componentRef.changeDetectorRef.detectChanges();
    this.changeDetectorRef.markForCheck();
  }

  checkInstanceInterface(instance: any, type: Type<any>) {
    if (!instance.catGridItemLoaded || !instance.dataChangedObservable) {
      throw `${type.name} should implement ICatGridItemComponent`;
    }
  }
}
