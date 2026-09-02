import { DEFAULT_LOCALE, LOCALES } from '../i18n/locale';
import type { Locale } from '../i18n/locale';

/**
 * Per-route document title, meta description, canonical path, and social preview image.
 */
export interface RouteMetadata {
  /** 30-60 characters. */
  readonly title: string;
  /** 120-160 characters. */
  readonly description: string;
  /** `''` for Landing; otherwise no leading or trailing `/`. */
  readonly canonicalPath: string;
  /** Resolves to a file under `public/og/`. */
  readonly socialImagePath: string;
}

/**
 * Route manifest entry defining routing paths and localized SEO metadata.
 */
export interface RouteManifestEntry {
  readonly key: string;
  readonly path: string;
  readonly metadata: Record<Locale, RouteMetadata>;
}

/**
 * The single source of truth for routing paths and search engine metadata.
 */
export const ROUTE_MANIFEST: readonly RouteManifestEntry[] = [
  {
    key: 'landing',
    path: '',
    metadata: {
      en: {
        title: 'Youssef Fathalla | Senior Front-End Engineer',
        description:
          'Senior Front-End Specialist offering contract web app development and ' +
          'white-label agency engineering in Angular, TypeScript, and modern reactive architecture.',
        canonicalPath: '',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'Youssef Fathalla | مهندس واجهات أمامية أول',
        description:
          'مهندس واجهات أمامية أول يقدم خدمات تطوير تطبيقات الويب بالتعاقد والعمل البرمجي للوكالات باستخدام Angular وTypeScript وأحدث بنى البرمجة التفاعلية الحديثة.',
        canonicalPath: 'ar',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'services-hub',
    path: 'services',
    metadata: {
      en: {
        title: 'Front-End Engineering Services | Youssef Fathalla',
        description:
          'Compare four goal-oriented engagement models: fixed-price builds, embedded ' +
          'augmentation, hourly sprints, and tactical audits to find the right fit.',
        canonicalPath: 'services',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'خدمات هندسة الواجهات الأمامية | Youssef Fathalla',
        description:
          'قارن بين أربعة نماذج تعاقدية موجهة لتحقيق الأهداف: بناء المشاريع بسعر ثابت، والدعم المدمج للفرق، وباقات الساعات، والتدقيق الفني السريع لاختيار النموذج الأنسب.',
        canonicalPath: 'ar/services',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'turnkey',
    path: 'services/fixed-mvp',
    metadata: {
      en: {
        title: 'Fixed-Price MVP Build | Turnkey App Development',
        description:
          'Get a complete application built end to end on a fixed price and timeline, ' +
          'with staged payments, a post-launch warranty, and automated test coverage included.',
        canonicalPath: 'services/fixed-mvp',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'بناء تطبيق متكامل بسعر ثابت | تطوير تطبيقات الويب',
        description:
          'احصل على تطبيق ويب متكامل ومطور بالكامل بسعر ثابت وجدول زمني محدد، مع دفعات مرحلية وضمان إصلاح الأعطال بعد الإطلاق وتغطية اختبارية مؤتمتة شاملة لكل ميزة.',
        canonicalPath: 'ar/services/fixed-mvp',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'augmentation',
    path: 'services/enterprise-augmentation',
    metadata: {
      en: {
        title: 'Enterprise Augmentation | Senior Front-End Contractor',
        description:
          'Add a senior front-end engineer to your existing team with enterprise-grade ' +
          'code quality, accessibility standards, and high-velocity delivery.',
        canonicalPath: 'services/enterprise-augmentation',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'تعزيز الفرق للمؤسسات | مهندس واجهات أمامية متعاقد',
        description:
          'أضف مهندس واجهات أمامية أول إلى فريقك الهندسي القائم مع التزام تام بجودة الكود المؤسسية، ومعايير إتاحة الوصول، وسرعة إنجاز استثنائية.',
        canonicalPath: 'ar/services/enterprise-augmentation',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'sprints',
    path: 'services/hourly-sprints',
    metadata: {
      en: {
        title: 'Hourly Sprints | Flexible Front-End Engineering Time',
        description:
          'Buy a transparent block of senior front-end engineering hours for design ' +
          'conversion, API integration, and isolated feature work, with visible time tracking.',
        canonicalPath: 'services/hourly-sprints',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'باقات الساعات البرمجية | مرونة هندسة الواجهات',
        description:
          'شراء باقة ساعات هندسية شفافة لتحويل التصاميم إلى كود، وتكامل واجهات البرمجة (APIs)، وبناء الميزات المستقلة، مع تتبع مرئي دقيق لساعات العمل دون عقود ملزمة.',
        canonicalPath: 'ar/services/hourly-sprints',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'audits',
    path: 'services/tactical-audits',
    metadata: {
      en: {
        title: 'Tactical Audits | Emergency Fixes and Performance Reviews',
        description:
          'Get fast, isolated fixes for production defects and performance problems, backed ' +
          'by before-and-after measurements and a clear modernization plan.',
        canonicalPath: 'services/tactical-audits',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'التدقيق الفني التكتيكي | إصلاح الأعطال ومراجعة الأداء',
        description:
          'احصل على إصلاحات سريعة ومعزولة للأعطال البرمجية ومشكلات الأداء في بيئة الإنتاج، مدعومة بقياسات دقيقة قبل وبعد الإصلاح مع وثيقة واضحة لتحديث الأنظمة القديمة.',
        canonicalPath: 'ar/services/tactical-audits',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'policies',
    path: 'policies',
    metadata: {
      en: {
        title: 'Policies | Warranty, Scope, and Care Plan Terms',
        description:
          'Read the warranty length, change-request policy, care plan options, and ' +
          'operational rules that govern every engagement before you sign a contract.',
        canonicalPath: 'policies',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'السياسات | شروط الضمان ونطاق العمل وخطط الرعاية',
        description:
          'تعرف على مدة الضمان، وسياسة طلبات التغيير العادلة، وخيارات خطط الرعاية بعد الإطلاق، والقواعد التشغيلية التي تحكم كل مشروع وتعاقد قبل التوقيع وبدء العمل البرمجي.',
        canonicalPath: 'ar/policies',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'workflow',
    path: 'workflow',
    metadata: {
      en: {
        title: 'The Delivery Workflow | Youssef Fathalla',
        description:
          'See the four-stage delivery process for every engagement, from discovery and scoping ' +
          'through build, launch, and handoff, so you know what to expect and when.',
        canonicalPath: 'workflow',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'مراحل سير العمل والتعاقد | Youssef Fathalla',
        description:
          'اطلع على مراحل التسليم الأربع لكل مشروع، من الاستكشاف وتحديد النطاق وحتى البناء والإطلاق والتسليم النهائي، لتعرف بدقة ما يمكن توقعه ومخرجات كل مرحلة زمنية.',
        canonicalPath: 'ar/workflow',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'case-studies',
    path: 'case-studies',
    metadata: {
      en: {
        title: 'Case Studies | Front-End Engineering by Youssef Fathalla',
        description:
          'Read the problem, solution, and technology behind real front-end and full-stack ' +
          'engagements, from multi-tenant SaaS platforms to enterprise banking refactors.',
        canonicalPath: 'case-studies',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'دراسات الحالة | هندسة الواجهات مع Youssef Fathalla',
        description:
          'استكشف المشكلات والحلول والتقنيات الكامنة وراء مشاريع حقيقية للواجهات الأمامية والأنظمة المتكاملة، من منصات SaaS متعددة المستأجرين إلى تحديث الأنظمة المصرفية.',
        canonicalPath: 'ar/case-studies',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
  {
    key: 'contact',
    path: 'contact',
    metadata: {
      en: {
        title: 'Contact | Start a Project With Youssef Fathalla',
        description:
          'Describe your project goal, timeline, and budget band in a short guided form, or book ' +
          'a discovery call directly, to start a front-end or full-stack engagement.',
        canonicalPath: 'contact',
        socialImagePath: '/og/og-image.png',
      },
      ar: {
        title: 'تواصل معي | ابدأ مشروعك مع Youssef Fathalla',
        description:
          'وضح أهداف مشروعكم وجدولكم الزمني وميزانيتكم التقريبية عبر نموذج موجه وسريع، أو احجز مكالمة استكشافية مباشرة لبدء مشروع تطوير واجهات أمامية أو تطبيقات متكاملة.',
        canonicalPath: 'ar/contact',
        socialImagePath: '/og/og-image.png',
      },
    },
  },
] as const satisfies readonly RouteManifestEntry[];

import { toLocalizedPath, toManifestPath } from './path-encoder';
export { toLocalizedPath, toManifestPath } from './path-encoder';

/**
 * Resolves the Localized_Path of the same Route_Manifest entry in
 * `targetLocale`. Falls back to targetLocale's Landing_Route
 * Localized_Path when `localizedPath` matches no entry. Pure, total,
 * never throws.
 */
export function toTargetLocalePath(
  manifest: readonly RouteManifestEntry[],
  localizedPath: string,
  targetLocale: Locale,
): string {
  const { path } = toManifestPath(localizedPath);
  const matched = manifest.some((entry) => entry.path === path);
  return toLocalizedPath(matched ? path : '', targetLocale);
}

/**
 * The canonical-URL rule, as a pure function reused by `SeoService` and by
 * the sitemap/robots build guard.
 */
export function toCanonicalUrl(canonicalPath: string, siteBaseUrl: string): string {
  return canonicalPath === '' ? `${siteBaseUrl}/` : `${siteBaseUrl}/${canonicalPath}`;
}

/**
 * One canonical URL per manifest entry, in manifest order.
 */
export function toCanonicalUrls(
  manifest: readonly RouteManifestEntry[],
  siteBaseUrl: string,
): readonly string[] {
  return manifest.map((entry) =>
    toCanonicalUrl(entry.metadata[DEFAULT_LOCALE].canonicalPath, siteBaseUrl),
  );
}

/**
 * One Language_Switcher target.
 */
export interface LanguageSwitcherTarget {
  readonly locale: Locale;
  readonly path: string;
}

/**
 * Resolves the Language_Switcher targets for the current view.
 */
export function resolveLanguageSwitcherTargets(
  manifest: readonly RouteManifestEntry[],
  currentLocalizedPath: string,
  currentLocale: Locale,
): readonly LanguageSwitcherTarget[] {
  return LOCALES.filter((l) => l !== currentLocale).map((locale) => ({
    locale,
    path: toTargetLocalePath(manifest, currentLocalizedPath, locale),
  }));
}
