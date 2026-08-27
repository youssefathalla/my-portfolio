import './test-setup';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
// import { Auth } from '@angular/fire/auth';
// import { Firestore } from '@angular/fire/firestore';
// import { Functions } from '@angular/fire/functions';

const testProviders: (Provider | EnvironmentProviders)[] = [
  // { provide: Auth, useValue: {} },
  // { provide: Firestore, useValue: {} }, // Mocking Firestore
  // { provide: Functions, useValue: {} }, // Mocking Functions
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(),
];
export default testProviders;
