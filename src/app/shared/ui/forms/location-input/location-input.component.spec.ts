import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationInputComponent } from './location-input.component';
import { GoogleMapsLoaderService } from '@core/services/maps/google-maps-loader.service';
import { vi } from 'vitest';
import { signal, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { form } from '@angular/forms/signals';

describe('LocationInputComponent', () => {
  let component: LocationInputComponent;
  let fixture: ComponentFixture<LocationInputComponent>;

  beforeEach(async () => {
    const mockMapsService = {
      load: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LocationInputComponent],
      providers: [{ provide: GoogleMapsLoaderService, useValue: mockMapsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationInputComponent);
    component = fixture.componentInstance;

    // Create a real form signal to ensure all metadata is present
    const injector = TestBed.inject(EnvironmentInjector);
    const myForm = runInInjectionContext(injector, () => form(signal({ location: '' })));
    const locationField = myForm.location; // This is a proper FieldTree node

    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('formField', locationField);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
