import type { AppEnvironment } from './environment.model';

/**
 * Production environment values.
 *
 * `baseUrl` is the real purchased domain, an absolute HTTPS URL with no
 * trailing slash. See `environment.ts` for the development values and
 * `environment.model.ts` for field docs.
 */
export const environment: AppEnvironment = {
  production: true,
  baseUrl: 'https://youssefathalla.com',
  discoveryBookingUrl: 'https://cal.com/youssefathalla/discovery-call',
  urgentBookingUrl: 'https://cal.com/youssefathalla/urgent-call',
  analyticsEnabled: false,
  firebase: {
    apiKey: 'AIzaSyDwc16key5P7fONl15iECdd4VORfGsCEU8',
    authDomain: 'youssefathalla-portfolio.firebaseapp.com',
    projectId: 'youssefathalla-portfolio',
    storageBucket: 'youssefathalla-portfolio.firebasestorage.app',
    messagingSenderId: '647406345490',
    appId: '1:647406345490:web:22529e57edcd52adcd67cb',
    measurementId: 'G-6XS8NQB55C',
  },
  appCheckSiteKey: '6LdDSoItAAAAAC8KJReXlMik6OGtkmy5jjGO0Ff7',
};

