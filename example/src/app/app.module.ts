import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CatGridModule } from '../../../lib';

@NgModule({
  imports: [BrowserModule, CatGridModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
}
