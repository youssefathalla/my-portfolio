import { Component } from '@angular/core';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { LogoComponent } from '@shared/ui/logo/logo.component';

@Component({
  selector: 'app-branding-tab',
  imports: [SharedIconModule, LogoComponent],
  templateUrl: './branding-tab.component.html',
})
export class BrandingTabComponent {}
