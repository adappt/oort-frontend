import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { CommonModule } from '@angular/common';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { TranslateModule } from '@ngx-translate/core';
import { SafeModalModule } from '../../modal/modal.module';
import { UiModule } from '@oort-front/ui';

/** Model for the dialog data */
interface DialogData {
  incrementalId: string;
  errors: {
    question: string;
    errors: string[];
  }[];
}

/** Component for the errors modal component */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    TranslateModule,
    SafeModalModule,
    UiModule,
  ],
  selector: 'safe-errors-modal',
  templateUrl: './errors-modal.component.html',
  styleUrls: ['./errors-modal.component.scss'],
})
export class SafeErrorsModalComponent {
  public displayedColumns = ['question', 'errors'];

  /**
   * Constructor of the component
   *
   * @param dialogRef The reference of the dialog
   * @param data The data for the dialog
   */
  constructor(
    public dialogRef: MatDialogRef<SafeErrorsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
}
