import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { form, required, email, minLength } from '@angular/forms/signals';

// Core Services
import { ThemeService } from '@core/services/theme/theme.service';
import { SnackbarService } from '@core/services/snack-bar/snack-bar.service';

// Shared UI Components
import { SharedIconModule, IconSize, IconColor } from '@shared/ui/mat-icon';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { StatusConfig } from '@shared/ui/status-badge/status-model';
import { ChipsComponent } from '@shared/ui/chips/chips.component';
import { BaseCardComponent } from '@shared/ui/cards/base-card/base-card.component';
import { InfoCardComponent } from '@shared/ui/cards/info-card/info-card.component';
import { InfoCardData } from '@shared/ui/cards/info-card/info-card.model';
import { ReviewCardComponent } from '@shared/ui/cards/review-card/review-card.component';
import { Review } from '@shared/ui/cards/review-card/review.model';
import { LoaderComponent } from '@shared/ui/loader/loader.component';
import { LoaderHeight } from '@shared/ui/loader/loader.model';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '@shared/ui/dialogs/confirm-dialog/confirm-dialog.component';
import {
  ImgPreviewDialogComponent,
  ImgPreviewData,
} from '@shared/ui/img-preview-dialog/img-preview-dialog.component';
import { ReusableTable } from '@shared/ui/reusable-table/reusable-table';
import { TableColumn } from '@shared/ui/reusable-table/tables-type';

// Form Components
import { TextInputComponent } from '@shared/ui/forms/text-input/text-input.component';
import { PasswordInputComponent } from '@shared/ui/forms/password-input/password-input.component';
import { SelectInputComponent } from '@shared/ui/forms/select-input/select-input.component';
import { DateInputComponent } from '@shared/ui/forms/date-input/date-input.component';
import { TextFieldInputComponent } from '@shared/ui/forms/text-field-input/text-field-input.component';
import { FileInputComponent } from '@shared/ui/forms/file-input/file-input.component';
import { TimepickerComponent } from '@shared/ui/forms/timepicker/timepicker.component';

export type PlaygroundTab =
  | 'all'
  | 'colors'
  | 'typography'
  | 'buttons'
  | 'icons'
  | 'badges'
  | 'forms'
  | 'cards'
  | 'tables'
  | 'dialogs'
  | 'loaders'
  | 'branding';

export interface SampleUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'high' | 'medium' | 'low' | 'critical' | 'normal';
  joinedDate: string;
  budget: number;
}

@Component({
  selector: 'app-playground',
  imports: [
    CommonModule,
    FormsModule,
    JsonPipe,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SharedIconModule,
    StatusBadgeComponent,
    ChipsComponent,
    BaseCardComponent,
    InfoCardComponent,
    ReviewCardComponent,
    LoaderComponent,
    LogoComponent,
    ReusableTable,
    TextInputComponent,
    PasswordInputComponent,
    SelectInputComponent,
    DateInputComponent,
    TextFieldInputComponent,
    FileInputComponent,
    TimepickerComponent,
  ],
  templateUrl: './playground.component.html',
})
export class PlaygroundComponent {
  // Services
  protected readonly themeService = inject(ThemeService);
  protected readonly snackbarService = inject(SnackbarService);
  protected readonly dialog = inject(MatDialog);

  // Playground state
  protected readonly activeTab = signal<PlaygroundTab>('all');
  protected readonly searchQuery = signal('');
  protected readonly isDarkMode = computed(() => this.themeService.isDarkMode());

  // Interactive Icon Tester
  protected readonly customIconName = signal('favorite');
  protected readonly customIconSize = signal<IconSize>('3xl');
  protected readonly customIconColor = signal<IconColor>('primary');
  protected readonly customIconType = signal<'outline' | 'fill'>('fill');

  // Chips State
  protected readonly availableChips = signal([
    'All Services',
    'Residential',
    'Commercial',
    'Storage',
    'Packing',
    'Express',
  ]);
  protected readonly selectedChip = signal('Residential');

  // Status Badge Config
  protected readonly statusConfig: Record<string, StatusConfig> = {
    high: { color: 'green', icon: 'check_circle' },
    medium: { color: 'yellow', icon: 'schedule' },
    low: { color: 'blue', icon: 'info' },
    critical: { color: 'red', icon: 'warning' },
    normal: { color: 'gray', icon: 'help_outline' },
    active: { color: 'green', icon: 'verified' },
    pending: { color: 'yellow', icon: 'hourglass_empty' },
    rejected: { color: 'red', icon: 'cancel' },
    completed: { color: 'green', icon: 'task_alt' },
  };

  // Signal Form Model & Definition
  protected readonly formModel = signal({
    fullName: 'Alexander Wright',
    email: 'alex.wright@angular-lab.dev',
    password: 'LabSecurePassword!2026',
    role: 'administrator',
    preferredDate: new Date(),
    preferredTime: '10:30',
    bio: 'Lead architect building enterprise-grade Angular v22 Zoneless web applications with Tailwind v4.',
    file: null as File | null,
  });

  protected readonly demoForm = form(this.formModel, (schemaPath) => {
    required(schemaPath.fullName, { message: 'Full name is required' });
    required(schemaPath.email, { message: 'Email address is required' });
    email(schemaPath.email, { message: 'Must be a valid email format' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters' });
    required(schemaPath.role, { message: 'Please select a system role' });
    required(schemaPath.bio, { message: 'Bio cannot be empty' });
  });

  protected readonly roleOptions = [
    { value: 'administrator', label: 'Administrator (Full Access)' },
    { value: 'editor', label: 'Editor (Can publish content)' },
    { value: 'viewer', label: 'Viewer (Read-only)' },
    { value: 'billing', label: 'Billing Manager' },
  ] as const;

  // Cards Showcase Data
  protected readonly infoCardFeature: InfoCardData = {
    title: 'Modern Zoneless Architecture',
    iconName: 'bolt',
    items: [
      '100% Signal-based state reactivity (Zoneless runtime)',
      'Native Material 3 styling tokens with zero ::ng-deep',
      'Tailwind CSS v4 engine with semantic utility classes',
      'High-performance @defer blocks and SSR hydration',
    ],
  };

  protected readonly infoCardNarrative: InfoCardData = {
    title: 'Enterprise Quality Standards',
    iconName: 'verified_user',
    description:
      'Engineered with strict TypeScript modeling, Valibot schema validation, and complete component harnesses for Vitest unit testing.',
  };

  protected readonly sampleReview: Review = {
    firstName: 'Sophia',
    lastName: 'Martinez',
    date: 'August 2026',
    stars: 5,
    serviceType: 'high',
    description:
      'The component playground made our design review and token verification effortless. Clean, responsive, and blazing fast!',
  };

  // Reusable Table Data & Columns
  protected readonly tableUsers = signal<SampleUser[]>([
    {
      id: 'USR-101',
      name: 'Sarah Connor',
      email: 'sarah.c@skynet-defense.org',
      role: 'SecOps Lead',
      status: 'critical',
      joinedDate: '2026-01-15',
      budget: 45000,
    },
    {
      id: 'USR-102',
      name: 'Arthur Dent',
      email: 'arthur@galaxy-guide.space',
      role: 'Content Creator',
      status: 'high',
      joinedDate: '2026-03-22',
      budget: 12000,
    },
    {
      id: 'USR-103',
      name: 'Elena Rostova',
      email: 'elena.r@quantum-cloud.io',
      role: 'Platform Architect',
      status: 'medium',
      joinedDate: '2026-04-10',
      budget: 98000,
    },
    {
      id: 'USR-104',
      name: 'Marcus Vance',
      email: 'm.vance@sol-logistics.net',
      role: 'Fleet Manager',
      status: 'low',
      joinedDate: '2026-05-02',
      budget: 34000,
    },
    {
      id: 'USR-105',
      name: 'Talia Al Ghul',
      email: 'talia@shadow-league.corp',
      role: 'Executive Director',
      status: 'normal',
      joinedDate: '2026-06-18',
      budget: 150000,
    },
  ]);

  protected readonly tableColumns: TableColumn<SampleUser>[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'User Name', sortable: true },
    { key: 'email', label: 'Email Address', sortable: true },
    { key: 'role', label: 'System Role', sortable: true },
    { key: 'status', label: 'Priority / Status' },
    { key: 'joinedDate', label: 'Joined On', sortable: true },
    { key: 'budget', label: 'Budget (USD)', sortable: true },
  ];

  // Loader Controls State
  protected readonly loaderDiameter = signal(60);
  protected readonly loaderHeight = signal<LoaderHeight>('20');
  protected readonly loaderMessage = signal('Processing design tokens...');
  protected readonly loaderSectionSpace = signal(false);

  // Methods
  protected selectTab(tab: PlaygroundTab) {
    this.activeTab.set(tab);
  }

  protected copyToken(tokenName: string, label = '') {
    navigator.clipboard.writeText(tokenName).then(
      () => {
        const text = label ? `${label} (${tokenName})` : tokenName;
        this.snackbarService.success(`Copied "${text}" to clipboard!`);
      },
      () => {
        this.snackbarService.info(`Token: ${tokenName}`);
      },
    );
  }

  protected triggerSnackbar(type: 'success' | 'warning' | 'info' | 'error') {
    switch (type) {
      case 'success':
        this.snackbarService.success('Record successfully created and validated!', 'View');
        break;
      case 'warning':
        this.snackbarService.warning('Storage threshold reached 85% capacity.', 'Manage');
        break;
      case 'info':
        this.snackbarService.info('Zoneless change detection cycle completed in 1.2ms.');
        break;
      case 'error':
        this.snackbarService.error('Failed to communicate with the remote server.', 'Retry');
        break;
    }
  }

  protected openConfirmModal() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Component Reset',
        message: 'Are you sure you want to reset all playground state parameters to defaults?',
        confirmText: 'Yes, Reset',
        cancelText: 'Cancel',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.snackbarService.success('Playground state reset to defaults.');
      } else {
        this.snackbarService.info('Action cancelled.');
      }
    });
  }

  protected openImagePreviewModal() {
    const sampleDiagramSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" rx="16" fill="%230f172a"/><circle cx="400" cy="250" r="160" fill="%23005cbb" opacity="0.3"/><polygon points="400,130 510,320 290,320" fill="%23006d33" opacity="0.6"/><text x="400" y="240" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="%23ffffff" text-anchor="middle">Angular 22 Architecture</text><text x="400" y="280" font-family="system-ui, sans-serif" font-size="16" fill="%2394a3b8" text-anchor="middle">Zoneless • Signal Forms • Material 3 • Tailwind v4</text></svg>`;

    this.dialog.open(ImgPreviewDialogComponent, {
      data: {
        title: 'System Architecture Preview',
        imageSrc: sampleDiagramSvg,
      } as ImgPreviewData,
      width: '90vw',
      maxWidth: '800px',
    });
  }

  protected resetForm() {
    this.formModel.set({
      fullName: '',
      email: '',
      password: '',
      role: 'administrator',
      preferredDate: new Date(),
      preferredTime: '09:00',
      bio: '',
      file: null,
    });
    this.snackbarService.info('Signal form fields cleared.');
  }

  protected prefillForm() {
    this.formModel.set({
      fullName: 'Dr. Evelyn Reed',
      email: 'evelyn.reed@biotech-labs.com',
      password: 'QuantumPass#2026',
      role: 'editor',
      preferredDate: new Date(),
      preferredTime: '15:45',
      bio: 'Research scientist focusing on AI-assisted reactive architecture.',
      file: null,
    });
    this.snackbarService.success('Signal form populated with test data.');
  }
}
