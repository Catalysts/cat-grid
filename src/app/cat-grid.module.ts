import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {CatGridComponent} from './cat-grid/cat-grid.component';
import {CatGridDirective} from './cat-grid/cat-grid.directive';
import {CatGridPlaceholderComponent} from './cat-grid-placeholder/cat-grid-placeholder.component';
import {CatGridDraggableDirective} from './cat-grid/cat-grid-draggable.directive';
import {CatGridItemComponent} from './cat-grid-item/cat-grid-item.component';
import {CatGridDragService} from './cat-grid-drag.service';
import {CatGridValidationService} from './cat-grid-validation.service';

@NgModule({
  declarations: [
    CatGridDirective,
    CatGridComponent,
    CatGridPlaceholderComponent,
    CatGridDraggableDirective,
    CatGridItemComponent
  ],
  entryComponents: [CatGridPlaceholderComponent],
  imports: [
    BrowserModule
  ],
  exports: [
    CatGridDirective,
    CatGridComponent,
    CatGridPlaceholderComponent,
    CatGridDraggableDirective,
    CatGridItemComponent
  ],
  providers: [
    CatGridDragService,
    CatGridValidationService
  ],
})
export class CatGridModule {
}
