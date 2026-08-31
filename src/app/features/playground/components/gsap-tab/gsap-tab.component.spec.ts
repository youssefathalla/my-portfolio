import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GsapTabComponent } from './gsap-tab.component';

describe('GsapTabComponent', () => {
  let component: GsapTabComponent;
  let fixture: ComponentFixture<GsapTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsapTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GsapTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
