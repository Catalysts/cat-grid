import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {CatGridComponent} from './cat-grid/cat-grid.component';
import {CatGridDirective} from './cat-grid/cat-grid.directive';
import {CatGridPlaceholderComponent} from './cat-grid-placeholder/cat-grid-placeholder.component';
import {CatGridDraggableDragulaDirective} from './cat-grid/cat-grid-draggable-dragula.directive';
import {CatGridItemComponent} from './cat-grid-item/cat-grid-item.component';
import {CatGridDragService} from './cat-grid-drag.service';
import {CatGridValidationService} from './cat-grid-validation.service';
import {DragulaModule} from 'ng2-dragula/ng2-dragula';
import {CatGridDraggableDirective} from "./cat-grid/cat-grid-draggable.directive";

@NgModule({
  declarations: [
    CatGridDirective,
    CatGridComponent,
    CatGridPlaceholderComponent,
    CatGridDraggableDragulaDirective,
    CatGridDraggableDirective,
    CatGridItemComponent,
  ],
  entryComponents: [CatGridPlaceholderComponent],
  imports: [
    BrowserModule,
    DragulaModule,
  ],
  exports: [
    CatGridDirective,
    CatGridComponent,
    CatGridPlaceholderComponent,
    CatGridDraggableDragulaDirective,
    CatGridDraggableDirective,
    CatGridItemComponent,
    DragulaModule
  ],
  providers: [
    CatGridDragService,
    CatGridValidationService
  ],
})
export class CatGridModule {
}
