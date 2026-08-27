import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SnackbarService } from './snack-bar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let snackBarMock: { open: unknown };

  beforeEach(() => {
    snackBarMock = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [SnackbarService, { provide: MatSnackBar, useValue: snackBarMock }],
    });

    service = TestBed.inject(SnackbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call open with success config when success is called', () => {
    service.success('Success message');
    expect(snackBarMock.open).toHaveBeenCalledWith('Success message', 'Close', {
      panelClass: ['success-snackbar'],
      duration: 3000,
    });
  });

  it('should call open with error config when error is called', () => {
    service.error('Error message');
    expect(snackBarMock.open).toHaveBeenCalledWith('Error message', 'Close', {
      panelClass: ['error-snackbar'],
      duration: 5000,
    });
  });

  it('should call open with warning config when warning is called', () => {
    service.warning('Warning message');
    expect(snackBarMock.open).toHaveBeenCalledWith('Warning message', 'Close', {
      panelClass: ['warning-snackbar'],
      duration: 4000,
    });
  });

  it('should call open with info config when info is called', () => {
    service.info('Info message');
    expect(snackBarMock.open).toHaveBeenCalledWith('Info message', 'Close', {
      panelClass: ['info-snackbar'],
      duration: 3000,
    });
  });

  it('should allow custom action and duration', () => {
    service.success('Custom', 'OK', 1000);
    expect(snackBarMock.open).toHaveBeenCalledWith('Custom', 'OK', {
      panelClass: ['success-snackbar'],
      duration: 1000,
    });
  });
});
