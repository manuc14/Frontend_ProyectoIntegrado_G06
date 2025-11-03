import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListActionButtonsComponent } from './list-action-buttons.component';

describe('ListActionButtonsComponent', () => {
  let component: ListActionButtonsComponent;
  let fixture: ComponentFixture<ListActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListActionButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
