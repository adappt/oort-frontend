import { Component, Inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { GET_DATA_SET } from '../../graphql/queries';
import { ResourceQueryResponse } from '../../../../models/resource.model';
import { EmailService } from '../../email.service';
import { DOCUMENT } from '@angular/common';
// import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
// import { Layout } from '../../../../models/layout.model';
// import {
//   createDisplayForm,
//   createQueryForm,
// } from '../../../query-builder/query-builder-forms';
// import { CommonModule } from '@angular/common';
//  import { QueryBuilderModule } from '../../../query-builder/query-builder.module';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//  import { CoreGridModule } from '../../../ui/core-grid/core-grid.module';
// import { flattenDeep } from 'lodash';
// import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
// import { DialogModule, FormWrapperModule } from '@oort-front/ui';
// import { ButtonModule } from '@oort-front/ui';

/**
 * Interface describing the structure of the data displayed in the dialog
 */
// interface DialogData {
//   layout?: Layout;
//   queryName?: string;
// }

/**
 * Component used to display modals regarding layouts
 */
@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent {
  public selectedResourceId: string | undefined = '653642baa37293bb1706506e';
  public dataList!: { [key: string]: string }[];
  public dataListKey!: { [key: string]: string }[];
  whoLogo = '../../images/WHO.png';
  emsLogo = '../../images/EMS_logo.jpg';

  /**
   *
   * @param apollo
   * @param emailService
   * @param document
   */
  constructor(
    private apollo: Apollo,
    public emailService: EmailService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    (document.getElementById('headerHtml') as HTMLInputElement).innerHTML =
      this.emailService.allLayoutdata.headerHtml;
    (document.getElementById('bodyHtml') as HTMLInputElement).innerHTML =
      this.emailService.allLayoutdata.bodyHtml;

    if (this.emailService.allLayoutdata.headerLogo) {
      (document.getElementById('headerLogo') as HTMLInputElement).src =
        URL.createObjectURL(this.emailService.allLayoutdata.headerLogo);
    }

    if (this.emailService.allLayoutdata.footerLogo) {
      (document.getElementById('footerImg') as HTMLInputElement).src =
        URL.createObjectURL(this.emailService.allLayoutdata.footerLogo);
    }

    (document.getElementById('footerHtml') as HTMLInputElement).innerHTML =
      this.emailService.allLayoutdata.footerHtml;
    this.getDataSet();
  }

  /**
   *
   */
  getDataSet(): void {
    this.apollo
      .query<ResourceQueryResponse>({
        query: GET_DATA_SET,
        variables: {
          resourceId: this.selectedResourceId,
          layout: {
            name: 'Test Query',
            query: {
              name: 'Alerts',
              filter: {
                logic: 'and',
                filters: [
                  {
                    field: 'status',
                    operator: 'neq',
                    value: 'pending',
                    hideEditor: false,
                  },
                ],
              },
              pageSize: 10,
              fields: [
                {
                  name: 'point_of_contact',
                  type: 'string',
                },
                {
                  name: 'description',
                  type: 'string',
                },
                {
                  name: 'region',
                  type: 'string',
                },
                {
                  name: 'status',
                  type: 'string',
                },
              ],
            },
          },
        },
      })
      .subscribe((res: any) => {
        this.dataList = res?.data?.dataSet?.records?.records?.map(
          (rec: any) => rec?.data
        );

        const tempdata: any = this.dataList.map((x) => Object.keys(x).length);
        const maxlength = Math.max(...tempdata);
        this.dataListKey = [this.dataList[tempdata.indexOf(maxlength)]];
      });
  }

  /**
   * To replace all special characters with space
   *
   * @param value string
   * @returns string
   */
  replaceUnderscores(value: string): string {
    return value ? value.replace(/[^a-zA-Z0-9-]/g, ' ') : '';
  }
}
