import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChainIconComponent } from './chain-icon.component';

describe('ChainIconComponent', () => {
  let component: ChainIconComponent;
  let fixture: ComponentFixture<ChainIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChainIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChainIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
