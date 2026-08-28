import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HorizontalScrollDirective } from './horizontal-scroll.directive';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

@Component({
  imports: [HorizontalScrollDirective],
  template: `
    <div
      appHorizontalScroll
      style="width: 200px; overflow-x: auto; display: flex;"
      data-testid="scroll-container"
    >
      <div style="min-width: 500px;">Long Content</div>
      <button data-testid="test-btn" (click)="onBtnClick()">Click Me</button>
    </div>
  `,
})
class TestHostComponent {
  btnClicked = false;
  onBtnClick() {
    this.btnClicked = true;
  }
}

describe('HorizontalScrollDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let containerEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    containerEl = fixture.nativeElement.querySelector('[data-testid="scroll-container"]');

    // jsdom scrollBy polyfill
    if (!containerEl.scrollBy) {
      containerEl.scrollBy = function (options?: ScrollToOptions | number, _y?: number) {
        if (typeof options === 'object') {
          this.scrollLeft += options.left ?? 0;
        } else if (typeof options === 'number') {
          this.scrollLeft += options;
        }
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the directive on host element', () => {
    expect(containerEl).toBeTruthy();
    expect(containerEl.classList.contains('cursor-grab')).toBe(true);
  });

  it('should scroll horizontally on vertical mouse wheel event', () => {
    // Mock scrollWidth and clientWidth
    Object.defineProperty(containerEl, 'scrollWidth', { value: 500, configurable: true });
    Object.defineProperty(containerEl, 'clientWidth', { value: 200, configurable: true });
    containerEl.scrollLeft = 0;

    const scrollBySpy = vi.spyOn(containerEl, 'scrollBy');

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 50,
      deltaX: 0,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');

    containerEl.dispatchEvent(wheelEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(scrollBySpy).toHaveBeenCalled();
    expect(containerEl.scrollLeft).toBeGreaterThan(0);
  });

  it('should handle mouse drag-to-scroll and suppress click on drag', () => {
    Object.defineProperty(containerEl, 'scrollWidth', { value: 500, configurable: true });
    Object.defineProperty(containerEl, 'clientWidth', { value: 200, configurable: true });
    containerEl.scrollLeft = 100;

    // Mouse down
    const mouseDownEvent = new MouseEvent('mousedown', {
      button: 0,
      clientX: 200,
    });
    containerEl.dispatchEvent(mouseDownEvent);

    // Mouse move on window (dragging 50px to the left)
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(mouseMoveEvent);
    fixture.detectChanges();

    expect(containerEl.classList.contains('cursor-grabbing')).toBe(true);
    expect(containerEl.scrollLeft).toBe(150);

    // Mouse up on window
    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });
    window.dispatchEvent(mouseUpEvent);
    fixture.detectChanges();

    // Click on button should be suppressed
    const btn = fixture.nativeElement.querySelector('[data-testid="test-btn"]') as HTMLButtonElement;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.dispatchEvent(clickEvent);

    expect(component.btnClicked).toBe(false);
  });

  it('should allow normal button clicks without drag', () => {
    const btn = fixture.nativeElement.querySelector('[data-testid="test-btn"]') as HTMLButtonElement;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.dispatchEvent(clickEvent);
    expect(component.btnClicked).toBe(true);
  });
});
