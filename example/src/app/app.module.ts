import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CatGridModule } from './lib/src/cat-grid.module';
import { CatGridDragService } from './lib/src/cat-grid-drag.service';
import { CatGridValidationService } from './lib/src/cat-grid-validation.service';
import { TestComponent } from './test.component';
import { ContainerComponent } from './container.component';

@NgModule({
  imports: [BrowserModule, CatGridModule],
  declarations: [AppComponent, TestComponent, ContainerComponent],
  entryComponents: [TestComponent, ContainerComponent],
  providers: [CatGridDragService, CatGridValidationService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
