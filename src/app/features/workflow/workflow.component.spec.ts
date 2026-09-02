import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { LOCALE } from '@core/i18n/locale';
import { WorkflowComponent } from './workflow.component';

describe('WorkflowComponent', () => {
  let component: WorkflowComponent;
  let fixture: ComponentFixture<WorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
