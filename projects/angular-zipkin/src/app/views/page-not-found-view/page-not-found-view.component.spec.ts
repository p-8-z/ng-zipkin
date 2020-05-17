import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PageNotFoundViewComponent} from './page-not-found-view.component';

describe('PageNotFoundViewComponent', () => {
  let component: PageNotFoundViewComponent;
  let fixture: ComponentFixture<PageNotFoundViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PageNotFoundViewComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
