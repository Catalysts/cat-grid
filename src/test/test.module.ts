import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestComponent } from './test.component';
import {NgGridWrapper} from './NgGridWrapper';
import {ItemTestComponent} from './TestComponent';
import {CatGridModule} from '../lib/cat-grid.module';

@NgModule({
  imports: [
    CommonModule,
    CatGridModule
  ],
  entryComponents: [ItemTestComponent, NgGridWrapper],
  declarations: [TestComponent, NgGridWrapper, ItemTestComponent],
  exports: [TestComponent],
  bootstrap: [TestComponent]
})
export class TestModule { }
