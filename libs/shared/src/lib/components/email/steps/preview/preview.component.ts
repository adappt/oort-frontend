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
   * Retrieves the style based on the item name.
   *
   * @param item The item you are retriving the inline styling of.
   * @returns The inline styling of the item.
   */
  getEmailStyle(item: string): string {
    const styles: { [key: string]: string } = {}; // Define the type of the styles object
    switch (item) {
      case 'header':
        styles[
          'headerStyle'
        ] = `text-align: center; margin: 0.5rem auto; padding: 0.5rem; width: 100%; background-color: ${this.emailService.headerBackgroundColor}; color: ${this.emailService.headerTextColor}; font-family: 'Source Sans Pro', Roboto, 'Helvetica Neue', sans-serif;`;
        break;
      case 'body':
        styles[
          'bodyStyle'
        ] = `text-align: center; margin: 0.5rem auto; padding: 0.5rem; width: 90%; background-color: ${this.emailService.bodyBackgroundColor}; color: ${this.emailService.bodyTextColor};`;
        break;
      case 'footer':
        styles[
          'footerStyle'
        ] = `margin: 0.5rem auto; display: flex; width: 90%; background-color: ${this.emailService.footerBackgroundColor};`;
        break;
      case 'footerImg':
        styles[
          'footerImgStyle'
        ] = `margin: 0.5rem; display: block; width: 20%; padding: 0.25rem 0.5rem; border-radius: 0.375rem; max-width: 100%; background-color: ${this.emailService.footerBackgroundColor};`;
        break;
      case 'footerHtml':
        styles[
          'footerHtmlStyle'
        ] = `flex-grow: 1; width: 80%; background-color: white; overflow: hidden; background-color: ${this.emailService.footerBackgroundColor}; color: ${this.emailService.footerTextColor}; font-family: 'Source Sans Pro', Roboto, 'Helvetica Neue', sans-serif;`;
        break;
      case 'banner':
        styles[
          'bannerStyle'
        ] = `display: flex; justify-content: space-between; align-items: center; width: 90%; margin: auto; background-color: white;`;
        break;
      case 'whoLogo':
        styles[
          'whoLogoStyle'
        ] = `width: 25%; height: auto; object-fit: contain;`;
        break;
      case 'headerLogo':
        styles[
          'headerLogoStyle'
        ] = `width: 25%; height: auto; object-fit: contain;`;
        break;
      case 'bannerImage':
        styles[
          'bannerImageStyle'
        ] = `width: 25%; height: auto; object-fit: contain;`;
        break;
      case 'copyright':
        styles[
          'copyrightStyle'
        ] = `text-align: center; width: 100%; height: 100%; box-sizing: border-box; background-color: #00205C; color: white; font-family: 'Source Sans Pro', Roboto, 'Helvetica Neue', sans-serif;`;
        break;
      case 'container':
        styles[
          'containerStyle'
        ] = `border: 2px solid #2b6cb0; width: 100%; height: 100%; box-sizing: border-box;`;
        break;
      default:
        return '';
    }
    this.emailService.setEmailStyles(styles);
    return styles[item + 'Style'] || '';
  }

  /**
   * Retrieves the table object based on the item name.
   *
   * @param item The table part you are retrieving the inline styling of.
   * @returns The inline style of the item.
   */
  getTableStyle(item: string): string {
    const styles: { [key: string]: string } =
      this.emailService.defaultTableStyle; // Use the defaultTableStyle from the EmailService
    switch (item) {
      case 'table':
        styles['tableStyle'] =
          'border-width: 1px; border-color: rgb(228, 228, 228); width: 95%; margin: auto; box-shadow: 0 0 #0000; margin: 0.25rem';
        break;
      case 'thead':
        styles['theadStyle'] =
          'font-family: inherit; font-size: 14px; background-color: #00205C; color: #FFFFFF; border-color: #00205C; box-shadow: 0 0 #0000;';
        break;
      case 'tbody':
        styles['tbodyStyle'] = 'font-family: inherit; font-size: 14px;';
        break;
      case 'th':
        styles['thStyle'] =
          'text-align: left; padding-left: 20px; background-color: #00205C; color: #FFFFFF; padding: 0.5rem; text-align: center';
        break;
      case 'tr':
        styles['trStyle'] =
          'background-color: #FFFFFF; border-color: #00205C; color: #00205C;';
        break;
      case 'td':
        styles['tdStyle'] =
          'text-align: left; padding-left: 20px; border-color: rgb(228, 228, 228); padding: 0.5rem; border: 1px solid #00205C; box-shadow: 0 0 #0000; margin: 0.25rem; text-align: center;';
        break;
    }
    this.emailService.setTableStyles(styles); // Update the styles in the EmailService
    return styles[item + 'Style'] || '';
  }

  /**
   * Parses the email body string and replaces dataset tokens with corresponding HTML tables.
   */
  parseAndReplaceTokensWithTables(): void {
    this.bodyString = this.emailService.allLayoutdata.bodyHtml;
    const tokenRegex = /{{([^}]+)}}/g;
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
      return '<label style="display: block; color: #4a5568; font-size: 0.875rem;">no data found</label>';
    }

    const theadHtml = previewData.dataSetFields
      .map(
        (fieldKeyString: any) =>
          `<th style="${this.getTableStyle(
            'th'
          )}">${this.emailService.replaceUnderscores(fieldKeyString)}</th>`
      )
      .join('');

    const tbodyHtml = previewData.dataList
      .map(
        (data: any) =>
          `<tr style="${this.getTableStyle('tr')}">${previewData.dataSetFields
            .map(
              (fieldKeyString: any) =>
                `<td style="${this.getTableStyle('td')}">${
                  data[fieldKeyString]
                }</td>`
            )
            .join('')}</tr>`
      )
      .join('');

    const tableHtml = `
  <table id="tblPreview" style="${this.getTableStyle(
    'table'
  )}" class="dataset-preview">
    <thead style="${this.getTableStyle('thead')}">
      <tr style="${this.getTableStyle('tr')}">
        ${theadHtml}
      </tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
  </table>
`;
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
