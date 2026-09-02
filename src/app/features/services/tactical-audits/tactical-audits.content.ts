export const TACTICAL_AUDITS_CONTENT = {
  en: {
    hero: {
      badge: 'Defect & Performance Remediation',
      title: 'Tactical Engineering Audits',
      subtitle: 'Rapid forensic reviews of critical production defects, bundle bloat, Core Web Vitals bottlenecks, and accessibility compliance.',
      cta: 'Book an Audit',
    },
    deliverablesTitle: 'Audit Scope & Deliverables',
    deliverables: [
      'Comprehensive Core Web Vitals (LCP, INP, CLS) performance diagnosis',
      'Automated bundle analysis and tree-shaking bottleneck identification',
      'Accessibility (WCAG 2.1 AA) compliance scorecard',
      'Actionable remediation pull requests and architectural roadmap',
    ],
  },
  ar: {
    hero: {
      badge: 'إصلاح الأعطال ومراجعة الأداء',
      title: 'التدقيق الفني التكتيكي',
      subtitle: 'فحص وتشخيص فني سريع للأعطال البرمجية في بيئة الإنتاج، واختناقات الأداء ومؤشرات الويب، ومعايير إتاحة الوصول.',
      cta: 'احجز تدقيق فني',
    },
    deliverablesTitle: 'نطاق التدقيق والمخرجات',
    deliverables: [
      'تشخيص شامل لمؤشرات أداء الويب الحيوية (LCP, INP, CLS)',
      'تحليل أحجام حزم الكود (Bundle Analysis) واكتشاف أسباب البطء',
      'تقييم شامل لمعايير إتاحة الوصول الرقمي (WCAG 2.1 AA)',
      'إصلاحات برمجية جاهزة عبر Pull Requests وخطة عمل واضحة',
    ],
  },
} as const;
