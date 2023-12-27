import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

/**
 * Helper fuctions for emails template
 */
@Injectable({
  providedIn: 'root',
})
export class EmailService {
  /**
   * Constructs the EmailService instance.
   *
   * @param formBuilder
   */
  constructor(private formBuilder: FormBuilder) {}

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
    if (!operator || !fieldValue) return;
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
        result = fieldValue === '';
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
        console.error('Invalid operator', operator, fieldValue, userValue);
        return;
    }
    return result;
  }
}
