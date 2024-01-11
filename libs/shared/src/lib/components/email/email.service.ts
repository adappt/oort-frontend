import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ADD_EMAIL_NOTIFICATION,
  GET_AND_UPDATE_EMAIL_NOTIFICATION,
  GET_DATA_SET,
  GET_EMAIL_NOTIFICATIONS,
} from './graphql/queries';
import { Apollo } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Helper functions for emails template
 */
@Injectable({
  providedIn: 'root',
})
export class EmailService {
  public datasetsForm!: FormGroup;
  public resourcesNameId!: {
    name: string | undefined;
    id: string | undefined;
  }[];
  public selectedDataSet: any;
  public toEmailFilter!: FormGroup | any;
  public ccEmailFilter!: FormGroup | any;
  public bccEmailFilter!: FormGroup | any;
  public allPreviewData: any[] = [];
  public notificationTypes: string[] = ['email', 'alert', 'push notification'];
  public emailLayout!: any;
  public headerBackgroundColor = '#00205C';
  public headerTextColor = '#FFFFFF';
  public bodyBackgroundColor = '#FFFFFF';
  public bodyTextColor = '#000000';
  public footerBackgroundColor = '#FFFFFF';
  public footerTextColor = '#000000';
  public recipients: {
    distributionListName: string;
    To: string[];
    Cc: string[];
    Bcc: string[];
  } = {
    distributionListName: '',
    To: [],
    Cc: [],
    Bcc: [],
  };
  public tabs: any[] = [
    {
      title: `Block 1`,
      content: `Block 1 Content`,
      active: true,
      index: 0,
    },
  ];
  public allLayoutdata: any = {
    txtSubject: '',
    headerHtml: '',
    bodyHtml: '',
    footerHtml: '',
    bannerImage: null,
    headerLogo: null,
    footerLogo: null,
    headerBackgroundColor: this.headerBackgroundColor,
    headerTextColor: this.headerTextColor,
    bodyBackgroundColor: this.bodyBackgroundColor,
    bodyTextColor: this.bodyTextColor,
    footerBackgroundColor: this.footerBackgroundColor,
    footerTextColor: this.footerTextColor,
  };
  isExisting = true;

  public configId: string | undefined;

  private apiUrl = 'http://localhost:3000/notification/send-email/';

  /**
   * To replace all special characters with space
   *
   * @returns form group
   */
  createNewDataSetGroup(): FormGroup {
    return this.formBuilder.group({
      resource: null,
      name: null,
      pageSize: 10,
      filter: this.formBuilder.group({
        logic: 'and',
        filters: new FormArray([]),
      }),
      fields: [],
      cacheData: {},
    });
  }

  /**
   * Constructs the EmailService instance.
   *
   * @param formBuilder - The FormBuilder instance used to create form groups and controls
   * @param apollo - The Apollo server instance used for GraphQL queries
   * @param http
   */
  constructor(
    private formBuilder: FormBuilder,
    private apollo: Apollo,
    private http: HttpClient
  ) {
    this.setDatasetForm();
  }

  /**
   *
   */
  setDatasetForm() {
    this.datasetsForm = this.formBuilder.group({
      name: ['', Validators.required],
      notificationType: [null, Validators.required],
      applicationId: [''],
      dataSets: new FormArray([this.createNewDataSetGroup()]),
      recipients: this.recipients,
      emailLayout: this.emailLayout,
      schedule: [''],
    });
  }

  /**
   * Sets the selected data set.
   *
   * @param dataSet The data set to be selected.
   */
  setSelectedDataSet(dataSet: any): void {
    this.selectedDataSet = dataSet;
  }

  /**
   * get selected data set
   *
   *@returns dataset
   */
  getSelectedDataSet(): any {
    return this.selectedDataSet;
  }

  /**
   * Sets the preview data for all tabs.
   *
   * @param previewData An array of preview data objects for each tab.
   */
  setAllPreviewData(previewData: any[]): void {
    for (let i = 0; i < previewData.length; i++) {
      console.log(previewData[i].tabName);
    }
    this.allPreviewData = previewData;
  }

  /**
   * Retrieves all preview data objects.
   *
   * @returns An array of all preview data objects.
   */
  getAllPreviewData(): any[] {
    return this.allPreviewData;
  }

  /**
   * Retrieves all preview data objects.
   *
   */
  patchEmailLayout(): void {
    this.emailLayout = {
      subject: this.allLayoutdata?.txtSubject,
      header: {
        headerHtml: this.allLayoutdata?.headerHtml,
        headerLogo: this.allLayoutdata?.headerLogo,
        headerBackgroundColor: this.allLayoutdata.headerBackgroundColor,
        headerTextColor: this.allLayoutdata.headerTextColor,
      },
      body: {
        bodyHtml: this.allLayoutdata?.bodyHtml,
        bodyBackgroundColor: this.allLayoutdata.bodyBackgroundColor,
        bodyTextColor: this.allLayoutdata.bodyTextColor,
      },
      banner: this.allLayoutdata?.bannerImage,
      footer: {
        footerHtml: this.allLayoutdata?.footerHtml,
        footerLogo: this.allLayoutdata?.footerLogo,
        footerBackgroundColor: this.allLayoutdata.footerBackgroundColor,
        footerTextColor: this.allLayoutdata.footerTextColor,
      },
    };
    this.datasetsForm.get('emailLayout')?.setValue(this.emailLayout);
  }

  /**
   * Retrieves preview data for a specific tab by name.
   *
   * @param tabName The name of the tab to retrieve preview data for.
   * @returns The preview data object for the specified tab, if found.
   */
  getAllPreviewDataByTabName(tabName: string): any {
    return this.allPreviewData.find((preview) => preview.tabName === tabName);
  }

  /**
   * To replace all special characters with whitespace
   *
   * @param userValue The user's input value
   * @returns A string where all non-alphanumeric and non-hyphen characters are replaced with a whitespace.
   */
  replaceUnderscores(userValue: string): string {
    return userValue ? userValue.replace(/[^a-zA-Z0-9-]/g, ' ') : '';
  }

  /**
   * Preparing dataset filters dynamically
   *
   * @returns form group
   */
  prepareDatasetFilters(): FormGroup {
    return this.formBuilder.group({
      logic: 'and',
      filters: new FormArray([]),
    });
  }

  /**
   * Preparing dataset filters dynamically
   *
   * @param operator The comparison operator to be used in the filter
   * @param fieldValue The value of the field to be compared
   * @param userValue The value provided by the user to compare against the field value
   * @returns The result of the filter operation or undefined if no operator is provided
   */
  filterData(
    operator: string,
    fieldValue: string | any,
    userValue: string | Date | number
  ) {
    let result;
    if (!operator) return;
    switch (operator) {
      case 'eq':
        result = userValue && fieldValue === userValue;
        break;
      case 'neq':
        result = userValue && fieldValue !== userValue;
        break;
      case 'gte':
        result = userValue && fieldValue >= userValue;
        break;
      case 'gt':
        result = userValue && fieldValue > userValue;
        break;
      case 'lte':
        result = userValue && fieldValue <= userValue;
        break;
      case 'lt':
        result = userValue && fieldValue < userValue;
        break;
      case 'isnull':
        result = fieldValue === null;
        break;
      case 'isnotnull':
        result = fieldValue !== null;
        break;
      case 'isempty':
        result = fieldValue === '' || !fieldValue;
        break;
      case 'isnotempty':
        result = fieldValue !== '' && fieldValue !== undefined;
        break;
      case 'contains':
        result =
          fieldValue && userValue && fieldValue.includes(userValue as string);
        break;
      case 'doesnotcontain':
        result =
          fieldValue && userValue && !fieldValue.includes(userValue as string);
        break;
      case 'startswith':
        result =
          fieldValue && userValue && fieldValue.startsWith(userValue as string);
        break;
      case 'endswith':
        result =
          fieldValue && userValue && fieldValue.endsWith(userValue as string);
        break;
      case 'in':
        result = userValue && (userValue as string | number) in fieldValue;
        break;
      case 'notin':
        result = userValue && !((userValue as string | number) in fieldValue);
        break;
      default:
        return;
    }
    return result;
  }

  /**
   * To get data set
   *
   * @param filterQuery query details to fetch data set
   * @returns the dataset.
   */
  fetchDataSet(filterQuery: any) {
    return this.apollo.query<any>({
      query: GET_DATA_SET,
      variables: {
        query: filterQuery,
      },
    });
  }

  /**
   * Handles the user selection of a header logo file.
   *
   * @param file The selected file or null if no file is selected.
   */
  onHeaderLogoSelected(file: File | null): void {
    this.allLayoutdata.headerLogo = file;
  }

  /**
   * Handles the user selection of a banner image file.
   *
   * @param file The selected file or null if no file is selected.
   */
  onBannerSelected(file: File | null): void {
    this.allLayoutdata.bannerImage = file;
  }

  /**
   * Handles the user selection of a footer logo file.
   *
   * @param file The selected file or null if no file is selected.
   */
  onFooterLogoSelected(file: File | null): void {
    this.allLayoutdata.footerLogo = file;
  }

  /**
   * Retrieves email notifications.
   *
   * @param id
   * @returns Email notifications query result.
   */
  getEmailNotifications(id: string) {
    return this.apollo.query<any>({
      query: GET_EMAIL_NOTIFICATIONS,
      variables: {
        applicationId: id,
      },
    });
  }

  /**
   * Retrieves email notificationIds.
   *
   */
  // getEmailNotificationIds() {
  //   const Ids: string[] = [];
  //   this.getEmailNotifications().subscribe((res: any) => {
  //     res?.data?.emailNotifications?.edges?.forEach((ele: any) => {
  //       Ids.push(ele.node.id);
  //     });
  //     return Ids;
  //   });
  // }

  /**
   * Adds an email notification with the provided data.
   *
   * @param data The notification data to be added.
   * @returns A query result after adding the email notification.
   */
  addEmailNotification(data: any) {
    return this.apollo.query<any>({
      query: ADD_EMAIL_NOTIFICATION,
      variables: {
        notification: data,
      },
    });
  }

  /**
   * Get an email notification with the provided id.
   *
   * @param id The notification data id.
   * @returns A query result .
   */
  getEmailNotification(id: string, applicationId: string) {
    return this.apollo.query<any>({
      query: GET_AND_UPDATE_EMAIL_NOTIFICATION,
      variables: {
        notification: null,
        editEmailNotificationId: id,
        applicationId: applicationId,
      },
    });
  }

  /**
   * Delete an email notification with the provided id.
   *
   * @param id The notification data id.
   * @returns A query result .
   */
  deleteEmailNotification(id: string, applicationId: string) {
    return this.apollo.query<any>({
      query: GET_AND_UPDATE_EMAIL_NOTIFICATION,
      variables: {
        notification: {
          isDeleted: 1,
          applicationId: applicationId,
        },
        editEmailNotificationId: id,
      },
    });
  }

  /**
   * sending emails to endpoint
   *
   * @param configId
   * @param emailData data to be send
   * @returns rest post to end point
   */
  sendEmail(configId: string | undefined, emailData: any): Observable<any> {
    console.log(this.apiUrl);
    //return this.http.post<any>(this.apiUrl, emailData);
    const urlWithConfigId = `${this.apiUrl}${configId}`;
    return this.http.post<any>(urlWithConfigId, emailData);
  }
}
