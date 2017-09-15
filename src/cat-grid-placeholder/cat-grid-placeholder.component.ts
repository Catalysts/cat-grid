import { Component, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'cat-grid-placeholder',
  template: ``,
  styles: [`
    :host {
      position: absolute;
      pointer-events: none;
    }
  `]
})
export class CatGridPlaceholderComponent {
  width: number;
  height: number;
  x: number;
  y: number;

  constructor(private renderer2: Renderer2,
              private elementRef: ElementRef) {
  }

  show() {
    this.setStyle('display', 'inline-block');
  }

  hide() {
    this.setStyle('display', 'none');
  }

  setValid(valid: boolean) {
    if (valid) {
      this.renderer2.removeClass(this.elementRef.nativeElement, 'grid-placeholder-invalid');
    } else {
      this.renderer2.addClass(this.elementRef.nativeElement, 'grid-placeholder-invalid');
    }
  }

  setSize(width: number, height: number) {
    if (this.width !== width) {
      this.setStyle('width', `${width}px`);
      this.width = width;
    }
    if (this.height !== height) {
      this.setStyle('height', `${height}px`);
      this.height = height;
    }
  }

  setPosition(x: number = this.x, y: number = this.y) {
    if (this.x !== x || this.y !== y) {
      this.setStyle('transform', `translate(${x}px, ${y}px)`);
      this.x = x;
      this.y = y;
    }
  }

  setStyle(style: string, value: string) {
    this.renderer2.setStyle(this.elementRef.nativeElement, style, value);
  }
}

