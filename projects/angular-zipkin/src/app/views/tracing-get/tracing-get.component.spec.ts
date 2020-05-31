import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TracingGetComponent} from './tracing-get.component';

describe('TracingGetComponent', () => {
  let component: TracingGetComponent;
  let fixture: ComponentFixture<TracingGetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TracingGetComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TracingGetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
