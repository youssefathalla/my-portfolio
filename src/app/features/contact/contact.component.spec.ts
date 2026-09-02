import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { LOCALE } from '@core/i18n/locale';
import { ContactSubmissionService, type SubmitOutcome } from '@core/services/contact/contact-submission.service';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;
  let mockContactService: { submit: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockContactService = {
      submit: vi.fn().mockReturnValue(of({ kind: 'success' } as SubmitOutcome)),
    };

    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([], withComponentInputBinding()),
        { provide: LOCALE, useValue: 'en' },
        { provide: ContactSubmissionService, useValue: mockContactService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit enquiry and show success message', async () => {
    component['name'].set('Alice');
    component['email'].set('alice@example.com');
    component['message'].set('Need a turnkey Angular project');

    await component['submitEnquiry']();

    expect(mockContactService.submit).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      projectType: 'turnkey',
      message: 'Need a turnkey Angular project',
    });
    expect(component['submitSuccess']()).toBe(true);
    expect(component['name']()).toBe('');
  });

  it('should handle submission error without crashing', async () => {
    mockContactService.submit.mockReturnValue(of({ kind: 'network-error' } as SubmitOutcome));

    component['name'].set('Bob');
    component['email'].set('bob@example.com');
    component['message'].set('Audit request');

    await component['submitEnquiry']();

    expect(component['submitSuccess']()).toBe(false);
    expect(component['submitError']()).toBe(true);
  });
});

