// import { Injectable, inject, computed, effect, signal } from '@angular/core';
// import { Router } from '@angular/router';
// import { SnackbarService } from '@core/services/snack-bar/snack-bar.service';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { switchMap, from, of, firstValueFrom } from 'rxjs';
// import {
//   Auth,
//   user,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   reauthenticateWithCredential,
//   EmailAuthProvider,
//   verifyBeforeUpdateEmail,
//   updatePassword,
//   sendEmailVerification,
//   sendPasswordResetEmail,
//   UserCredential,
// } from '@angular/fire/auth';
// import { Functions, httpsCallable } from '@angular/fire/functions';
// import { runInContext } from '@shared/utils/injection.utils';
// import { UserProfileService } from '@core/services/user-profile/user-profile.service';
// import { AUTH_ERROR_MAPPINGS, DEFAULT_AUTH_ERROR } from './auth.errors';

// @Service()
// export class AuthService {
//   readonly #auth = inject(Auth);
//   readonly #functions = inject(Functions);
//   readonly #userProfileService = inject(UserProfileService);
//   readonly #router = inject(Router);
//   readonly #snackbarService = inject(SnackbarService);
//   readonly #run = runInContext();

//   readonly currentUser = toSignal(this.#run(() => user(this.#auth)));

//   /** Tracks the previous user value to distinguish "never logged in" from "just logged out". */
//   #previousUser: undefined | null | object = undefined;

//   /** Override for emailVerified — updated after reload() to reflect latest server state. */
//   readonly #emailVerifiedOverride = signal<boolean | null>(null);

//   /**
//    * Whether the current user's email is verified.
//    * Uses a server-reloaded override when available, falls back to the Firebase Auth token value.
//    */
//   readonly emailVerified = computed(() => {
//     const override = this.#emailVerifiedOverride();
//     if (override !== null) return override;
//     return this.currentUser()?.emailVerified ?? false;
//   });

//   constructor() {
//     effect(() => {
//       const currentUser = this.currentUser();

//       // Only redirect if the user WAS logged in (a real User object) and is NOW null (logged out).
//       // This prevents redirecting guests who were never logged in (undefined → null).
//       const wasLoggedIn = this.#previousUser !== undefined && this.#previousUser !== null;
//       const isNowLoggedOut = currentUser === null;

//       if (wasLoggedIn && isNowLoggedOut) {
//         this.#router.navigate(['/']);
//       }

//       // Always track the current value for the next run
//       this.#previousUser = currentUser;

//       // Reset the email-verified override whenever the user identity changes.
//       this.#emailVerifiedOverride.set(null);
//     });
//   }

//   // Observable for IdTokenResult to access claims
//   readonly #user$ = this.#run(() => user(this.#auth));

//   // Inlined the switchMap correctly into toSignal
//   readonly currentTokenResult = toSignal(
//     this.#user$.pipe(switchMap((u) => (u ? from(u.getIdTokenResult()) : of(null)))),
//   );

//   readonly isAuthenticated = computed(() => !!this.currentUser());

//   readonly isAuthenticating = computed(() => this.currentUser() === undefined);

//   // Computed signal to check if the user has the 'admin' custom claim
//   readonly isAdmin = computed(() => !!this.currentTokenResult()?.claims?.['admin']);

//   /** Resolves when Firebase Auth has finished its initial check. */
//   async waitForAuthReady(): Promise<void> {
//     if (this.currentUser() !== undefined) return;
//     await firstValueFrom(this.#user$);
//   }

//   /** Imperative check for admin role, guarantees fresh token result, ideal for guards. */
//   async checkIsAdmin(): Promise<boolean> {
//     const u = this.#auth.currentUser;
//     if (!u) return false;
//     const token = await this.#run(() => u.getIdTokenResult());
//     return !!token.claims?.['admin'];
//   }

//   /**
//    * Calls the Cloud Function to assign the admin role to a user.
//    * @param email The email of the user to promote
//    */
//   async grantAdminRole(email: string): Promise<{ message: string }> {
//     return this.#run(async () => {
//       const callable = httpsCallable<{ email: string }, { message: string }>(this.#functions, 'setAdminRole');
//       const result = await callable({ email });
//       return result.data;
//     });
//   }

//   /**
//    * Calls the Cloud Function to securely create a new admin account.
//    * @param email The email for the new admin account
//    * @param password The password for the new admin account
//    */
//   async createAdminAccount(email: string, password: string): Promise<{ message: string }> {
//     return this.#run(async () => {
//       const callable = httpsCallable<{ email: string; password: string }, { message: string }>(
//         this.#functions,
//         'createAdminAccount',
//       );
//       const result = await callable({ email, password });
//       return result.data;
//     });
//   }

//   /** Sends an email verification link to the currently signed-in user. */
//   async sendVerificationEmail(): Promise<void> {
//     const u = this.#auth.currentUser;
//     if (!u) throw new Error('No authenticated user');
//     await this.#run(() => sendEmailVerification(u));
//   }

//   /**
//    * Forces a reload of the current user from Firebase and returns whether their email is verified.
//    * Also updates the `emailVerified` signal so the UI reacts immediately.
//    */
//   async checkEmailVerification(): Promise<boolean> {
//     const u = this.#auth.currentUser;
//     if (!u) return false;
//     await this.#run(() => u.reload());
//     const verified = this.#auth.currentUser?.emailVerified ?? false;
//     this.#emailVerifiedOverride.set(verified);
//     return verified;
//   }

//   /**
//    * Register a new user with email/password and create their profile in Firestore.
//    * Automatically sends an email verification link after account creation.
//    *
//    * @param email - User's email address
//    * @param password - User's password
//    * @param fullName - User's full name
//    * @param phone - User's phone number
//    * @returns UserCredential from Firebase Auth
//    */
//   async register(email: string, password: string, fullName: string, phone: string): Promise<UserCredential> {
//     // Create Firebase Auth account
//     const userCredential = await this.#run(() => createUserWithEmailAndPassword(this.#auth, email, password));

//     // Create user profile in Firestore
//     await this.#userProfileService.createProfile(userCredential.user.uid, fullName, email, phone);

//     // Send email verification link
//     await this.#run(() => sendEmailVerification(userCredential.user));

//     return userCredential;
//   }

//   async login(email: string, password: string): Promise<UserCredential> {
//     const userCredential = await this.#run(() => signInWithEmailAndPassword(this.#auth, email, password));
//     this.#snackbarService.success('Logged in successfully.');
//     return userCredential;
//   }

//   async logout(): Promise<void> {
//     await this.#run(() => signOut(this.#auth));
//     this.#snackbarService.info('You have been signed out.');
//   }

//   async reauthenticate(password: string): Promise<void> {
//     const currentUser = this.#auth.currentUser;
//     if (!currentUser?.email) throw new Error('No authenticated user');
//     const credential = EmailAuthProvider.credential(currentUser.email, password);
//     await this.#run(() => reauthenticateWithCredential(currentUser, credential));
//   }

//   async updateUserEmail(newEmail: string, currentPassword: string): Promise<void> {
//     await this.reauthenticate(currentPassword);
//     const currentUser = this.#auth.currentUser;
//     if (!currentUser) throw new Error('No authenticated user');
//     await this.#run(() => verifyBeforeUpdateEmail(currentUser, newEmail));
//   }

//   async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
//     await this.reauthenticate(currentPassword);
//     const currentUser = this.#auth.currentUser;
//     if (!currentUser) throw new Error('No authenticated user');
//     await this.#run(() => updatePassword(currentUser, newPassword));
//   }

//   /**
//    * Sends a password reset email to the given address.
//    * Silently succeeds even if the email is not registered (security best practice).
//    *
//    * @param email - The email address to send the reset link to
//    */
//   async sendPasswordReset(email: string): Promise<void> {
//     await this.#run(() => sendPasswordResetEmail(this.#auth, email));
//   }

//   /**
//    * Maps Firebase Authentication error codes to user-friendly messages.
//    *
//    * @param error - Firebase AuthError object
//    * @returns User-friendly error message string
//    */
//   mapFirebaseError(error: unknown): string {
//     let code = '';

//     if (error && typeof error === 'object' && 'code' in error) {
//       code = error.code as string;
//     } else if (error instanceof Error) {
//       code = error.message;
//     }

//     return AUTH_ERROR_MAPPINGS[code] ?? DEFAULT_AUTH_ERROR;
//   }
// }
