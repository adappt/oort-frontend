import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeSearchMenuComponent } from './search-menu.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { IconModule } from '@oort-front/ui';
import {
  TooltipModule,
  DividerModule,
  ButtonModule,
  FormWrapperModule,
} from '@oort-front/ui';

/**
 * Search menu component module.
 */
@NgModule({
  declarations: [SafeSearchMenuComponent],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    MatFormFieldModule,
    FormWrapperModule,
    IconModule,
    TooltipModule,
    DividerModule,
    ButtonModule,
  ],
  exports: [SafeSearchMenuComponent],
})
export class SafeSearchMenuModule {}
