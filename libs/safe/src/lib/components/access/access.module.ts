import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeAccessComponent } from './access.component';
import { SafeEditAccessComponent } from './edit-access/edit-access.component';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { IconModule } from '@oort-front/ui';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { TranslateModule } from '@ngx-translate/core';
import {
  TooltipModule,
  MenuModule,
  ButtonModule,
  SelectMenuModule,
  FormWrapperModule,
  DialogModule,
} from '@oort-front/ui';

/**
 * SafeAccessModule is a class used to manage all the modules and components related to the access properties.
 */
@NgModule({
  declarations: [SafeAccessComponent, SafeEditAccessComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    IconModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    TooltipModule,
    MenuModule,
    TranslateModule,
    ButtonModule,
    SelectMenuModule,
    FormWrapperModule,
  ],
  exports: [SafeAccessComponent],
})
export class SafeAccessModule {}
