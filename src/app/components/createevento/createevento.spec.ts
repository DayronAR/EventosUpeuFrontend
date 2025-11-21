import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Createevento } from './createevento';

describe('Createevento', () => {
  let component: Createevento;
  let fixture: ComponentFixture<Createevento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Createevento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Createevento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
