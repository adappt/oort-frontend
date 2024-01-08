import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { GET_DATA_SET } from '../../graphql/queries';
import { ResourceQueryResponse } from '../../../../models/resource.model';
import { EmailService } from '../../email.service';

/**
 * Component used to display modals regarding layouts
 */
@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit {
  public selectedResourceId: string | undefined = '653642baa37293bb1706506e';
  public dataList!: { [key: string]: string }[];
  public dataListKey!: { [key: string]: string }[];
  headerLogo: string | ArrayBuffer | null = null;
  bannerImage: string | ArrayBuffer | null = null;
  footerLogo: string | ArrayBuffer | null = null;
  bodyString: any;

  /**
   * Creates an instance of PreviewComponent.
   *
   * @param apollo - The Apollo client for making GraphQL queries.
   * @param emailService - The service for email-related operations.
   */
  constructor(private apollo: Apollo, public emailService: EmailService) {}

  ngOnInit(): void {
    this.parseAndReplaceTokensWithTables();
    (document.getElementById('headerHtml') as HTMLInputElement).innerHTML =
      this.emailService.allLayoutdata.headerHtml;
    (document.getElementById('bodyHtml') as HTMLInputElement).innerHTML =
      this.bodyString;

    if (this.emailService.allLayoutdata.headerLogo) {
      this.headerLogo = URL.createObjectURL(
        this.emailService.allLayoutdata.headerLogo
      );
    }

    if (this.emailService.allLayoutdata.footerLogo) {
      this.footerLogo = URL.createObjectURL(
        this.emailService.allLayoutdata.footerLogo
      );
    }

    if (this.emailService.allLayoutdata.bannerImage) {
      this.bannerImage = URL.createObjectURL(
        this.emailService.allLayoutdata.bannerImage
      );
    }

    (document.getElementById('footerHtml') as HTMLInputElement).innerHTML =
      this.emailService.allLayoutdata.footerHtml;
    this.getDataSet();
  }

  /**
   * Parses the email body string and replaces dataset tokens with corresponding HTML tables.
   */
  parseAndReplaceTokensWithTables(): void {
    this.bodyString = this.emailService.allLayoutdata.bodyHtml;
    const tokenRegex = /{{dataset\.([^}]+)}}}/g;
    let match;
    while ((match = tokenRegex.exec(this.bodyString)) !== null) {
      const tabName = match[1]; // Extract the tab name from the token
      const previewData = this.emailService.allPreviewData.find(
        (data) => data.tabName === tabName
      );

      if (previewData) {
        const tableHtml = this.convertPreviewDataToHtml(previewData);
        this.bodyString = this.bodyString.replace(match[0], tableHtml);
      }
    }
  }

  /**
   * Converts the given preview data into an HTML table representation.
   *
   * @param previewData The data to be converted into an HTML table.
   * @returns An HTML string representing the data as a table.
   */
  convertPreviewDataToHtml(previewData: any): string {
    if (!previewData?.dataList?.length) {
      return '<label class="block text-gray-700 text-sm">no data found</label>';
    }

    let tableHtml =
      '<table id="tblPreview" style="width: 95%; margin: auto;" class="dataset-preview border border-blue-600 shadow-xs m-1">';
    tableHtml +=
      '<thead class="bg-blue-600 border-blue-600 shadow-xs text-white">';
    tableHtml +=
      '<tr class="bg-blue-600 border-blue-600 shadow-xs text-white">';
    previewData.dataSetFields.forEach((fieldKeyString: any) => {
      tableHtml += `<th class="bg-blue-600 border-white-600 shadow-xs text-white p-2 text-center">${this.emailService.replaceUnderscores(
        fieldKeyString
      )}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    previewData.dataList.forEach((data: any) => {
      tableHtml += '<tr class="bg-white-600 border-blue-600 text-blue-600">';
      previewData.dataSetFields.forEach((fieldKeyString: any) => {
        tableHtml += `<td class="p-2 border border-blue-600 shadow-xs m-1 text-center">${data[fieldKeyString]}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  }

  /**
   * Retrieves and processes the email notifications dataset.
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
   * @param value The string to process and replace special characters with spaces.
   * @returns The processed string with special characters replaced by spaces.
   */
  replaceUnderscores(value: string): string {
    return value ? value.replace(/[^a-zA-Z0-9-]/g, ' ') : '';
  }
}
