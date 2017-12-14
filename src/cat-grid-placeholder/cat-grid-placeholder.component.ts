import { ChangeDetectionStrategy, Component, ElementRef, Renderer2 } from '@angular/core';

/**
 * Angular component to be used as the 'placeholder' which shows up below the dragged element.
 * It has a position, size and validity. Each of those are set according to each grid.
 * All methods are accessed directly by the parent CatGridComponent for a more efficient usage.
 * The classes for styling it are:
 * `.grid-placeholder` - used when the placeholder is valid (default state)
 * `.grid-placeholder-invalid` - used when the placeholder is invalid (as set in the setValid method)
 */
@Component({
  selector: 'cat-grid-placeholder',
  template: ``,
  styles: [`
    :host {
      position: absolute;
      pointer-events: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
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

