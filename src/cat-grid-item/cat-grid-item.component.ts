import {
  AfterViewInit,
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
  Renderer2,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { CatGridItemEvent } from './cat-grid-item.event';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { CatGridItemConfig } from './cat-grid-item.config';
import { CatGridDragService } from '../cat-grid-drag.service';

interface Position {
  left: number;
  top: number;
}

@Component({
  selector: 'cat-grid-item',
  template: '<ng-template #componentContainer></ng-template>',
})
export class CatGridItemComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() config: CatGridItemConfig;
  @Input() x: number;
  @Input() y: number;
  @Input() colWidth: number;
  @Input() rowHeight: number;

  @Output() onResize = new EventEmitter<CatGridItemEvent>();
  @Output() onResizeStop = new EventEmitter<CatGridItemEvent>();

  @ViewChild('componentContainer', {read: ViewContainerRef})
  private componentContainer: ViewContainerRef;

  @HostBinding('style.cursor')
  private cursor: string;

  @HostBinding('style.transform')
  private transform: string;

  @HostBinding('style.width.px')
  private elemWidth: number;

  @HostBinding('style.height.px')
  private elemHeight: number;

  private mouseUp$: Observable<MouseEvent>;
  private mouseMove$: Observable<MouseEvent>;

  private dragStart$: Observable<any>;

  private resizeStart$: Observable<any>;
  private resize$: Observable<any>;

  private destroyed$ = new Subject();

  private componentRef: ComponentRef<any>;

  constructor(private elementRef: ElementRef,
              private renderer: Renderer2,
              private catGridDragService: CatGridDragService,
              private componentFactoryResolver: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    this.renderer.addClass(this.elementRef.nativeElement, 'grid-item');
    this.renderer.setStyle(this.elementRef.nativeElement, 'position', 'absolute');

    [this.dragStart$, this.resizeStart$] = Observable.fromEvent(this.elementRef.nativeElement, 'mousedown')
      .partition(() => !this.canResize());

    this.mouseUp$ = Observable.fromEvent(this.elementRef.nativeElement, 'mouseup');
    this.mouseMove$ = Observable.fromEvent(document, 'mousemove');

    this.setSize(this.config.colSpan * this.colWidth, this.config.rowSpan * this.rowHeight);

    this.dragStart$
      .takeUntil(this.destroyed$)
      .subscribe((e: MouseEvent) => {
        this.catGridDragService.startDrag(this.config, e, this.elementRef.nativeElement.cloneNode(true));
      });

    this.resize$ = this.resizeStart$.flatMap(() => this.mouseMove$.map((mm: MouseEvent) => {
      mm.preventDefault();

      const newWidth = Math.max(mm.clientX - this.config.col, 100);
      const newHeight = Math.max(mm.clientY - this.config.row, 100);

      return {
        newWidth,
        newHeight
      };
    })
      .takeUntil(this.mouseUp$)
      .do(
        size => this.onResize.emit({x: this.config.col, y: this.config.row, width: size.newWidth, height: size.newHeight}),
        null,
        () => {
          this.onResizeStop.emit({x: this.config.col, y: this.config.row, width: this.elemWidth, height: this.elemHeight});

          if (this.componentRef.instance.catGridItemLoaded) {
            this.componentRef.instance.catGridItemLoaded(this.config);
          }
        }
      ));

    this.resize$
      .takeUntil(this.destroyed$)
      .subscribe(size => {
        this.setResizeCursor();
        this.setSize(size.newWidth, size.newHeight)
      });
  }

  ngOnChanges(changes: any) {
    const config: CatGridItemConfig = changes.config;
    if (!config) {
      return;
    }
    if (changes.x || changes.y) {
      this.setPosition(this.x, this.y);
    }
    if (config.colSpan || config.rowSpan) {
      this.setSize(config.colSpan * this.colWidth, config.rowSpan * this.rowHeight);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.injectComponent(), 1);
  }

  setResizeCursor(): void {
    switch (this.canResize()) {
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

  canResize(): string | null {
    if (!this.config.resizable) {
      return null;
    }
    if (this.config.col < this.elemWidth && this.config.col > this.elemWidth - this.config.borderSize
      && this.config.row < this.elemHeight && this.config.row > this.elemHeight - this.config.borderSize) {
      return 'both';
    } else if (this.config.col < this.elemWidth && this.config.col > this.elemWidth - this.config.borderSize) {
      return 'width';
    } else if (this.config.row < this.elemHeight && this.config.row > this.elemHeight - this.config.borderSize) {
      return 'height';
    }

    return null;
  }

  setPosition(left: number, top: number) {
    this.transform = `translate(${left}px, ${top}px)`;
  }

  setSize(width: number, height: number) {
    this.elemWidth = width;
    this.elemHeight = height;

    console.log(this.elemWidth);
  }

  injectComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    const factory = this.componentFactoryResolver.resolveComponentFactory(this.config.component.type);
    this.componentRef = this.componentContainer.createComponent(factory);
    Object.assign(this.componentRef.instance, this.config.component.data);

    if (this.componentRef.instance.catGridItemLoaded) {
      this.componentRef.instance.catGridItemLoaded(this.config);
    }

    this.componentRef.changeDetectorRef.detectChanges();
  }
}
