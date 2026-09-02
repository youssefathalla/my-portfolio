import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LOCALE } from '@core/i18n/locale';
import { LangService } from '@core/i18n/services/lang.service';
import { PublicShellComponent } from './public-shell.component';

describe('PublicShellComponent', () => {
  let component: PublicShellComponent;
  let fixture: ComponentFixture<PublicShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicShellComponent],
      providers: [
        provideRouter([]),
        { provide: LOCALE, useValue: 'en' },
        LangService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the public shell component', () => {
    expect(component).toBeTruthy();
  });

  it('should render site-nav, main content, and site-footer', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-site-nav')).toBeTruthy();
    expect(el.querySelector('main#main-content')).toBeTruthy();
    expect(el.querySelector('app-site-footer')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
