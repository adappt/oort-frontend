import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GET_DATA_SET, GET_EMAIL_NOTIFICATIONS } from './graphql/queries';
import { Apollo } from 'apollo-angular';

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
  public notificationTypes: string[] = ['email', 'alert', 'push notification'];
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
   */
  constructor(private formBuilder: FormBuilder, private apollo: Apollo) {
    this.datasetsForm = this.formBuilder.group({
      name: ['', Validators.required],
      notificationType: [null, Validators.required],
      dataSets: new FormArray([this.createNewDataSetGroup()]),
      recipients: this.recipients,
    });
  }

  /**
   * set selected data set
   *
   * @param dataSet
   */
  setSelectedDataSet(dataSet: any): void {
    this.selectedDataSet = dataSet;
  }

  /**
   * get selected data set
   *@returns dataset
   */
  getSelectedDataSet(): any {
    return this.selectedDataSet;
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
   * @param operator operator string
   * @param fieldValue value present in the Data set
   * @param userValue value provided by user
   * @returns form group
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
   * @returns data set
   */
  fetchDataSet(filterQuery: any) {
    return this.apollo.query<any>({
      query: GET_DATA_SET,
      variables: {
        query: filterQuery,
      },
    });
  }

  getEmailNotifications() {
    return this.apollo.query<any>({
      query: GET_EMAIL_NOTIFICATIONS,
      variables: {},
    });
  }
}
