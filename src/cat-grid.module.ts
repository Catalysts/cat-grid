import {NgModule} from "@angular/core";
import {CatGridComponent} from "./cat-grid/cat-grid.component";
import {CatGridDirective} from "./cat-grid/cat-grid.directive";
import {CatGridPlaceholderComponent} from "./cat-grid-placeholder/cat-grid-placeholder.component";
import {CatGridDraggableDragulaDirective} from "./cat-grid/cat-grid-draggable-dragula.directive";
import {CatGridItemComponent} from "./cat-grid-item/cat-grid-item.component";
import {DragulaModule} from "ng2-dragula";
import {CatGridDraggableDirective} from "./cat-grid/cat-grid-draggable.directive";
import {CommonModule} from "@angular/common";

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
    DragulaModule,
    CommonModule
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
  ],
})
export class CatGridModule {
}
