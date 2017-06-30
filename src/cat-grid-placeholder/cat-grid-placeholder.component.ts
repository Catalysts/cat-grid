import {Component, HostBinding} from '@angular/core';
import {CatGridDirective} from '../cat-grid/cat-grid.directive';

@Component({
  selector: 'cat-grid-placeholder',
  template: `<div [style.display]="hidden"></div>`,
})
export class CatGridPlaceholderComponent {
  private hidden: boolean = true;
  private sizex: number;
  private sizey: number;
  private col: number;
  private row: number;
  private ngGridDirective: CatGridDirective;

  @HostBinding('style.position') get p() {
    return 'absolute';
  }

  @HostBinding('style.pointer-events') get c() {
    return 'none';
  }

  @HostBinding('style.width')
  private width: string;

  @HostBinding('style.height')
  private height: string;

  @HostBinding('style.left')
  private left: string;

  @HostBinding('style.top')
  private top: string;

  @HostBinding('class.grid-placeholder-invalid') get invalidPlaceholder() {
    return !this.valid;
  }

  @HostBinding('class.grid-placeholder') get validPlaceholder() {
    return this.valid;
  }

  public valid: boolean = true;

  public registerGrid(ngGrid: CatGridDirective) {
    this.ngGridDirective = ngGrid;
  }

  public setSize(x: number, y: number): void {
    this.sizex = x;
    this.sizey = y;
    this.recalculateDimensions();
  }

  public setGridPosition(col: number, row: number): void {
    this.col = col;
    this.row = row;
    this.recalculatePosition();
  }

  private recalculatePosition(): void {
    this.left = this.ngGridDirective.pagePosition.pageX
      + (this.ngGridDirective.colWidth + this.ngGridDirective.marginLeft + this.ngGridDirective.marginRight) * (this.col - 1)
      + this.ngGridDirective.marginLeft
      + 'px';
    this.top = this.ngGridDirective.pagePosition.pageY
      + (this.ngGridDirective.rowHeight + this.ngGridDirective.marginTop + this.ngGridDirective.marginBottom) * (this.row - 1)
      + this.ngGridDirective.marginTop
      + 'px';
  }

  private recalculateDimensions(): void {
    this.width = (this.ngGridDirective.colWidth * this.sizex)
      + ((this.ngGridDirective.marginLeft + this.ngGridDirective.marginRight) * (this.sizex - 1))
      + 'px';
    this.height = (this.ngGridDirective.rowHeight * this.sizey)
      + ((this.ngGridDirective.marginTop + this.ngGridDirective.marginBottom) * (this.sizey - 1))
      + 'px';
  }

  public hide(): void {
    this.hidden = true;
  }
}
