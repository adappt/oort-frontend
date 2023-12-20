import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Apollo, QueryRef } from 'apollo-angular';
import { clone } from 'lodash';
import { Observable } from 'rxjs';
import {
  Resource,
  ResourceQueryResponse,
  ResourcesQueryResponse,
} from '../../../../models/resource.model';
import { FIELD_TYPES, FILTER_OPERATORS } from './filter/filter.constant';
import { GET_RESOURCE, GET_RESOURCES } from './graphql/queries';

/** Default items per query, for pagination */
const ITEMS_PER_PAGE = 10;

/**
 * create-datasetpage component.
 */
@Component({
  selector: 'app-create-dataset',
  templateUrl: './create-dataset.component.html',
  styleUrls: ['./create-dataset.component.scss'],
})
export class CreateDatasetComponent implements OnInit {
  public tabIndex = 'filter';
  public resourcesQuery!: QueryRef<ResourcesQueryResponse>;
  public availableQueries?: Observable<any[]>;
  public resource?: Resource;
  public filterFields: FormArray | any = new FormArray([]);
  public cachedElements: Resource[] = [];
  public selectedValue: string | undefined;
  public operators?: { value: string; label: string }[];
  public dataSetFiltersFormGroup: FormGroup | any;

  /**
   * Composite filter group.
   *
   * @param fb Angular form builder
   * @param apollo server
   */
  constructor(private fb: FormBuilder, private apollo: Apollo) {}

  ngOnInit(): void {
    this.resourcesQuery = this.apollo.watchQuery<ResourcesQueryResponse>({
      query: GET_RESOURCES,
      variables: {
        first: ITEMS_PER_PAGE,
        sortField: 'name',
      },
    });
    if (this.resourcesQuery) {
      this.resourcesQuery.valueChanges.subscribe(({ data }) => {
        const resources =
          data?.resources?.edges?.map((edge) => edge.node) || [];
        this.cachedElements.push(...resources);
      });
    }
    this.prepareDatasetFilters();
  }

  /**
   * To replace all special characters with space
   *
   * @param value string
   * @returns string
   */
  replaceUnderscores(value: string): string {
    return value ? value.replace(/[^a-zA-Z0-9-]/g, ' ') : '';
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
   * To change the tab
   *
   * @param tabIndex params
   */
  changeTab(tabIndex: string) {
    this.tabIndex = tabIndex;
  }

  /**
   * To fetch resource details
   */
  getResourceData() {
    if (this.selectedValue) {
      this.dataSetFiltersFormGroup.controls.query.controls.name.setValue(
        this.cachedElements.find((element) => element.id === this.selectedValue)
          ?.name
      );
      this.resource = {};
      this.apollo
        .query<ResourceQueryResponse>({
          query: GET_RESOURCE,
          variables: {
            id: this.selectedValue,
          },
        })
        .subscribe((res) => {
          this.resource = res.data.resource;
        });
    }
  }

  /**
   * Preparing dataset filters dynamically
   */
  prepareDatasetFilters(): void {
    this.dataSetFiltersFormGroup = this.fb.group({
      name: '',
      query: this.fb.group({
        name: '',
        filter: this.fb.group({
          logic: 'and',
          filters: new FormArray([]),
        }),
      }),
    });
  }

  /**
   * To get the new dataset filter
   *
   *  @returns FormGroup
   */
  get getNewFilterFields(): FormGroup {
    return this.fb.group({
      field: [],
      operator: [],
      value: [],
    });
  }

  /**
   * to get the form controlls
   *
   * @returns form control
   */
  get formControllers() {
    return this.dataSetFiltersFormGroup.controls;
  }

  /**
   * To
   *
   * @returns Formarray
   */
  get datasetFilterInfo(): FormArray {
    return this.dataSetFiltersFormGroup
      .get('query')
      .get('filter')
      .get('filters') as FormArray;
  }

  /**
   * To add new dataset filter in the form
   */
  addNewDatasetFilter(): void {
    this.filterFields = this.dataSetFiltersFormGroup
      .get('query')
      .get('filter')
      .get('filters') as FormArray;

    // this.filterFields = this.filter.get('filters') as FormArray;
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
   * Dynamic Form Submission
   */
  onSubmit(): void {
    const finalResponse = this.dataSetFiltersFormGroup.value;
    console.log('Final Response', finalResponse);
  }
}
