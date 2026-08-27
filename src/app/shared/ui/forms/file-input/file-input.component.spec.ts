import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileInputComponent } from './file-input.component';

function createFile(name: string, sizeBytes: number, type: string): File {
  const file = new File([new Uint8Array(sizeBytes)], name, { type });
  return file;
}

describe('FileInputComponent', () => {
  let component: FileInputComponent;
  let fixture: ComponentFixture<FileInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileInputComponent);
    component = fixture.componentInstance;

    const injector = TestBed.inject(EnvironmentInjector);
    const myForm = runInInjectionContext(injector, () => form(signal({ file: null as File | null })));

    fixture.componentRef.setInput('label', 'Avatar');
    fixture.componentRef.setInput('formField', myForm.file);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects a file over the configured maxSizeBytes and does not emit fileSelected', () => {
    fixture.componentRef.setInput('maxSizeBytes', 2 * 1024 * 1024); // 2MB
    fixture.detectChanges();

    let emitted: File | undefined;
    component.fileSelected.subscribe((file) => (emitted = file));

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const oversized = createFile('big.png', 3 * 1024 * 1024, 'image/png');
    Object.defineProperty(input, 'files', { value: [oversized], configurable: true });
    input.dispatchEvent(new Event('change'));

    expect(emitted).toBeUndefined();
    expect(component['localError']()).toContain('2MB');
  });

  it('rejects a file whose MIME type is not in allowedMimeTypes', () => {
    fixture.componentRef.setInput('allowedMimeTypes', ['image/png']);
    fixture.detectChanges();

    let emitted: File | undefined;
    component.fileSelected.subscribe((file) => (emitted = file));

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const wrongType = createFile('doc.pdf', 100, 'application/pdf');
    Object.defineProperty(input, 'files', { value: [wrongType], configurable: true });
    input.dispatchEvent(new Event('change'));

    expect(emitted).toBeUndefined();
    expect(component['localError']()).toBe('Invalid file type.');
  });

  it('accepts a valid file, clears any previous error, and emits fileSelected', () => {
    let emitted: File | undefined;
    component.fileSelected.subscribe((file) => (emitted = file));

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const valid = createFile('avatar.png', 100, 'image/png');
    Object.defineProperty(input, 'files', { value: [valid], configurable: true });
    input.dispatchEvent(new Event('change'));

    expect(emitted).toBe(valid);
    expect(component['localError']()).toBeNull();
  });

  it('does not open the file picker when a file is already selected', () => {
    fixture.componentRef.setInput('previewUrl', 'https://example.com/fake-preview.png');
    fixture.detectChanges();

    const clickSpy = vi.spyOn(component.fileInput().nativeElement, 'click');
    component.triggerUpload();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('opens the file picker when no file is selected', () => {
    const clickSpy = vi.spyOn(component.fileInput().nativeElement, 'click');
    component.triggerUpload();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
