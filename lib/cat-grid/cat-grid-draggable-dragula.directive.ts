import {Directive, HostListener, Input, HostBinding, ElementRef} from '@angular/core';
import {CatGridDragService} from '../cat-grid-drag.service';
import {DragulaService} from 'ng2-dragula/components/dragula.provider';
import {Subject} from 'rxjs/Rx';
import {CatGridItemConfig} from '../cat-grid-item/cat-grid-item.config';

@Directive({
  selector: '[catGridDraggableDragula]'
})
export class CatGridDraggableDragulaDirective {
  @Input() private catGridDraggable: CatGridItemConfig;
  @HostBinding('draggable') draggable: boolean = false;
  @HostBinding('class') c;

  private dragging = false;
  private windowMouseMove$ = new Subject<MouseEvent>();
  private windowMouseUp$= new Subject<MouseEvent>();

  constructor(private gridDragService: CatGridDragService,
              private dragulaService: DragulaService,
              private elementRef: ElementRef) {
    dragulaService.drag
      .filter(([, element]) => element.isEqualNode(this.elementRef.nativeElement))
      .subscribe(() => this.dragging = true);
    dragulaService.dragend
      .filter(([, element]) => element.isEqualNode(this.elementRef.nativeElement))
      .subscribe(() => this.dragging = false);
    const dragObservable = this.windowMouseMove$
      .filter(() => this.dragging)
      .map(event => ({
        event,
        item: this.catGridDraggable
      }));
    const dropObservable = dragulaService.drop
      // .filter(([, element]) => element.isEqualNode(this.elementRef.nativeElement))
      .combineLatest(this.windowMouseUp$, (_, event) => event)
      .map(event => ({
        event,
        item: this.catGridDraggable
      }));
    this.gridDragService.addDraggingSource(dragObservable, dropObservable);
  }

  @HostListener('window:mousemove', ['$event'])
  windowMouseMove(e: MouseEvent) {
    this.windowMouseMove$.next(e);
  }


  @HostListener('window:mouseup', ['$event'])
  windowMouseUp(e: MouseEvent) {
    this.windowMouseUp$.next(e);
  }
}
