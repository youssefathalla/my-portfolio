export const WORKFLOW_CONTENT = {
  en: {
    hero: {
      title: 'The Delivery Workflow',
      subtitle: 'A disciplined, 4-stage engineering lifecycle designed for transparency, rapid cadence, and zero surprises.',
    },
    stages: [
      {
        number: '01',
        title: 'Discovery & Architecture Scoping',
        description: 'Define technical constraints, establish state boundaries, build data models, and write the implementation contract.',
      },
      {
        number: '02',
        title: 'Foundational Build & CI/CD Setup',
        description: 'Set up strict type checking, design system tokens, linting rules, automated Vitest test harnesses, and staging pipelines.',
      },
      {
        number: '03',
        title: 'Iterative Feature Engineering',
        description: 'Build responsive UI components, connect backend APIs, write unit tests, and maintain continuous milestone demos.',
      },
      {
        number: '04',
        title: 'Launch, Verification & 60-Day Warranty',
        description: 'Execute production verification, Core Web Vitals audits, seamless DNS switchover, and enter the 60-day bug warranty period.',
      },
    ],
    cta: 'Start a Project',
  },
  ar: {
    hero: {
      title: 'مراحل سير العمل والتعاقد',
      subtitle: 'دورة هندسية متكاملة ومحكمة من 4 مراحل مصممة للشفافية والسرعة في الإنجاز وتجنب المفاجآت.',
    },
    stages: [
      {
        number: '01',
        title: 'الاستكشاف وتحديد المعمارية البرمجية',
        description: 'تحديد القيود التقنية، وتصميم حدود إدارة الحالة، وبناء نماذج البيانات، وصياغة عقد التنفيذ بدقة.',
      },
      {
        number: '02',
        title: 'البناء التأسيسي وإعداد CI/CD',
        description: 'تهيئة الفحص الصارم للأنواع، وتكامل نظام التصميم، وحزم الاختبارات المؤتمتة عبر Vitest، وخطوط النشر التجريبي.',
      },
      {
        number: '03',
        title: 'التطوير الهندسي المرحلي',
        description: 'بناء واجهات المستخدم التفاعلية، وربط واجهات البرمجة الخلفية، وكتابة الاختبارات، وتقديم عروض مرحلية مستمرة.',
      },
      {
        number: '04',
        title: 'الإطلاق، والتحقق، وضمان 60 يوماً',
        description: 'إجراء التحقق الشامل في بيئة الإنتاج، وفحص مؤشرات الأداء، وضمان إصلاح أي أعطال لمدة 60 يوماً بعد الإطلاق.',
      },
    ],
    cta: 'ابدأ مشروعك الآن',
  },
} as const;
