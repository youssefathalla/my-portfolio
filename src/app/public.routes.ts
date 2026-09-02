import { Routes } from '@angular/router';

/**
 * Standard public feature routes.
 */
export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'playground',
    loadComponent: () =>
      import('./features/playground/playground.component').then((m) => m.PlaygroundComponent),
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./features/services/services.component').then((m) => m.ServicesComponent),
  },
  {
    path: 'services/fixed-mvp',
    loadComponent: () =>
      import('./features/services/fixed-mvp/fixed-mvp.component').then((m) => m.FixedMvpComponent),
  },
  {
    path: 'services/enterprise-augmentation',
    loadComponent: () =>
      import('./features/services/enterprise-augmentation/enterprise-augmentation.component').then(
        (m) => m.EnterpriseAugmentationComponent,
      ),
  },
  {
    path: 'services/hourly-sprints',
    loadComponent: () =>
      import('./features/services/hourly-sprints/hourly-sprints.component').then(
        (m) => m.HourlySprintsComponent,
      ),
  },
  {
    path: 'services/tactical-audits',
    loadComponent: () =>
      import('./features/services/tactical-audits/tactical-audits.component').then(
        (m) => m.TacticalAuditsComponent,
      ),
  },
  {
    path: 'policies',
    loadComponent: () =>
      import('./features/policies/policies.component').then((m) => m.PoliciesComponent),
  },
  {
    path: 'workflow',
    loadComponent: () =>
      import('./features/workflow/workflow.component').then((m) => m.WorkflowComponent),
  },
  {
    path: 'case-studies',
    loadComponent: () =>
      import('./features/case-studies/case-studies.component').then((m) => m.CaseStudiesComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then((m) => m.ContactComponent),
  },
];
