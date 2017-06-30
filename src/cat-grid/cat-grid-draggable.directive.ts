import {Directive, HostListener, Input, HostBinding} from '@angular/core';
import {CatGridDragService} from '../cat-grid-drag.service';

@Directive({
  selector: '[catGridDraggable]'
})
export class CatGridDraggableDirective {
  @Input() private catGridDraggable: any;
  @HostBinding('draggable') draggable: boolean = true;

  constructor(private gridDragService: CatGridDragService) {
  }

  @HostListener('dragstart')
  private dragStart() {
    this.gridDragService.dragItemConf = this.catGridDraggable;
  }
}
