import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { clone } from 'lodash';
import {
  Resource,
  ResourceQueryResponse,
} from '../../../../models/resource.model';
import { FIELD_TYPES, FILTER_OPERATORS } from '../../filter/filter.constant';
import { GET_DATA_SET, GET_RESOURCE } from '../../graphql/queries';
import { EmailService } from '../../email.service';
/**
 * Select Distribution component.
 */
@Component({
  selector: 'app-select-distribution',
  templateUrl: './select-distribution.component.html',
  styleUrls: ['./select-distribution.component.scss'],
})
export class SelectDistributionComponent implements OnInit {
  public dataSet?: {
    emails: string[];
    records: any[];
  };
  public dataList!: any[];
  public emails!: string[];
  public dataSetFields!: string[];
  public resource!: Resource;
  public filterFields: FormArray | any = new FormArray([]);
  public cachedElements: Resource[] = [];
  public selectedValue!: string;
  public operators!: { value: string; label: string }[];
  public showEmailTemplate = false;
  public filterQuery: FormGroup | any;
  public cacheFilterData!: string;
  public selectedEmails!: string[] | any;
  public replaceUnderscores: any = this.emailService.replaceUnderscores;
  public filterData = this.emailService.filterData;

  /**
   * Composite filter group.
   *
   * @param fb Angular form builder
   * @param apollo apollo server
   * @param emailService helper functions
   */
  constructor(
    private fb: FormBuilder,
    private apollo: Apollo,
    public emailService: EmailService
  ) {}

  ngOnInit(): void {
    this.apollo
      .query<any>({
        query: GET_DATA_SET,
        variables: {
          layoutId: '653a4c4c75758bbecb8eb041',
          resourceId: '653642baa37293bb1706506e',
        },
      })
      .subscribe(
        (res: {
          data: {
            dataSet: {
              emails: string[];
              records: any[];
            };
          };
        }) => {
          this.dataSet = res.data.dataSet;
          console.log('this.dataSet:', this.dataSet);
          if (this.dataSet) {
            this.dataList = this.dataSet.records.map((record) => record.data);
            if (this.dataList?.length) {
              this.dataSetFields = Object.keys(this.dataList[0]);
            }
            console.log('this.dataList:', this.dataList);
            this.emails = this.dataSet.records
              .map((record) => record.email)
              ?.filter(Boolean);
            console.log('this.emails:', this.emails);
          }
        }
      );
    this.apollo
      .query<ResourceQueryResponse>({
        query: GET_RESOURCE,
        variables: {
          id: '653642baa37293bb1706506e',
        },
      })
      .subscribe((res) => {
        this.resource = res.data.resource;
        console.log('this.resource:', this.resource);
      });
    this.prepareDatasetFilters();
    this.filterQuery.valueChanges.subscribe((res: any) => {
      console.log('filter query', res);
      if (
        !this.cacheFilterData ||
        JSON.stringify(res) !== this.cacheFilterData
      ) {
        this.cacheFilterData = JSON.stringify(res);
        if (res?.filters?.length) {
          const { field, operator, value } = res.filters[0];
          this.selectedEmails = this.dataSet?.records
            ?.map(({ data, email }) => {
              if (
                data[field] &&
                this.filterData(operator, data[field], value)
              ) {
                return email;
              }
              return '';
            })
            .filter(Boolean);
        }
      }
    });
  }

  /**
   * To add the selected emails
   */
  addSelectiveEmails(): void {
    const email = '';
    if (!this.selectedEmails.includes(email)) {
      this.selectedEmails.push(email);
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
      console.log('setField ~ this.operators:', this.operators);
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
   * @returns Formarray
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
    console.log('success success', this.filterFields.value);
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
   * Dynamic Form Submission
   */
  onSubmit(): void {
    const filterLogics = this.filterQuery.value;
    console.log('Final filterLogics', filterLogics);
  }
}
