import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { LOCALE } from '@core/i18n/locale';
import { EnterpriseAugmentationComponent } from './enterprise-augmentation.component';

describe('EnterpriseAugmentationComponent', () => {
  let component: EnterpriseAugmentationComponent;
  let fixture: ComponentFixture<EnterpriseAugmentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterpriseAugmentationComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterpriseAugmentationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
