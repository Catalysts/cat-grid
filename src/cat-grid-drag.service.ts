import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { CatGridItemConfig } from './cat-grid-item/cat-grid-item.config';

export interface ItemDragEvent {
  item: CatGridItemConfig;
  event: MouseEvent;
}

@Injectable()
export class CatGridDragService {
  private windowMouseMove$: Observable<any>;
  private windowMouseUp$: Observable<any>;

  private dragging$ = new Subject<ItemDragEvent>();
  private drop$ = new Subject<ItemDragEvent>();

  public posOffset: any = {};

  dragConfig: CatGridItemConfig | null = null;
  dragNode: HTMLElement | null = null;

  public static equalScreenPosition(e1: any, e2: any): boolean {
    return e1 && e2 && e1.screenX === e2.screenX && e1.screenY === e2.screenY;
  }

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
    this.dragConfig = null;
    this.dragNode = null;

    if (this.dragNode !== null) {
      document.body.removeChild(this.dragNode);
    }
  }

  public draggingObservable(): Observable<ItemDragEvent> {
    return this.dragging$.asObservable();
  }

  public dropObservable(): Observable<ItemDragEvent> {
    return this.drop$.asObservable();
  }

  public addDraggingSource(dragSource$: Observable<ItemDragEvent>, dropSource$: Observable<ItemDragEvent>) {
    dragSource$.subscribe(e => this.dragging$.next(e));
    dropSource$.subscribe(e => this.drop$.next(e));
  }
}
