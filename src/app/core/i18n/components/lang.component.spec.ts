import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LangService } from '../services/lang.service';
import { LangComponent } from './lang.component';
import { signal } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';

describe('LangComponent', () => {
  let component: LangComponent;
  let fixture: ComponentFixture<LangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LangComponent],
      providers: [
        {
          provide: LangService,
          useValue: {
            currentLang: signal('en'),
            setLanguage: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LangComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
