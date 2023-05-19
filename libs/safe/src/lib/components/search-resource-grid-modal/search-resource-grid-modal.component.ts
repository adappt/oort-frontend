import { ApplicationRef, Component, Inject } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { GridSettings } from '../ui/core-grid/models/grid-settings.model';
import { CommonModule } from '@angular/common';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { SpinnerModule } from '@oort-front/ui';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { SafeResourceDropdownModule } from '../resource-dropdown/resource-dropdown.module';
import { SafeApplicationDropdownModule } from '../application-dropdown/application-dropdown.module';
import { SafeRecordDropdownModule } from '../record-dropdown/record-dropdown.module';
import { SafeCoreGridModule } from '../ui/core-grid/core-grid.module';
import { TranslateModule } from '@ngx-translate/core';
import { SafeModalModule } from '../ui/modal/modal.module';
import { ButtonModule, Variant, Category } from '@oort-front/ui';

/**
 * Dialog data interface of the component
 */
interface DialogData {
  gridSettings: any;
  multiselect?: boolean;
  selectedRows?: string[];
  selectable?: boolean;
}

/**
 * Grid of records for resource / resources questions.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    SpinnerModule,
    MatButtonModule,
    SafeResourceDropdownModule,
    SafeApplicationDropdownModule,
    SafeRecordDropdownModule,
    SafeCoreGridModule,
    TranslateModule,
    SafeModalModule,
    ButtonModule,
  ],
  selector: 'safe-search-resource-grid-modal',
  templateUrl: './search-resource-grid-modal.component.html',
  styleUrls: ['./search-resource-grid-modal.component.scss'],
})
export class SafeResourceGridModalComponent {
  public multiSelect = false;
  public gridSettings: GridSettings;
  public selectedRows: any[] = [];

  // === UI VARIANT AND CATEGORY ===
  public variant = Variant;
  public category = Category;

  /**
   * Is the data selectable
   *
   * @returns is the data selectable
   */
  get selectable(): boolean {
    return this.data.selectable || false;
  }

  /**
   * Grid of records for resource / resources questions.
   *
   * @param data dialog data
   * @param dialogRef Material dialog reference of the component
   * @param ref Application reference
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialogRef: MatDialogRef<SafeResourceGridModalComponent>,
    private ref: ApplicationRef
  ) {
    if (this.data.multiselect !== undefined)
      this.multiSelect = this.data.multiselect;
    if (this.data.selectedRows !== undefined)
      this.selectedRows = [...this.data.selectedRows];

    if (this.data.gridSettings.sort && !this.data.gridSettings.sort.field) {
      delete this.data.gridSettings.sort;
    }
    this.gridSettings = {
      query: this.data.gridSettings,
      actions: {
        delete: false,
        history: false,
        convert: false,
        update: false,
        inlineEdition: false,
        remove: false,
      },
    };
    this.ref.tick();
  }

  /**
   * Handle selection change in the grid.
   *
   * @param selection selection event
   */
  onSelectionChange(selection: any): void {
    if (this.multiSelect) {
      if (selection.selectedRows.length > 0) {
        this.selectedRows = this.selectedRows.concat(
          selection.selectedRows.map((x: any) => x.dataItem.id)
        );
      }
      if (selection.deselectedRows.length > 0) {
        const deselectedRows = selection.deselectedRows.map(
          (r: any) => r.dataItem.id
        );
        this.selectedRows = this.selectedRows.filter(
          (r: any) => !deselectedRows.includes(r)
        );
      }
    } else {
      this.selectedRows = selection.selectedRows.map((x: any) => x.dataItem.id);
    }
  }

  /**
   * Close the modal, indicating if update is required
   *
   * @param saveChanges is update required
   */
  closeModal(saveChanges: boolean = true): void {
    this.ref.tick();
    if (saveChanges) {
      this.dialogRef.close(this.selectedRows);
    }
  }
}
