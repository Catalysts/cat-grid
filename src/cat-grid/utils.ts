import {CatGridItemConfig} from '../cat-grid-item/cat-grid-item.config';

export interface Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function intersect(r1: Rectangle, r2: Rectangle): boolean {
  return !(r2.left > r1.right ||
  r2.right < r1.left ||
  r2.top > r1.bottom ||
  r2.bottom < r1.top);
}

export function toRectangle(conf: CatGridItemConfig): Rectangle {
  return {
    left: conf.col,
    top: conf.row,
    right: conf.col + conf.colSpan - 1,
    bottom: conf.row + conf.rowSpan - 1
  };
}
