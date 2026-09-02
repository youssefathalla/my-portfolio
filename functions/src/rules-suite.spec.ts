/**
 * Firestore Security Rules test suite — Emulator_Suite integration tests.
 *
 * Initializes a test Firestore environment against the emulator ports declared
 * in firebase.json (Firestore: 8180) and validates Security_Rules enforcement.
 *
 * Requirements: R8.9
 */
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, beforeAll, afterAll, afterEach, it, expect } from 'vitest';

const PROJECT_ID = 'youssefathalla-portfolio';
const FIRESTORE_HOST = 'localhost';
const FIRESTORE_PORT = 8180;

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: FIRESTORE_HOST,
      port: FIRESTORE_PORT,
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules — Emulator Suite', () => {
  it('should initialize the test environment successfully', () => {
    expect(testEnv).toBeDefined();
  });

  it('should deny unauthenticated reads on submissions collection', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    const docRef = unauthed.firestore().collection('submissions').doc('test-doc');
    await assertFails(docRef.get());
  });

  it('should deny unauthenticated writes without App Check', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    const colRef = unauthed.firestore().collection('submissions');
    await assertFails(
      colRef.add({
        type: 'contact',
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
        read: false,
        payload: { name: 'Test', email: 'test@example.com', projectType: 'web', message: 'Hello' },
        notes: '',
        tags: [],
      })
    );
  });

  it('should deny a shape-valid create when the request carries no App Check token', async () => {
    // This document otherwise satisfies isValidCreate: exactly the 8 required
    // keys, `createdAt`/`updatedAt` stamped with the server-timestamp sentinel
    // (so it matches `request.time`, unlike the `new Date()` document in the
    // 'without App Check' test above, which fails shape validation regardless
    // of App Check state and therefore never reaches the App Check branch).
    //
    // @firebase/rules-unit-testing does not document support for attaching an
    // App Check token to a RulesTestContext, so `request.app.appId` resolves
    // to `null` for every context this library produces (authenticated or
    // not). That is exactly what this test exercises: an otherwise-valid
    // create is rejected specifically by the `request.app.appId != null`
    // condition added in firestore.rules, not by isValidCreate's shape checks.
    const unauthed = testEnv.unauthenticatedContext();
    const colRef = unauthed.firestore().collection('submissions');
    await assertFails(
      colRef.add({
        type: 'contact',
        status: 'new',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
        payload: { name: 'Test', email: 'test@example.com', projectType: 'web', message: 'Hello' },
        notes: '',
        tags: [],
      })
    );
  });
});
