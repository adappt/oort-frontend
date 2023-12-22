import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  GraphQLSelectModule,
  TabsModule,
  SelectOptionModule,
  IconModule,
} from '@oort-front/ui';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { LabelModule } from '@progress/kendo-angular-label';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { UploadsModule } from '@progress/kendo-angular-upload';
import { FormModule } from '../form/form.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderModule } from '../query-builder/query-builder.module';
import { EmailRoutingModule } from './email-routing.module';
import { EmailComponent } from './email.component';
import { CreateDatasetComponent } from './steps/create-dataset/create-dataset.component';
import { CreateNotificationComponent } from './steps/create-notification/create-notification.component';
import { LayoutComponent } from './steps/layout/layout.component';
import { ScheduleAlertComponent } from './steps/schedule-alert/schedule-alert.component';
import { SelectDistributionComponent } from './steps/select-ditribution/select-distribution.component';
import { PreviewComponent } from './steps/preview/preview.component';
import { TabStripModule } from '@progress/kendo-angular-layout';
import { NgSelectModule } from '@ng-select/ng-select';

//import {  MatStepperModule } from '@angular/material/stepper'
/**
 * Emailpage module.
 */
@NgModule({
  declarations: [
    EmailComponent,
    CreateNotificationComponent,
    SelectDistributionComponent,
    CreateDatasetComponent,
    ScheduleAlertComponent,
    LayoutComponent,
    PreviewComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    EmailRoutingModule,
    TranslateModule,
    LayoutModule,
    InputsModule,
    LabelModule,
    UploadsModule,
    DropDownsModule,
    DateInputsModule,
    ButtonsModule,
    TabsModule,
    QueryBuilderModule,
    FormModule,
    SelectOptionModule,
    GraphQLSelectModule,
    TabStripModule,
    IconModule,
    NgSelectModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class EmailModule {}
