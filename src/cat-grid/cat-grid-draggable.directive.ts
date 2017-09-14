import { Directive, HostListener, Input, HostBinding } from '@angular/core';
import { CatGridDragService } from '../cat-grid-drag.service';
import { CatGridItemConfig } from '../cat-grid-item/cat-grid-item.config';

@Directive({
  selector: '[catGridDraggable]'
})
export class CatGridDraggableDirective {
  @Input() catGridDraggable: CatGridItemConfig;
  @HostBinding('draggable') draggable = true;

  constructor(private gridDragService: CatGridDragService) {
  }

  @HostListener('dragstart', ['$event'])
  private dragStart(e: DragEvent) {
    this.gridDragService.startDrag(
      this.catGridDraggable,
      (event.target as Node).cloneNode(true) as HTMLElement
    );
  }
}
