import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'cat-grid-placeholder',
  template: `
    <div [style.display]="hidden"></div>`,
})
export class CatGridPlaceholderComponent {
  hidden = true;
  sizex: number;
  sizey: number;
  col: number;
  row: number;
  ngGridDirective: any;

  @HostBinding('style.position')
  get p() {
    return 'absolute';
  }

  @HostBinding('style.pointer-events')
  get c() {
    return 'none';
  }

  @HostBinding('style.width')
  width: string;

  @HostBinding('style.height')
  height: string;

  @HostBinding('style.left')
  left: string;

  @HostBinding('style.top')
  top: string;

  @HostBinding('class.grid-placeholder-invalid')
  get invalidPlaceholder() {
    return !this.valid;
  }

  @HostBinding('class.grid-placeholder')
  get validPlaceholder() {
    return this.valid;
  }

  valid = true;

  registerGrid(ngGrid: any) {
    this.ngGridDirective = ngGrid;
  }

  setSize(x: number, y: number): void {
    this.sizex = x;
    this.sizey = y;
    this.recalculateDimensions();
  }

  setGridPosition(col: number, row: number): void {
    this.col = col;
    this.row = row;
    this.recalculatePosition();
  }

  recalculatePosition(): void {
    this.left = this.ngGridDirective.pagePosition.pageX
      + (this.ngGridDirective.colWidth + this.ngGridDirective.marginLeft + this.ngGridDirective.marginRight) * (this.col - 1)
      + this.ngGridDirective.marginLeft
      + 'px';
    this.top = this.ngGridDirective.pagePosition.pageY
      + (this.ngGridDirective.rowHeight + this.ngGridDirective.marginTop + this.ngGridDirective.marginBottom) * (this.row - 1)
      + this.ngGridDirective.marginTop
      + 'px';
  }

  recalculateDimensions(): void {
    this.width = (this.ngGridDirective.colWidth * this.sizex)
      + ((this.ngGridDirective.marginLeft + this.ngGridDirective.marginRight) * (this.sizex - 1))
      + 'px';
    this.height = (this.ngGridDirective.rowHeight * this.sizey)
      + ((this.ngGridDirective.marginTop + this.ngGridDirective.marginBottom) * (this.sizey - 1))
      + 'px';
  }

  hide(): void {
    this.hidden = true;
  }
}
