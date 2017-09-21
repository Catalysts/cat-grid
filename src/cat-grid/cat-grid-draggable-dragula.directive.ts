import {Directive, HostListener, Input, HostBinding, ElementRef} from '@angular/core';
import {CatGridDragService} from '../cat-grid-drag.service';
import {DragulaService} from 'ng2-dragula';
import {Subject} from 'rxjs/Rx';
import {CatGridItemConfig} from '../cat-grid-item/cat-grid-item.config';

@Directive({
  selector: '[catGridDraggableDragula]'
})
export class CatGridDraggableDragulaDirective {
  @Input() private catGridDraggableDragula: CatGridItemConfig;
  @HostBinding('draggable') draggable = false;
  @HostBinding('class') c: any;

  private windowMouseMove$ = new Subject<MouseEvent>();
  private windowMouseUp$ = new Subject<MouseEvent>();

  constructor(private gridDragService: CatGridDragService,
              private dragulaService: DragulaService,
              private elementRef: ElementRef) {
    dragulaService.drag
      .filter(([, element]) => element.isEqualNode(this.elementRef.nativeElement))
      .subscribe(() => this.gridDragService.startDrag(this.catGridDraggableDragula, null, null));
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
