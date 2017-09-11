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

  @Output() onDrag = new EventEmitter<CatGridItemEvent>();
  @Output() onDragStop = new EventEmitter<CatGridItemEvent>();

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

  @HostBinding('style.left.px')
  private elemX: number;

  @HostBinding('style.top.px')
  private elemY: number;

  private mouseUp$: Observable<MouseEvent>;
  private mouseMove$: Observable<MouseEvent>;

  private dragStart$: Observable<any>;
  private drag$: Observable<Position>;

  private resizeStart$: Observable<any>;
  private resize$: Observable<any>;

  private destroyed$ = new Subject();

  private componentRef: ComponentRef<any>;

  constructor(private elementRef: ElementRef,
              private renderer: Renderer2,
              private componentFactoryResolver: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    this.renderer.addClass(this.elementRef.nativeElement, 'grid-item');
    this.renderer.setStyle(this.elementRef.nativeElement, 'position', 'absolute');

    [this.dragStart$, this.resizeStart$] = Observable.fromEvent(this.elementRef.nativeElement, 'mousedown')
      .partition(() => !this.canResize());

    this.mouseUp$ = Observable.fromEvent(this.elementRef.nativeElement, 'mouseup');
    this.mouseMove$ = Observable.fromEvent(document, 'mousemove');

    this.drag$ = this.dragStart$.flatMap((md: MouseEvent) => {
      return this.mouseMove$.map((mm: MouseEvent) => {
        mm.preventDefault();

        return {
          left: mm.clientX - md.offsetX,
          top: mm.clientY - md.offsetY
        };
      })
        .takeUntil(this.mouseUp$)
        .do(
          pos => this.onDrag.emit({x: pos.left, y: pos.top, width: this.config.width, height: this.config.height}),
          null,
          () => this.onDragStop.emit({x: this.elemX, y: this.elemY, width: this.config.width, height: this.config.height})
        );
    });
    this.resize$ = this.resizeStart$.flatMap(() => {
      return this.mouseMove$.map((mm: MouseEvent) => {
        mm.preventDefault();

        const newWidth = Math.max(mm.clientX - this.config.x, 100);
        const newHeight = Math.max(mm.clientY - this.config.y, 100);

        return {
          newWidth,
          newHeight
        };
      })
        .takeUntil(this.mouseUp$)
        .do(
          size => this.onResize.emit({x: this.config.x, y: this.config.y, width: size.newWidth, height: size.newHeight}),
          null,
          () => {
            this.onResizeStop.emit({x: this.config.x, y: this.config.y, width: this.elemWidth, height: this.elemHeight});

            if (this.componentRef.instance.catGridItemLoaded) {
              this.componentRef.instance.catGridItemLoaded(this.config);
            }
          }
        )
    });

    this.drag$
      .takeUntil(this.destroyed$)
      .subscribe(position => this.setPosition(position.left, position.top));
    this.resize$
      .takeUntil(this.destroyed$)
      .subscribe(size => {
        this.setResizeCursor();
        this.setSize(size.newWidth, size.newHeight)
      });
  }

  ngOnChanges(changes: any) {
    if (changes.x || changes.y) {
      this.setPosition(this.config.x, this.config.y);
    }
    if (changes.width || changes.height) {
      this.setSize(this.config.width, this.config.height);
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
    if (this.config.x < this.elemWidth && this.config.x > this.elemWidth - this.config.borderSize
      && this.config.y < this.elemHeight && this.config.y > this.elemHeight - this.config.borderSize) {
      return 'both';
    } else if (this.config.x < this.elemWidth && this.config.x > this.elemWidth - this.config.borderSize) {
      return 'width';
    } else if (this.config.y < this.elemHeight && this.config.y > this.elemHeight - this.config.borderSize) {
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
