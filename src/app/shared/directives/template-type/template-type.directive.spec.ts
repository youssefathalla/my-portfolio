import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateTypeDirective } from './template-type.directive';

@Component({
  template: `
    <ng-template [templateType]="testData" let-data>
      <div>{{ data }}</div>
    </ng-template>
  `,
  imports: [TemplateTypeDirective],
})
class HostComponent {
  testData = 'test';
}

describe('TemplateTypeDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have ngTemplateContextGuard defined', () => {
    expect(TemplateTypeDirective.ngTemplateContextGuard).toBeDefined();
  });

  it('should return true from ngTemplateContextGuard', () => {
    const result = TemplateTypeDirective.ngTemplateContextGuard({} as TemplateTypeDirective<unknown>, {});
    expect(result).toBe(true);
  });
});
