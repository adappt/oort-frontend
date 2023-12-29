import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { clone } from 'lodash';
import { debounceTime } from 'rxjs/operators';
import { Resource } from '../../../../models/resource.model';
import { EmailService } from '../../email.service';
import { FIELD_TYPES, FILTER_OPERATORS } from '../../filter/filter.constant';

/**
 * Email template to create distribution list
 */
@Component({
  selector: 'shared-email-template',
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.scss'],
})
export class EmailTemplateComponent implements OnInit {
  public dataSet?: {
    emails: string[];
    records: any[];
  };
  public dataList!: any[];
  public emails!: string[];
  public resource!: Resource;
  public selectedValue!: string;
  public cacheFilterData!: string;
  public dataSetEmails!: string[];
  public dataSetFields!: string[];
  public filterQuery: FormGroup | any;
  public selectedEmails: string[] | any = [];
  public operators!: { value: string; label: string }[];
  public filterFields: FormArray | any = new FormArray([]);
  public replaceUnderscores: any = this.emailService.replaceUnderscores;
  public datasetsForm: FormGroup | any = this.emailService.datasetsForm;
  public filterData = this.emailService.filterData;
  public isDropdownVisible = false;
  public dataSets: any;

  /**
   * Composite filter group.
   *
   * @param fb Angular form builder
   * @param emailService helper functions
   */
  constructor(private fb: FormBuilder, public emailService: EmailService) {}

  ngOnInit(): void {
    this.dataSets = this.datasetsForm.value.dataSets;
    this.prepareDatasetFilters();
    this.filterQuery.valueChanges
      .pipe(debounceTime(1500))
      .subscribe((res: any) => {
        if (res?.filters?.length && res?.logic) {
          const { logic } = res;
          let emailsList: string[] | undefined;
          if (logic === 'and') {
            emailsList = this.dataSet?.records
              ?.map(({ data, email }) => {
                if (
                  res.filters.every(
                    (filter: any) =>
                      data[filter.field] &&
                      this.filterData(
                        filter.operator,
                        data[filter.field]?.toLowerCase(),
                        filter?.value?.toLowerCase()
                      )
                  )
                ) {
                  return email;
                }
              })
              ?.filter(Boolean);
          } else if (logic === 'or') {
            emailsList = this.dataSet?.records
              ?.map(({ data, email }) => {
                if (
                  res.filters.some(
                    (filter: any) =>
                      data[filter.field] &&
                      this.filterData(
                        filter.operator,
                        data[filter.field]?.toLowerCase(),
                        filter?.value?.toLowerCase()
                      )
                  )
                ) {
                  return email;
                }
              })
              ?.filter(Boolean);
          }
          if (emailsList?.length) {
            this.selectedEmails = [
              ...new Set([...this.selectedEmails, ...emailsList]),
            ];
          }
        }
      });
  }

  /**
   * To bind the dataset details
   *
   * @param dataSet data of the data set
   */
  bindDataSetDetails(dataSet: any): void {
    if (dataSet.cacheData) {
      const { dataList, resource, dataSetFields, dataSetResponse } =
        dataSet.cacheData;
      this.dataList = dataList;
      this.resource = resource;
      this.dataSetFields = dataSetFields;
      this.dataSet = dataSetResponse;
      this.dataSetEmails = dataSetResponse.records
        ?.map((record: { email: string }) => record.email)
        ?.filter(Boolean)
        ?.flat();
      this.emails = [...this.dataSetEmails];
    }
  }

  /**
   * Set field.
   *
   * @param event field name
   */
  public setField(event: any) {
    const name = event.target.value;
    const fields = clone(this.resource?.fields);
    const field = fields.find((x: { name: any }) => x.name === name);
    if (field) {
      const type = {
        ...FIELD_TYPES.find((x) => x.editor === field.type),
        ...field.filter,
      };
      this.operators = FILTER_OPERATORS.filter((x) =>
        type?.operators?.includes(x.value)
      );
    }
  }

  /**
   * Preparing dataset filters dynamically
   */
  prepareDatasetFilters(): void {
    this.filterQuery = this.fb.group({
      logic: 'and',
      filters: new FormArray([]),
    });
  }

  /**
   * To get the new dataset filter
   *
   *  @returns FormGroup
   */
  get getNewFilterFields(): FormGroup {
    return this.fb.group({
      field: '',
      operator: '',
      value: '',
    });
  }

  /**
   * To
   *
   * @returns Form array
   */
  get datasetFilterInfo(): FormArray {
    return this.filterQuery.get('filters') as FormArray;
  }

  /**
   * To add new dataset filter in the form
   */
  addNewDatasetFilter(): void {
    this.filterFields = this.filterQuery.get('filters') as FormArray;
    this.filterFields.push(this.getNewFilterFields);
  }

  /**
   * Remove filter at index
   *
   * @param index filter index
   */
  deleteDatasetFilter(index: number): void {
    this.datasetFilterInfo.removeAt(index);
  }

  /**
   * Remove email Id from the list
   *
   * @param chipIndex chip index
   */
  removeEmailChip(chipIndex: number): void {
    const [email] = this.selectedEmails.splice(chipIndex, 1);

    if (this.dataSetEmails.includes(email) && !this.emails.includes(email)) {
      this.emails.push(email);
    }
  }

  /**
   * To add the selected emails
   *
   * @param emailIndex index of the email
   */
  addSelectiveEmails(emailIndex: number): void {
    const [email] = this.emails.splice(emailIndex, 1);
    if (!this.selectedEmails.includes(email)) {
      this.selectedEmails.push(email);
    }
  }

  /**
   * To add the selected emails manually
   *
   * @param element Input Element
   */
  addEmailManually(element: HTMLInputElement): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      emailRegex.test(element.value) &&
      !this.selectedEmails.includes(element?.value)
    ) {
      this.selectedEmails.push(element.value);
      element.value = '';
    } else if (!emailRegex.test(element.value)) {
      alert(`not valid mail ${element.value}`);
    }
  }

  /**
   * To show/hide the dropdown content
   */
  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  /**
   * Dynamic Form Submission
   */
  onSubmit(): void {
    const filterLogics = this.filterQuery.value;
    console.log('🚀 filterLogics:', filterLogics);
  }
}
