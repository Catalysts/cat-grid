/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CatGridComponent } from './cat-grid.component';

describe('CatGridComponent', () => {
  let component: CatGridComponent;
  let fixture: ComponentFixture<CatGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CatGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CatGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
