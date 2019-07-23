import {Directive, HostListener, Input, HostBinding, ElementRef, OnDestroy} from '@angular/core';
import { CatGridDragService } from '../cat-grid-drag.service';
import { DragulaService } from 'ng2-dragula';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';

@Directive({
  selector: '[catGridDraggableDragula]'
})
export class CatGridDraggableDragulaDirective implements OnDestroy {
  @Input() private catGridDraggableDragula: CatGridItemConfig;
  @HostBinding('draggable') draggable = false;
  @HostBinding('class') c: any;
  event: MouseEvent;

  private destroyed$ = new Subject();

  constructor(private gridDragService: CatGridDragService,
              private dragulaService: DragulaService,
              private elementRef: ElementRef) {
    dragulaService.drag.pipe(
      takeUntil(this.destroyed$),
      filter(([, element]) => element.isEqualNode(this.elementRef.nativeElement)))
      .subscribe(([, element]) => {
        setTimeout(() => this.gridDragService.startDrag(this.catGridDraggableDragula, this.event, element), 10);
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  @HostListener('mousedown', ['$event'])
  onMouseClick(event: MouseEvent) {
    this.event = event;
  }
}
