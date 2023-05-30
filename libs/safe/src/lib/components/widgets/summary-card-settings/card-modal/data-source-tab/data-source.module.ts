import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import {
  GraphQLSelectModule,
  SelectMenuModule,
  SpinnerModule,
} from '@oort-front/ui';
import { TranslateModule } from '@ngx-translate/core';
import { SafeFormsDropdownModule } from '../../../../ui/aggregation-builder/public-api';
import { SafeDataSourceTabComponent } from './data-source-tab.component';
import {
  RadioModule,
  DividerModule,
  CheckboxModule,
  ButtonModule,
} from '@oort-front/ui';

/** Data Source tab Module for summary card edition */
@NgModule({
  declarations: [SafeDataSourceTabComponent],
  imports: [
    CommonModule,
    TranslateModule,
    SafeFormsDropdownModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    SpinnerModule,
    GraphQLSelectModule,
    CheckboxModule,
    DividerModule,
    RadioModule,
    ButtonModule,
    SelectMenuModule,
  ],
  exports: [SafeDataSourceTabComponent],
})
export class SafeDataSourceTabModule {}
