export const CASE_STUDIES_CONTENT = {
  en: {
    hero: {
      title: 'Architectural Case Studies',
      subtitle: 'Real-world engineering challenges solved with modern Angular, reactive design patterns, and strict code discipline.',
    },
    items: [
      {
        slug: 'tashil',
        client: 'Tashil Platform',
        category: 'Multi-Tenant SaaS / GovTech',
        title: 'Bilingual Enterprise Application for High-Volume Document Workflows',
        summary: 'Architected a zoneless, signal-first Angular application with custom layout engines, RTL mirroring, and offline synchronization.',
        tags: ['Angular v22', 'Zoneless', 'Tailwind CSS', 'Transloco'],
      },
      {
        slug: 'drop-delivery',
        client: 'Drop Delivery',
        category: 'Real-Time Logistics',
        title: 'High-Throughput Dispatcher Console with Sub-100ms Latency',
        summary: 'Constructed an event-driven dispatcher portal handling thousands of active couriers with map clustering and WebSockets.',
        tags: ['Angular Signals', 'WebSockets', 'RxJS', 'Material M3'],
      },
    ],
  },
  ar: {
    hero: {
      title: 'دراسات الحالة الهندسية',
      subtitle: 'تحديات برمجية واقعية تم حلها باستخدام أحدث تقنيات Angular والأنماط التفاعلية الصارمة.',
    },
    items: [
      {
        slug: 'tashil',
        client: 'منصة تسهيل',
        category: 'منصات SaaS المؤسسية / الخدمات الحكومية',
        title: 'تطبيق مؤسسي ثنائي اللغة لإدارة المعاملات والمستندات الضخمة',
        titleAr: 'تطبيق مؤسسي ثنائي اللغة لإدارة المعاملات والمستندات الضخمة',
        summary: 'بناء معمارية برمجية حديثة بدون Zone.js تعتمد بالكامل على Signals مع محاذاة تلقائية لاتجاه RTL ومزامنة البيانات.',
        tags: ['Angular v22', 'Zoneless', 'Tailwind CSS', 'Transloco'],
      },
      {
        slug: 'drop-delivery',
        client: 'دروب ديليفري',
        category: 'الخدمات اللوجستية الفورية',
        title: 'لوحة تحكم للمندوبين وزمن استجابة أقل من 100 ميلي ثانية',
        titleAr: 'لوحة تحكم للمندوبين وزمن استجابة أقل من 100 ميلي ثانية',
        summary: 'تطوير منصة تتبع ومتابعة فورية تدعم آلاف المندوبين مع خرائط تفاعلية وتكامل مباشر عبر WebSockets.',
        tags: ['Angular Signals', 'WebSockets', 'RxJS', 'Material M3'],
      },
    ],
  },
} as const;
