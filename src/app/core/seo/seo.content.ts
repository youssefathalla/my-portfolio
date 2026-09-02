import type { Locale } from '../i18n/locale';

/** SEO metadata content and JSON-LD Person schema entity. */
export interface SeoContent {
  readonly title: string;
  readonly description: string;
  readonly ogImagePath: string;
  readonly person: {
    readonly name: string;
    readonly jobTitle: string;
    readonly email: string;
    readonly knowsAbout: readonly string[];
    readonly sameAs: readonly string[];
  };
}

/** English SEO metadata and Person schema fields. */
export const SEO_CONTENT_EN = {
  title: 'Youssef Fathalla | Senior Front-End Engineer',
  description:
    'Senior Front-End Specialist offering contract web app development and ' +
    'white-label agency engineering in Angular, TypeScript, and modern reactive architecture.',
  ogImagePath: '/og/og-image.png',
  person: {
    name: 'Youssef Fathalla',
    jobTitle: 'Senior Front-End Engineer & Web Application Specialist',
    email: 'youssefathalla@gmail.com',
    knowsAbout: [
      'Angular',
      'TypeScript',
      'RxJS',
      'Signals & Reactive Architecture',
      'Web Performance',
      'Accessibility (a11y)',
      'Firebase & Firestore',
    ],
    sameAs: [
      'https://www.linkedin.com/in/youssefathalla',
      'https://github.com/YousseFathalla',
    ],
  },
} as const satisfies SeoContent;

/** Arabic SEO metadata and Person schema fields. */

export const SEO_CONTENT_AR = {
  title: 'Youssef Fathalla | مهندس واجهات أمامية أول',
  description:
    'مهندس واجهات أمامية أول يقدم خدمات تطوير تطبيقات الويب بالتعاقد والعمل البرمجي للوكالات باستخدام Angular وTypeScript وأحدث بنى البرمجة التفاعلية الحديثة.',
  ogImagePath: '/og/og-image.png',
  person: {
    name: 'Youssef Fathalla',
    jobTitle: 'مهندس واجهات أمامية أول وخبير تطبيقات الويب',
    email: 'youssefathalla@gmail.com',
    knowsAbout: [
      'Angular',
      'TypeScript',
      'RxJS',
      'Signals & Reactive Architecture',
      'Web Performance',
      'Accessibility (a11y)',
      'Firebase & Firestore',
    ],
    sameAs: [
      'https://www.linkedin.com/in/youssefathalla',
      'https://github.com/YousseFathalla',
    ],
  },
} as const satisfies SeoContent;

export const SEO_CONTENT: Record<Locale, SeoContent> = {
  en: SEO_CONTENT_EN,
  ar: SEO_CONTENT_AR,
};
