import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteNavComponent } from '@layout/site-nav/site-nav.component';
import { SiteFooterComponent } from '@layout/site-footer/site-footer.component';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, SiteNavComponent, SiteFooterComponent],
  template: `
    <app-site-nav />
    <main id="main-content" class="min-h-screen">
      <router-outlet />
    </main>
    <app-site-footer />
  `,
  host: {
    class: 'block',
  },
})
export class PublicShellComponent {}
