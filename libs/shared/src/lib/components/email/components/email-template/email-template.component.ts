import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { clone } from 'lodash';
import { EmailService } from '../../email.service';
import { FIELD_TYPES, FILTER_OPERATORS } from '../../filter/filter.constant';
import { ResourceQueryResponse } from '../../../../models/resource.model';
import { GET_RESOURCE } from '../../graphql/queries';
import { Apollo } from 'apollo-angular';

/**
 * Email template to create distribution list
 */
@Component({
  selector: 'shared-email-template',
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.scss'],
})
export class EmailTemplateComponent implements OnInit, OnDestroy {
  public dataSet?: {
    emails: string[];
    records: any[];
  };
  public dataList!: any[];
  public emails: string[] = [];
  public resource!: any;
  public selectedValue!: string;
  public cacheFilterData!: string;
  public selectedDataset: any | undefined = '';
  public dataSetEmails!: string[];
  public dataSetFields!: string[];
  public filterQuery: FormGroup | any | undefined;
  public selectedEmails: string[] | any = [];
  public operators!: { value: string; label: string }[];
  public filterFields: FormArray | any = new FormArray([]);
  public replaceUnderscores: any = this.emailService.replaceUnderscores;
  public datasetsForm: FormGroup | any = this.emailService.datasetsForm;
  public filterData = this.emailService.filterData;
  public isDropdownVisible = false;
  public dataSets: any;
  public selectField = '';
  public emailValidationError = '';
  @Output() emailLoad = new EventEmitter<{
    emails: string[];
    emailFilter: any;
  }>();
  @Input() emailBackLoad: string[] | undefined;
  @Input() emailFilter: FormGroup | undefined;
  @Output() listChange = new EventEmitter<void>();
  @Input() existingId = '';
  public activeSegmentIndex = 0;
  public segmentButtons = [
    'Add Manually',
    'Select From List',
    'Select With Filter',
  ];
  public selectedItemIndexes: number[] | any[] = [];
  public isAllSelected = false;
  public loading = false;

  /**
   * Composite filter group.
   *
   * @param fb Angular form builder
   * @param emailService helper functions
   * @param apollo
   */
  constructor(
    private fb: FormBuilder,
    public emailService: EmailService,
    private apollo: Apollo
  ) {}

  ngOnInit(): void {
    this.selectedDataset = this.emailService.getSelectedDataSet();
    if (
      this.selectedDataset &&
      Object.keys(this.selectedDataset?.cacheData).length &&
      this.selectedDataset?.cacheData?.dataSetResponse
    ) {
      const { dataList, resource, dataSetFields, dataSetResponse } =
        this.selectedDataset.cacheData;
      this.dataList = dataList;
      this.resource = resource;
      this.dataSetFields = dataSetFields;
      this.dataSet = dataSetResponse;
      this.dataSetEmails = dataSetResponse?.records
        ?.map((record: { email: string }) => record.email)
        ?.filter(Boolean)
        ?.flat();
      this.emails = [...this.dataSetEmails];
    }
    this.selectedEmails = this.emailBackLoad;
    this.dataSets = this.datasetsForm.value.dataSets;
    this.prepareDatasetFilters();
    if (this.emailFilter) {
      this.filterQuery = this.emailFilter;
      this.filterFields = this.filterQuery.get('filters') as FormArray;
      this.emailFilter.value?.filters.forEach((obj: any) => {
        this.setField(obj?.field);
      });
    }
    this.filterFields = this.filterQuery.get('filters') as FormArray;
  }

  /**
   * To bind the dataset details
   *
   * @param dataSet data of the data set
   */
  bindDataSetDetails(dataSet: any): void {
    if (dataSet === undefined) {
      this.dataList = [];
      this.resource = [];
      this.dataSetFields = [];
      return;
    }
    if (
      Object.keys(dataSet?.cacheData).length &&
      dataSet?.cacheData.dataSetResponse
    ) {
      this.loading = true;
      const { dataList, resource, dataSetFields, dataSetResponse } =
        dataSet.cacheData;
      this.dataList = dataList;
      this.resource = resource;
      this.dataSetFields = dataSetFields;
      this.dataSet = dataSetResponse;
      this.dataSetEmails = dataSetResponse?.records
        ?.map((record: { email: string }) => record.email)
        ?.filter(Boolean)
        ?.flat();
      this.emails = [...this.dataSetEmails];
      this.emailService.setSelectedDataSet(dataSet);
      this.loading = false;
    } else {
      this.loading = true;
      this.apollo
        .query<ResourceQueryResponse>({
          query: GET_RESOURCE,
          variables: {
            id: dataSet.resource.id,
          },
        })
        .subscribe((res) => {
          if (res?.data?.resource) {
            this.resource = res.data?.resource;
            dataSet.pageSize = 50;
            this.emailService.fetchDataSet(dataSet).subscribe((res) => {
              if (res?.data.dataSet) {
                this.dataSet = res?.data?.dataSet;
                this.dataSetEmails = res?.data?.dataSet?.emails;
                this.dataList = res.data?.dataSet?.records;
                this.dataSetFields = dataSet.fields.map((ele: any) => ele.name);
                this.emails = [...this.dataSetEmails];
                dataSet.cacheData.dataSetResponse = this.dataSet;
                dataSet.cacheData.dataList = this.dataList;
                dataSet.cacheData.dataSetFields = this.dataSetFields;
                dataSet.cacheData.resource = this.resource;
                this.emailService.setSelectedDataSet(dataSet);
              }
              this.loading = false;
            });
          }
        });
    }
  }

  /**
   * Set field.
   *
   * @param event field name
   */
  public setField(event: any) {
    const name = event?.target?.value.replace(/^_+/, '') ?? event;
    const fields = clone(this.resource?.metadata);
    const field = fields.find(
      (x: { name: any }) => x.name === name.split('-')[0]
    );
    let type: { operators: any; editor: string; defaultOperator: string } = {
      operators: undefined,
      editor: '',
      defaultOperator: '',
    };
    if (field) {
      type = {
        ...FIELD_TYPES.find((x) => x.editor === (field.type || 'text')),
        ...field.filter,
      };
      if (!Object.keys(type).length) {
        type = {
          editor: 'text',
          defaultOperator: 'eq',
          operators: [
            'eq',
            'neq',
            'contains',
            'doesnotcontain',
            'startswith',
            'endswith',
            'isnull',
            'isnotnull',
            'isempty',
            'isnotempty',
          ],
        };
      }
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
   * fetching data from object
   *
   * @param data
   * @param field
   * @returns data
   */
  fetchValue(data: any, field: string) {
    const keys = field.split('.');
    let result = data;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return null;
      }
    }

    return result;
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
    this.selectedEmails.splice(chipIndex, 1);
    this.listChange.emit();
    // if (this.dataSetEmails.includes(email) && !this.emails.includes(email)) {
    //   this.emails.push(email);
    // }
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
    if (this.selectedEmails.length > 0) {
      this.emailLoad.emit({
        emails: this.selectedEmails,
        emailFilter: this.filterQuery,
      });
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
      this.emailValidationError = '';
      this.listChange.emit();
    } else if (!emailRegex.test(element.value)) {
      this.emailValidationError = 'Invalid Email Address';
    }
  }

  /**
   *
   * @param element HTML input element
   */
  validateEmail(element: HTMLInputElement): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValidationError = emailRegex.test(element.value)
      ? ''
      : 'Invalid Email Address';
    if (element.value === '') {
      this.emailValidationError = '';
    }
  }

  /**
   * To show/hide the dropdown content
   */
  toggleDropdown() {
    if (this.emails?.length) {
      this.selectedEmails.forEach((email: string) => {
        const indexToRemove = this.emails.indexOf(email);
        if (indexToRemove !== -1) {
          this.emails.splice(indexToRemove, 1);
        }
      });
    }
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  /**
   * Dynamic Form Submission
   */
  onSubmit(): void {
    const filterLogics = this.filterQuery.value;
    console.log('🚀 filterLogics:', filterLogics);
  }

  ngOnDestroy(): void {
    this.emailLoad.emit({
      emails: this.selectedEmails,
      emailFilter: this.filterQuery,
    });
  }

  /**
   * selecting all email items from the dataset list
   *
   * @param $event checkbox selection Event
   */
  selectAllEmailItems($event: any): void {
    this.isAllSelected = $event.target.checked;
    if (this.isAllSelected) {
      this.selectedItemIndexes = this.dataList?.map((_, index) => index);
    } else {
      this.selectedItemIndexes = [];
    }
  }

  /**
   * selecting items from the table
   *
   * @param rowIndex
   * @param $event
   */
  selectUnselectIndividualEmails(rowIndex: number, $event: any): void {
    if ($event.target.checked) {
      this.selectedItemIndexes.push(rowIndex);
    } else {
      this.selectedItemIndexes = this.selectedItemIndexes?.map(
        (item: number) => {
          if (item !== rowIndex) {
            return item;
          } else {
            return undefined;
          }
        }
      );
    }
    this.isAllSelected = false;
  }

  /**
   * to add all the selected emails into the list
   */
  addSelectedEmails(): void {
    this.selectedItemIndexes?.forEach((itemIndex: number) => {
      /* duplicate check */
      if (this.selectedEmails.indexOf(this.emails[itemIndex]) === -1) {
        if (itemIndex !== undefined) {
          this.selectedEmails.push(this.emails[itemIndex]);
        }
      }
    });
    if (this.selectedEmails.length > 0) {
      this.emailLoad.emit({
        emails: this.selectedEmails,
        emailFilter: this.filterQuery,
      });
    }
    this.selectedItemIndexes = [];
    this.isAllSelected = false;
  }

  /**
   * apply filter via dataset filters
   */
  applyFilter(): void {
    const filterObject = this.filterQuery.value;
    if (filterObject?.filters?.length && filterObject?.logic) {
      const { logic } = filterObject;
      let emailsList: string[] | undefined;
      if (logic === 'and') {
        emailsList = this.dataSet?.records
          ?.map((data) => {
            if (
              filterObject.filters.every((filter: any) =>
                this.filterData(
                  filter.operator,
                  this.fetchValue(data, filter.field.replace(/-/g, '.'))
                    ?.toString()
                    .toLowerCase(),
                  filter?.value?.toLowerCase()
                )
              )
            ) {
              return data.email;
            }
          })
          ?.filter(Boolean);
      } else if (logic === 'or') {
        emailsList = this.dataSet?.records
          ?.map((data) => {
            if (
              filterObject.filters.some(
                (filter: any) =>
                  data?.filter?.field &&
                  this.filterData(
                    filter.operator,
                    this.fetchValue(data, filter.field.replace(/-/g, '.'))
                      ?.toString()
                      .toLowerCase(),
                    filter?.value?.toLowerCase()
                  )
              )
            ) {
              return data.email;
            }
          })
          ?.filter(Boolean);
      }
      if (emailsList?.length) {
        this.selectedEmails = [
          ...new Set([...this.selectedEmails, ...emailsList]),
        ];
      }
      if (this.selectedEmails.length > 0) {
        this.emailLoad.emit({
          emails: this.selectedEmails,
          emailFilter: this.filterQuery,
        });
      }
    }
  }

  /**
   * To clear the persisted data
   */
  clearDatasetSelection(): void {
    this.dataList = [];
    this.resource = [];
    this.dataSetFields = [];
    this.filterFields = new FormArray([]);

    const filterConditionCount = this.datasetFilterInfo.controls.length;
    if (filterConditionCount !== 0) {
      for (
        let filterControlIndex = 0;
        filterControlIndex < filterConditionCount;
        filterControlIndex++
      ) {
        /* this should be always first index.
        if we remove element from form array element indexes will be automatically rearranging */
        this.datasetFilterInfo.removeAt(0);
      }
    }
  }
}
