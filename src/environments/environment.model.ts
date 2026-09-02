/**
 * Application environment configuration types.
 * Contains publicly disclosable client endpoints, feature flags, and Firebase client configs.
 */

/** Public Firebase client credentials and web identifiers. */
export interface FirebaseConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
  readonly measurementId: string;
}

/** Application environment constant schema. */
export interface AppEnvironment {
  readonly production: boolean;
  readonly baseUrl: string;
  readonly discoveryBookingUrl: string;
  readonly urgentBookingUrl: string;
  readonly analyticsEnabled: boolean;
  readonly firebase: FirebaseConfig;
  readonly appCheckSiteKey: string;
}

