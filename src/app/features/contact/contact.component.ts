import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { LangService } from '@core/i18n/services/lang.service';
import { SeoService } from '@core/seo/seo.service';
import { LOCALE } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { ContactSubmissionService } from '@core/services/contact/contact-submission.service';
import { CONTACT_CONTENT } from './contact.content';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './contact.component.html',
  host: {
    class: 'block',
  },
})
export class ContactComponent implements OnInit {
  readonly #lang = inject(LangService);
  readonly #seo = inject(SeoService);
  readonly #locale = inject(LOCALE);
  readonly #contactService = inject(ContactSubmissionService);

  protected readonly t = computed(() => CONTACT_CONTENT[this.#lang.currentLang()]);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly projectType = signal('turnkey');
  protected readonly message = signal('');

  protected readonly submitting = signal(false);
  protected readonly submitSuccess = signal(false);
  protected readonly submitError = signal(false);

  ngOnInit(): void {
    const entry = ROUTE_MANIFEST.find((e) => e.key === 'contact');
    if (entry) {
      this.#seo.initRoute(entry.metadata[this.#locale], 'contact', this.#locale);
    }
  }

  protected async submitEnquiry(): Promise<void> {
    if (this.submitting() || !this.name().trim() || !this.email().trim() || !this.message().trim()) {
      return;
    }

    this.submitting.set(true);
    this.submitError.set(false);

    try {
      const outcome = await firstValueFrom(
        this.#contactService.submit({
          name: this.name().trim(),
          email: this.email().trim(),
          projectType: this.projectType().trim(),
          message: this.message().trim(),
        }),
      );

      if (outcome.kind === 'success') {
        this.submitSuccess.set(true);
        this.name.set('');
        this.email.set('');
        this.message.set('');
      } else {
        this.submitError.set(true);
      }
    } catch {
      this.submitError.set(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
