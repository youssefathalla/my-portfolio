export const SERVICES_CONTENT = {
  en: {
    hero: {
      title: 'Front-End Engineering Services',
      subtitle: 'Compare four goal-oriented engagement models to find the right partnership structure for your roadmap.',
    },
    cards: [
      {
        key: 'turnkey',
        title: 'Fixed-Price MVP Build',
        subtitle: 'Complete product delivery end-to-end',
        description: 'Ideal for founders and product teams needing a full application built to a fixed scope, schedule, and investment.',
        link: '/services/fixed-mvp',
        badge: 'Turnkey Delivery',
      },
      {
        key: 'augmentation',
        title: 'Enterprise Team Augmentation',
        subtitle: 'Embedded senior front-end expertise',
        description: 'Direct integration into your engineering sprint cadence to level up architecture, accessibility, and throughput.',
        link: '/services/enterprise-augmentation',
        badge: 'Team Augmentation',
      },
      {
        key: 'sprints',
        title: 'Hourly Sprints',
        subtitle: 'Flexible engineering bandwidth',
        description: 'Transparent hourly engineering time for component library builds, API integrations, and backlog execution.',
        link: '/services/hourly-sprints',
        badge: 'Flexible Hours',
      },
      {
        key: 'audits',
        title: 'Tactical Audits',
        subtitle: 'Defect remediation & performance review',
        description: 'Rapid forensic audits of production issues, bundle bottlenecks, Core Web Vitals, and accessibility gaps.',
        link: '/services/tactical-audits',
        badge: 'Rapid Review',
      },
    ],
  },
  ar: {
    hero: {
      title: 'خدمات هندسة الواجهات الأمامية',
      subtitle: 'قارن بين أربعة نماذج تعاقدية موجهة لتحقيق الأهداف لاختيار النموذج الأنسب لخطة مشروعك.',
    },
    cards: [
      {
        key: 'turnkey',
        title: 'بناء تطبيق متكامل بسعر ثابت',
        subtitle: 'تسليم المنتج بالكامل من البداية للنهاية',
        description: 'مثالي للمؤسسين وفرق المنتجات التي تحتاج إلى بناء تطبيق متكامل بنطاق محدد وتكلفة وجدول زمني واضحين.',
        link: '/services/fixed-mvp',
        badge: 'تسليم متكامل',
      },
      {
        key: 'augmentation',
        title: 'تعزيز الفرق للمؤسسات',
        subtitle: 'دمج خبرة هندسية متقدمة في الواجهات',
        description: 'اندماج مباشر مع فريقكم الهندسي لرفع جودة المعمارية البرمجية ومعايير الوصول وسرعة الإنجاز.',
        link: '/services/enterprise-augmentation',
        badge: 'دعم الفرق',
      },
      {
        key: 'sprints',
        title: 'باقات الساعات البرمجية',
        subtitle: 'مرونة ساعات العمل الهندسي',
        description: 'شراء باقات ساعات شفافة لبناء مكتبات المكونات وتكامل واجهات البرمجة وإنجاز المهام البرمجية.',
        link: '/services/hourly-sprints',
        badge: 'ساعات مرنة',
      },
      {
        key: 'audits',
        title: 'التدقيق الفني التكتيكي',
        subtitle: 'إصلاح الأعطال ومراجعة الأداء',
        description: 'تدقيق فني سريع وموجه لمشكلات بيئة الإنتاج، واختناقات الأداء، ومؤشرات الويب الحيوية.',
        link: '/services/tactical-audits',
        badge: 'تدقيق سريع',
      },
    ],
  },
} as const;
