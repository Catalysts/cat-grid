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
    height: number
  };

  public constructor() {
    this.windowMouseMove$ = Observable.fromEvent(window, 'mousemove');
    this.windowMouseUp$ = Observable.fromEvent(window, 'mouseup').do(() => this.stopDrag());
  }

  public startDrag(config: CatGridItemConfig, e: MouseEvent, node: HTMLElement | null) {
    this.dragConfig = config;
    this.dragNode = node;

    if (this.dragNode !== null) {
      this.nodeConfig = {
        clientX: e.clientX,
        clientY: e.clientY,
        width: this.dragNode.getBoundingClientRect().width,
        height: this.dragNode.getBoundingClientRect().height,
      };

      this.dragNode.style.pointerEvents = 'none';
      this.dragNode.style.position = 'fixed';
      this.dragNode.style.top = (e.clientY - this.nodeConfig.height) + 'px';
      this.dragNode.style.left = (e.clientX - this.nodeConfig.width) + 'px';
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

    console.log(this.dragNode);
  }

  public stopDrag() {
    if (!!this.dragNode) {
      document.body.removeChild(this.dragNode);
    }

    this.dragConfig = null;
    this.dragNode = null;
  }
}
