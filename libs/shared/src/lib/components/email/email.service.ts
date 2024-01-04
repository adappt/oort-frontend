/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GET_DATA_SET } from './graphql/queries';
import { Apollo } from 'apollo-angular';

/**
 * Helper functions for emails template
 */
@Injectable({
  providedIn: 'root',
})
export class EmailService {
  public resourcesNameId!: {
    name: string | undefined;
    id: string | undefined;
  }[];
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
      title: `Tab 1`,
      content: `Tab 1 Content`,
      active: true,
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

  public datasetsForm: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    notificationType: [null, Validators.required],
    dataSets: new FormArray([this.createNewDataSetGroup()]),
    recipients: this.recipients,
  });

  /**
   * Constructs the EmailService instance.
   *
   * @param formBuilder
   * @param apollo apollo server
   */
  constructor(private formBuilder: FormBuilder, private apollo: Apollo) {}

  /**
   * To replace all special characters with space
   *
   * @param userValue string
   * @returns string
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
        result = fieldValue !== '';
        break;
      case 'contains':
        result = userValue && fieldValue.includes(userValue as string);
        break;
      case 'doesnotcontain':
        result = userValue && !fieldValue.includes(userValue as string);
        break;
      case 'startswith':
        result = userValue && fieldValue.startsWith(userValue as string);
        break;
      case 'endswith':
        result = userValue && fieldValue.endsWith(userValue as string);
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
}
