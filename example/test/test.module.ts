import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TestComponent} from './test.component';
import {NgGridWrapper} from './NgGridWrapper';
import {ItemTestComponent} from './TestComponent';
import {CatGridModule} from '../../src/cat-grid.module';
import {DragulaModule} from 'ng2-dragula/ng2-dragula';

@NgModule({
  imports: [
    CommonModule,
    CatGridModule,
    DragulaModule
  ],
  entryComponents: [ItemTestComponent, NgGridWrapper],
  declarations: [TestComponent, NgGridWrapper, ItemTestComponent],
  exports: [TestComponent],
  bootstrap: [TestComponent]
})
export class TestModule {
}
