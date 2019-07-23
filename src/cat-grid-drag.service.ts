import { Injectable } from '@angular/core';
import { fromEvent, merge , Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CatGridItemConfig } from './cat-grid-item/cat-grid-item.config';
import { CatGridDragResult } from './cat-grid-drag-result.interface';

/**
 * Angular service used to control the dragging.
 * The service handles a global (appended to body) element where it holds the needed HtmlElement to drag.
 * It also holds the CatGridItemConfig of the dragged element so other components (e.g. CatGridComponent)
 * can use it when dragging over them.
 *
 * The method startDrag is used when we have to start dragging an element.
 * The method stopDrag NEEDS to be used when stopping the drag (so that the dragging element is removed from the body).
 */
@Injectable()
export class CatGridDragService {
  windowMouseMove$: Observable<MouseEvent>;
  windowMouseUp$: Observable<MouseEvent>;
  mouseMoveInside$ = new Subject<MouseEvent>();
  mouseUpInside$ = new Subject<MouseEvent>();
  droppedItem$ = new Subject<CatGridItemConfig | null>();
  droppedOutside$ = new Subject<CatGridDragResult>();

  dragConfig: CatGridItemConfig | null = null;
  dragNode: HTMLElement | null = null;
  container: HTMLElement;

  nodeConfig: {
    clientX: number,
    clientY: number,
    left: number,
    top: number,
  };

  constructor() {
    this.windowMouseMove$ = merge(fromEvent<MouseEvent>(window, 'mousemove').pipe(), this.mouseMoveInside$.asObservable());
    this.windowMouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
    this.container = document.createElement('span');
    document.body.appendChild(this.container);
  }

  /**
   * Method used to start a drag. It will create a new element, identical to the one sent as parameter.
   * It will append it to the body and move it around as the mouse moves.
   *
   * @param {CatGridItemConfig} config - the configuration of the element dragged.
   * @param {MouseEvent} e - mouse event which started the drag.
   * @param {HTMLElement} node - the node of the element being dragged (used for copying it to the body).
   */
  startDrag(config: CatGridItemConfig, e: MouseEvent, node: HTMLElement | null) {
    this.dragConfig = config;

    if (node !== null && !!e) {
      this.dragNode = node.cloneNode(true) as HTMLElement;
      this.dragNode.style.transform = '';
      this.dragNode.style.pointerEvents = 'none';
      this.dragNode.style.position = 'fixed';
      this.dragNode.style.zIndex = '9999';

      let draggedRect = node.getBoundingClientRect();
      this.nodeConfig = {
        clientX: e.clientX,
        clientY: e.clientY,
        left: draggedRect.left,
        top: draggedRect.top,
      };

      if (!(draggedRect.left < e.clientX && e.clientX < draggedRect.right
        && draggedRect.top < e.clientY && e.clientY < draggedRect.bottom)) {
        // mouse position not inside of dragged element, would produce invalid drag offset
        // set to same position to get offsets=0
        this.nodeConfig.left = e.clientX;
        this.nodeConfig.top = e.clientY;
      }

      this.dragNode.style.top = this.nodeConfig.top + 'px';
      this.dragNode.style.left = this.nodeConfig.left + 'px';
      this.container.appendChild(this.dragNode);

      this.windowMouseMove$
        .pipe(filter(() => !!this.dragNode),
        takeUntil(merge(this.windowMouseUp$.pipe(), this.mouseUpInside$.asObservable())))
        .subscribe((event: MouseEvent) => this.dragNode.style.transform = `translate(
          ${event.clientX - this.nodeConfig.clientX}px,
          ${event.clientY - this.nodeConfig.clientY}px
        )`);

      this.windowMouseUp$.subscribe((event) => {
        if (this.dragConfig) {
          this.droppedOutside$.next({config: this.dragConfig, target: event.target});
        }
        this.itemDropped(null);
        this.stopDrag();
      });
    }
  }

  getDragOffset():DragOffset {
    if (!this.nodeConfig) {
      return {x:0, y:0};
    }
    return {
      x: (this.nodeConfig.clientX - this.nodeConfig.left),
      y: (this.nodeConfig.clientY - this.nodeConfig.top)
    };
  }

  mouseMoveInside(event: MouseEvent) {
    this.mouseMoveInside$.next(event);
  }

  mouseUpInside(event: MouseEvent) {
    this.mouseUpInside$.next(event);
  }

  /**
   * Clears the current dragging element and the configuration stored.
   */
  stopDrag() {
    this.container.innerHTML = '';
    this.dragConfig = null;
    this.dragNode = null;
  }

  itemDropped(item: CatGridItemConfig | null) {
    this.droppedItem$.next(item);
  }

  itemDroppedObservable() {
    return this.droppedItem$.asObservable();
  }

  droppedOutsideObservable() {
    return this.droppedOutside$.asObservable();
  }
}

export interface DragOffset {
  x:number,
  y:number
}
