import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { CatGridItemConfig } from './cat-grid-item/cat-grid-item.config';

export interface ItemDragEvent {
  item: CatGridItemConfig;
  event: MouseEvent;
}

@Injectable()
export class CatGridDragService {
  windowMouseMove$: Observable<MouseEvent>;
  windowMouseUp$: Observable<MouseEvent>;

  dragConfig: CatGridItemConfig | null = null;
  dragNode: HTMLElement | null = null;

  public constructor() {
    this.windowMouseMove$ = Observable.fromEvent(window, 'mousemove');
    this.windowMouseUp$ = Observable.fromEvent(window, 'mouseup');
  }

  public startDrag(config: CatGridItemConfig, node: HTMLElement | null) {
    this.dragConfig = config;
    this.dragNode = node;

    if (this.dragNode !== null) {
      this.dragNode.style.pointerEvents = 'none';
      this.dragNode.style.position = 'fixed';
      document.body.appendChild(this.dragNode);
    }

    this.windowMouseMove$
      .filter(() => !!this.dragNode)
      .takeUntil(this.windowMouseUp$)
      .subscribe((event: MouseEvent) => {
        this.dragNode.style.webkitTransform = `translate(${event.pageX}px, ${event.pageY}px)`;
      });
  }

  public stopDrag() {
    if (this.dragNode !== null) {
      document.body.removeChild(this.dragNode);
    }

    this.dragConfig = null;
    this.dragNode = null;
  }
}
