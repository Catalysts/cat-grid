import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'cat-grid-placeholder',
  template: ``,
})
export class CatGridPlaceholderComponent {
  @Input() valid: boolean | null = null;

  @HostBinding('style.width.px')
  @Input()
  width: number;

  @HostBinding('style.height.px')
  @Input()
  height: number;

  @Input()
  left: number;

  @Input()
  top: number;

  @HostBinding('style.transform')
  get transform() {
    return `translate(${this.left}px, ${this.top}px)`;
  }

  @HostBinding('style.position')
  get p() {
    return 'absolute';
  }

  @HostBinding('style.pointer-events')
  get c() {
    return 'none';
  }

  @HostBinding('class.grid-placeholder-invalid')
  get invalidPlaceholder() {
    return this.valid === false;
  }

  @HostBinding('class.grid-placeholder')
  get validPlaceholder() {
    return this.valid === true;
  }

  @HostBinding('style.display')
  get display() {
    console.log(this.valid);
    return this.valid === null ? 'none' : 'inline-block';
  }
}
