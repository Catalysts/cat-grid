import { Directive, HostListener, Input, HostBinding, ElementRef } from '@angular/core';
import { CatGridDragService } from '../cat-grid-drag.service';
import { DragulaService } from 'ng2-dragula';
import { Subject } from 'rxjs/Rx';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';

@Directive({
  selector: '[catGridDraggableDragula]'
})
export class CatGridDraggableDragulaDirective {
  @Input() private catGridDraggableDragula: CatGridItemConfig;
  @HostBinding('draggable') draggable = false;
  @HostBinding('class') c: any;
  event: MouseEvent;

  constructor(private gridDragService: CatGridDragService,
              private dragulaService: DragulaService,
              private elementRef: ElementRef) {
    dragulaService.drag
      .filter(([, element]) => element.isEqualNode(this.elementRef.nativeElement))
      .subscribe(([, element]) => {
        setTimeout(() => {
          this.gridDragService.startDrag(this.catGridDraggableDragula, this.event, element);
        }, 1);
      });
  }

  @HostListener('mousemove', ['$event'])
  onMouseClick(event: MouseEvent) {
    this.event = event;
  }
}
