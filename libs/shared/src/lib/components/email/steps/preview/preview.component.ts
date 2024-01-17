import { Component, OnInit, OnDestroy } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { EmailService } from '../../email.service';
import { Subscription } from 'rxjs';

/**
 * Component used to display modals regarding layouts
 */
@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, OnDestroy {
  public selectedResourceId: string | undefined = '653642baa37293bb1706506e';
  public dataList!: { [key: string]: string }[];
  public dataListKey!: { [key: string]: string }[];
  public headerLogo: string | ArrayBuffer | null = null;
  public bannerImage: string | ArrayBuffer | null = null;
  public footerLogo: string | ArrayBuffer | null = null;
  public bodyString: string | any;
  private querySubscription: Subscription | null = null;

  /**
   * Creates an instance of PreviewComponent.
   *
   * @param apollo - The Apollo client for making GraphQL queries.
   * @param emailService - The service for email-related operations.
   */
  constructor(private apollo: Apollo, public emailService: EmailService) {}

  ngOnInit(): void {
    this.replaceTokensWithTables();
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
      case 'bannerImage':
        styles[
          'bannerImageStyle'
        ] = `max-width: 100%; height: auto; object-fit: contain;`;
        break;
      case 'header':
        styles[
          'headerStyle'
        ] = `margin: 0.5rem auto; display: flex; width: 100%; background-color: ${this.emailService.headerBackgroundColor};`;
        break;
      case 'headerLogo':
        styles[
          'headerLogoStyle'
        ] = `margin: 0.5rem; display: block; width: 20%; padding: 0.25rem 0.5rem; border-radius: 0.375rem; background-color: ${this.emailService.headerBackgroundColor};`;
        break;
      case 'headerHtml':
        styles[
          'headerHtmlStyle'
        ] = `text-align: center; margin: 0.5rem auto; padding: 0.5rem; width: 80%; background-color: white; overflow: hidden; background-color: ${this.emailService.headerBackgroundColor}; color: ${this.emailService.headerTextColor}; font-family: 'Source Sans Pro', Roboto, 'Helvetica Neue', sans-serif;`;
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
        ] = `margin: 0.5rem; display: block; width: 20%; padding: 0.25rem 0.5rem; border-radius: 0.375rem; background-color: ${this.emailService.footerBackgroundColor};`;
        break;
      case 'footerHtml':
        styles[
          'footerHtmlStyle'
        ] = `width: 80%; background-color: white; overflow: hidden; background-color: ${this.emailService.footerBackgroundColor}; color: ${this.emailService.footerTextColor}; font-family: 'Source Sans Pro', Roboto, 'Helvetica Neue', sans-serif;`;
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
          'width: auto; max-width: 95%; margin: 0.25rem auto; box-shadow: 0 0 #0000; overflow:auto; border: none;';
        break;
      case 'thead':
        styles['theadStyle'] =
          'font-family: inherit; font-size: 14px; background-color: #00205C; color: #FFFFFF; border-color: #00205C; box-shadow: 0 0 #0000; text-transform: capitalize;';
        break;
      case 'tbody':
        styles['tbodyStyle'] = 'font-family: inherit; font-size: 14px;';
        break;
      case 'th':
        styles['thStyle'] =
          'text-align: left; padding-left: 20px; background-color: #00205C; color: #FFFFFF; padding: 0.5rem; text-align: center';
        break;
      case 'tr':
        styles['trStyle'] = 'background-color: #FFFFFF;';
        break;
      case 'td':
        styles['tdStyle'] =
          'text-align: left; padding-left: 20px; padding: 0.5rem; box-shadow: 0 0 #0000; margin: 0.25rem; text-align: center;';
        break;
    }
    this.emailService.setTableStyles(styles); // Update the styles in the EmailService
    return styles[item + 'Style'] || '';
  }

  /**
   * Parses the email body string and replaces dataset tokens with corresponding HTML tables.
   */
  replaceTokensWithTables(): void {
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
   * To replace all special characters with space
   *
   * @param value The string to process and replace special characters with spaces.
   * @returns The processed string with special characters replaced by spaces.
   */
  replaceUnderscores(value: string): string {
    return value ? value.replace(/[^a-zA-Z0-9-]/g, ' ') : '';
  }

  ngOnDestroy(): void {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
  }
}
