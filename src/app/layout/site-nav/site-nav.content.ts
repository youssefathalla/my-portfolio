export const SITE_NAV_CONTENT = {
  en: {
    links: [
      { path: '/', label: 'Home' },
      { path: '/services', label: 'Services' },
      { path: '/workflow', label: 'Workflow' },
      { path: '/case-studies', label: 'Case Studies' },
      { path: '/policies', label: 'Policies' },
      { path: '/contact', label: 'Contact' },
    ],
    cta: 'Book a Call',
    availabilityBadge: 'Available for Q2/Q3 Projects',
  },
  ar: {
    links: [
      { path: '/', label: 'الرئيسية' },
      { path: '/services', label: 'الخدمات' },
      { path: '/workflow', label: 'آلية العمل' },
      { path: '/case-studies', label: 'دراسات الحالة' },
      { path: '/policies', label: 'السياسات' },
      { path: '/contact', label: 'تواصل معي' },
    ],
    cta: 'احجز استشارة',
    availabilityBadge: 'متاح لمشاريع الربع الثاني والثالث',
  },
} as const;
