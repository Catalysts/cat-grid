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

  nodeConfig: {
    clientX: number,
    clientY: number,
    width: number,
    height: number,
    left: number,
    top: number,
  };

  public constructor() {
    this.windowMouseMove$ = Observable.fromEvent(window, 'mousemove');
    this.windowMouseUp$ = Observable.fromEvent(window, 'mouseup').do(() => this.stopDrag());
  }

  public startDrag(config: CatGridItemConfig, e: MouseEvent, node: HTMLElement | null) {
    this.dragConfig = config;
    this.dragNode = node.cloneNode(true) as HTMLElement;

    if (this.dragNode !== null) {

      this.dragNode.style.transform = '';
      this.dragNode.style.pointerEvents = 'none';
      this.dragNode.style.position = 'fixed';

      this.nodeConfig = {
        clientX: e.clientX,
        clientY: e.clientY,
        width: node.getBoundingClientRect().width,
        height: node.getBoundingClientRect().height,
        left: node.getBoundingClientRect().left,
        top: node.getBoundingClientRect().top,
      };

      this.dragNode.style.top = (this.nodeConfig.top) + 'px';
      this.dragNode.style.left = (this.nodeConfig.left) + 'px';
      document.body.appendChild(this.dragNode);
    }

    this.windowMouseMove$
      .filter(() => !!this.dragNode)
      .takeUntil(this.windowMouseUp$)
      .subscribe((event: MouseEvent) => {
        this.dragNode.style.webkitTransform = `translate(
          ${event.clientX - this.nodeConfig.clientX}px,
          ${event.clientY - this.nodeConfig.clientY}px
        )`;
      });
  }

  public stopDrag() {
    if (!!this.dragNode) {
      document.body.removeChild(this.dragNode);
    }

    this.dragConfig = null;
    this.dragNode = null;
  }
}
