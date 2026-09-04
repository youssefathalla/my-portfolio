import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

import { PlaygroundComponent } from './playground.component';

describe('PlaygroundComponent', () => {
  let component: PlaygroundComponent;
  let fixture: ComponentFixture<PlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaygroundComponent],
      providers: [provideRouter([]), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have "colors" as the default active tab', () => {
    expect(component['activeTab']()).toBe('colors');
  });
});
