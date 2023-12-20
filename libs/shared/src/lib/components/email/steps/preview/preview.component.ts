import { AfterViewInit, Component, Inject, Input } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Layout } from '../../../../models/layout.model';
import {
  createDisplayForm,
  createQueryForm,
} from '../../../query-builder/query-builder-forms';
import { CommonModule } from '@angular/common';
 import { QueryBuilderModule } from '../../../query-builder/query-builder.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
 import { CoreGridModule } from '../../../ui/core-grid/core-grid.module';
import { flattenDeep } from 'lodash';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { DialogModule, FormWrapperModule } from '@oort-front/ui';
import { ButtonModule } from '@oort-front/ui';

/**
 * Interface describing the structure of the data displayed in the dialog
 */
interface DialogData {
  layout?: Layout;
  queryName?: string;
}

/**
 * Component used to display modals regarding layouts
 */
@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent {
  
}
