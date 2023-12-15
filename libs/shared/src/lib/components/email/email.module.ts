import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailRoutingModule } from './email-routing.module';
import { EmailComponent } from './email.component';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutModule } from "@progress/kendo-angular-layout";
import { DropDownsModule } from "@progress/kendo-angular-dropdowns";
import { FormsModule } from "@angular/forms";
import { LabelModule } from "@progress/kendo-angular-label";
import { ButtonsModule } from "@progress/kendo-angular-buttons";
import { InputsModule } from '@progress/kendo-angular-inputs';
import { UploadsModule } from '@progress/kendo-angular-upload';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { CreateNotificationComponent } from './steps/create-notification/create-notification.component';
import { SelectDistributionComponent } from './steps/select-ditribution/select-distribution.component';
import { CreateDatasetComponent } from './steps/create-dataset/create-dataset.component';
import { ScheduleAlertComponent } from './steps/schedule-alert/schedule-alert.component';
import { LayoutComponent } from './steps/layout/layout.component';
import { PreviewComponent } from './steps/preview/preview.component';
import { TabsModule } from 'libs/ui/src/lib/tabs/tabs.module';

//import {  MatStepperModule } from '@angular/material/stepper'
/**
 * Emailpage module.
 */
@NgModule({
  declarations: [EmailComponent,
    CreateNotificationComponent,
    SelectDistributionComponent,
    CreateDatasetComponent,
    ScheduleAlertComponent,
    LayoutComponent,
    // PreviewComponent,
  ],
  imports: [CommonModule, EmailRoutingModule, TranslateModule,
    LayoutModule,
    InputsModule,
    LabelModule,
    UploadsModule,
    DropDownsModule,
    DateInputsModule,
    ButtonsModule,
    TabsModule
  ],
})
export class EmailModule {}
