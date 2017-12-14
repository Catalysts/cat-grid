import { Directive, HostListener, Input, HostBinding } from '@angular/core';
import { CatGridDragService } from '../cat-grid-drag.service';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';

@Directive({
  selector: '[catGridDraggable]'
})
export class CatGridDraggableDirective {
  @Input() catGridDraggable: CatGridItemConfig;
  // @HostBinding('draggable') draggable = true;

  constructor(private gridDragService: CatGridDragService) {
  }

  @HostListener('mousedown', ['$event'])
  private dragStart(e: MouseEvent) {
    this.gridDragService.startDrag(
      this.catGridDraggable,
      e,
      e.target as HTMLElement
    );
  }
}
