import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { StatusConfig } from './status.model';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent<string>>;
  let component: StatusBadgeComponent<string>;

  const statusConfig: Record<string, StatusConfig> = {
    active: { color: 'green', icon: 'check_circle' },
    pending: { color: 'yellow', icon: 'schedule', label: 'Awaiting review' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent<string>);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('value', 'active');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('resolves color and icon from the matching statusConfig entry', () => {
    fixture.componentRef.setInput('value', 'active');
    fixture.componentRef.setInput('statusConfig', statusConfig);
    fixture.detectChanges();

    expect(component.visualConfig()).toEqual({
      label: undefined,
      icon: 'check_circle',
      color: 'green',
    });
  });

  it('falls back to color "primary" when the value has no matching config entry', () => {
    fixture.componentRef.setInput('value', 'unknown-status');
    fixture.componentRef.setInput('statusConfig', statusConfig);
    fixture.detectChanges();

    expect(component.visualConfig().color).toBe('primary');
    expect(component.visualConfig().icon).toBeUndefined();
  });

  it('matches status keys case-insensitively', () => {
    fixture.componentRef.setInput('value', 'ACTIVE');
    fixture.componentRef.setInput('statusConfig', statusConfig);
    fixture.detectChanges();

    expect(component.visualConfig().color).toBe('green');
  });

  it('prioritizes an explicit icon input over the config icon', () => {
    fixture.componentRef.setInput('value', 'active');
    fixture.componentRef.setInput('statusConfig', statusConfig);
    fixture.componentRef.setInput('icon', 'override_icon');
    fixture.detectChanges();

    expect(component.visualConfig().icon).toBe('override_icon');
    // Color still comes from the config since there's no color override input.
    expect(component.visualConfig().color).toBe('green');
  });

  it('surfaces an explicit label override from the config', () => {
    fixture.componentRef.setInput('value', 'pending');
    fixture.componentRef.setInput('statusConfig', statusConfig);
    fixture.detectChanges();

    expect(component.visualConfig().label).toBe('Awaiting review');
  });
});
