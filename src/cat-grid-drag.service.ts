import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { CatGridItemConfig } from './cat-grid-item/cat-grid-item.config';
import { Subject } from 'rxjs/Subject';

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
    this.windowMouseMove$ = Observable.fromEvent(window, 'mousemove').merge(this.mouseMoveInside$.asObservable());
    this.windowMouseUp$ = Observable.fromEvent(window, 'mouseup');
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

    if (node !== null) {
      this.dragNode = node.cloneNode(true) as HTMLElement;
      this.dragNode.style.transform = '';
      this.dragNode.style.pointerEvents = 'none';
      this.dragNode.style.position = 'fixed';
      this.dragNode.style.zIndex = '9999';

      this.nodeConfig = {
        clientX: e.clientX,
        clientY: e.clientY,
        left: node.getBoundingClientRect().left,
        top: node.getBoundingClientRect().top,
      };

      this.dragNode.style.top = this.nodeConfig.top + 'px';
      this.dragNode.style.left = this.nodeConfig.left + 'px';
      this.container.appendChild(this.dragNode);

      this.windowMouseMove$
        .filter(() => !!this.dragNode)
        .takeUntil(this.windowMouseUp$.merge(this.mouseUpInside$.asObservable()))
        .subscribe((event: MouseEvent) => this.dragNode.style.transform = `translate(
          ${event.clientX - this.nodeConfig.clientX}px,
          ${event.clientY - this.nodeConfig.clientY}px
        )`);

      this.windowMouseUp$.subscribe(() => {
        this.itemDropped(null);
        this.stopDrag();
      });
    }
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
}
