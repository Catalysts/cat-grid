import { NgModule } from '@angular/core';
import { CatGridComponent } from './cat-grid/cat-grid.component';
import { CatGridPlaceholderComponent } from './cat-grid-placeholder/cat-grid-placeholder.component';
import { CatGridDraggableDragulaDirective } from './cat-grid/cat-grid-draggable-dragula.directive';
import { CatGridItemComponent } from './cat-grid-item/cat-grid-item.component';
import { DragulaModule } from 'ng2-dragula';
import { CatGridDraggableDirective } from './cat-grid/cat-grid-draggable.directive';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    CatGridComponent,
    CatGridPlaceholderComponent,
    CatGridDraggableDragulaDirective,
    CatGridDraggableDirective,
    CatGridItemComponent,
  ],
  entryComponents: [CatGridPlaceholderComponent],
  imports: [
    DragulaModule,
    CommonModule
  ],
  exports: [
    CatGridComponent,
    CatGridPlaceholderComponent,
    CatGridDraggableDragulaDirective,
    CatGridDraggableDirective,
    CatGridItemComponent,
    DragulaModule
  ],
  providers: [],
})
export class CatGridModule {
}
