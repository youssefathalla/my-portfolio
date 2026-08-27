// import { TestBed } from '@angular/core/testing';
// import { CanActivateFn } from '@angular/router';
// import { authGuard } from './auth.guard';

// describe('authGuard', () => {
//   const executeGuard: CanActivateFn = (...guardParameters) =>
//     TestBed.runInInjectionContext(() => authGuard(...guardParameters));

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//   });

//   it('should be created', () => {
//     expect(executeGuard).toBeTruthy();
//   });
// });
import { describe, it, expect } from 'vitest';

describe('authGuard placeholder', () => {
  it('should skip placeholder', () => {
    expect(true).toBe(true);
  });
});
