import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeGridWidgetComponent } from './grid.component';
import { SafeFormModalModule } from '../../form-modal/form-modal.module';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { SafeChooseRecordModalModule } from '../../choose-record-modal/choose-record-modal.module';
import { SafeCoreGridModule } from '../../ui/core-grid/core-grid.module';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { DropDownListModule } from '@progress/kendo-angular-dropdowns';
import { SafeEmailPreviewModule } from '../../email-preview/email-preview.module';
import { EmailTemplateModalModule } from '../../email-template-modal/email-template-modal.module';
import { SafeAggregationGridModule } from '../../aggregation/aggregation-grid/aggregation-grid.module';

/** Module for grid widget component */
@NgModule({
  declarations: [SafeGridWidgetComponent],
  imports: [
    CommonModule,
    SafeFormModalModule,
    MatButtonModule,
    SafeChooseRecordModalModule,
    SafeCoreGridModule,
    LayoutModule,
    DropDownListModule,
    SafeEmailPreviewModule,
    EmailTemplateModalModule,
    SafeAggregationGridModule,
  ],
  exports: [SafeGridWidgetComponent],
})
export class SafeGridWidgetModule {}
