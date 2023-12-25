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
import { FIELD_TYPES, FILTER_OPERATORS } from '../../filter/filter.constant';
import {
  GET_DATA_SET,
  GET_RESOURCE,
  GET_RESOURCES,
} from '../../graphql/queries';
import { ADD_LAYOUT } from '../../graphql/mutations';
import {
  AddLayoutMutationResponse,
  Layout,
} from '../../../../models/layout.model';

/** Default items per query, for pagination */
let ITEMS_PER_PAGE = 0;

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
  public availableQueries!: Observable<any[]>;
  public resource!: Resource;
  public filterFields: FormArray | any = new FormArray([]);
  public cachedElements: Resource[] = [];
  public selectedResourceId: string | undefined;
  public operators!: { value: string; label: string }[];
  public dataSetFiltersFormGroup: FormGroup | any;
  public searchQuery = '';
  public tabs: any[] = [
    {
      title: `Tab 1`,
      content: `Tab 1 Content`,
      active: true,
    },
  ];
  public activeTab = this.tabs[0];
  public selectedFields!: { name: string; type: string }[];
  private layoutData?: Layout;
  private dataSet!: { [key: string]: { [key: string]: any } };
  public dataList!: { [key: string]: string }[];
  public filteredFields: any[] = [];
  filterOperators = FILTER_OPERATORS;
  public searchSelectedField = '';

  /**
   * Composite filter group.
   *
   * @param fb Angular form builder
   * @param apollo server
   */
  constructor(private fb: FormBuilder, private apollo: Apollo) {}

  ngOnInit(): void {
    this.getResourceDataOnScroll(undefined);
    this.prepareDatasetFilters();
    this.filteredFields = this.resource?.fields;
  }

  /**
   *
   * @param event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getResourceDataOnScroll(event: any) {
    if (ITEMS_PER_PAGE > -1) {
      ITEMS_PER_PAGE =
        ITEMS_PER_PAGE > -1 ? ITEMS_PER_PAGE + 15 : ITEMS_PER_PAGE;
      this.resourcesQuery = this.apollo.watchQuery<ResourcesQueryResponse>({
        query: GET_RESOURCES,
        variables: {
          first: ITEMS_PER_PAGE,
          sortField: 'name',
        },
      });
      if (this.resourcesQuery && ITEMS_PER_PAGE > -1) {
        this.resourcesQuery.valueChanges.subscribe(({ data }) => {
          ITEMS_PER_PAGE =
            ITEMS_PER_PAGE > data?.resources?.totalCount ? -1 : ITEMS_PER_PAGE;
          const resources =
            data?.resources?.edges?.map((edge) => edge.node) || [];
          this.cachedElements = resources.map((element) => {
            return { id: element?.id?.toString(), name: element?.name };
          });
        });
      }
    }
  }

  /**
   * This function is used to select a tab.
   *
   * @param tab The tab to be selected.
   */
  onTabSelect(tab: any): void {
    this.activeTab = tab;
    this.activeTab.active = true;
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
   * @param $event params
   */
  changeTab($event: any) {
    this.tabIndex = $event?.index;
    this.activeTab = this.tabs[$event?.index];
    this.activeTab.active = true;
  }

  /**
   * To fetch resource details
   */
  getResourceData() {
    if (this.selectedResourceId) {
      this.dataSetFiltersFormGroup.controls.query.controls.name.setValue(
        this.cachedElements.find(
          (element) => element.id === this.selectedResourceId
        )?.name
      );
      this.resource = {};
      this.apollo
        .query<ResourceQueryResponse>({
          query: GET_RESOURCE,
          variables: {
            id: this.selectedResourceId,
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
        pageSize: 0,
        filter: this.fb.group({
          logic: 'and', // set default value here
          filters: new FormArray([]),
        }),
        fields: [],
      }),
      display: {},
    });
  }

  /**
   * Filters the available fields based on the search query.
   *
   * @param searchQuery
   */
  filterAvailableFields(searchQuery: string): void {
    this.filteredFields = this.resource?.fields.filter((field: any) =>
      field.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  /**
   * To add the selective fields in the layout
   *
   * @param fieldName string
   */
  addSelectiveFields(fieldName: string): void {
    const existFields =
      this.dataSetFiltersFormGroup.get('query').value.fields || [];
    if (!JSON.stringify(existFields).includes(fieldName)) {
      existFields.push({ name: fieldName, type: typeof fieldName });
      this.dataSetFiltersFormGroup.controls.query.controls.fields.setValue(
        existFields
      );
      this.selectedFields = existFields;
    }
    // Removes the selected field from the available fields list
    this.resource.fields = this.resource.fields.filter(
      (field: { name: string }) => field.name !== fieldName
    );
    this.onSubmit();
  }

  /**
   * This function removes selected fields from the block table.
   *
   * @param fieldName The name of the field to remove.
   */
  removeSelectiveFields(fieldName: string): void {
    const existFields =
      this.dataSetFiltersFormGroup.controls.query.controls.fields.value || [];
    const index = existFields.findIndex(
      (field: { name: string }) => field.name === fieldName
    );
    if (index !== -1) {
      existFields.splice(index, 1);
      this.dataSetFiltersFormGroup.controls.query.controls.fields.setValue(
        existFields
      );
      this.selectedFields = existFields;
    }
    // Adds the deselected field back to the available fields list
    this.resource.fields.push({ name: fieldName, type: typeof fieldName });
    this.onSubmit();
  }

  /**
   * Grabs filter row values.
   *
   *  @returns FormGroup
   */
  get getNewFilterFields(): FormGroup {
    return this.fb.group({
      field: [],
      operator: [],
      value: [],
      hideEditor: false,
    });
  }

  /**
   * Gets the form controls
   *
   * @returns form control
   */
  get formControllers() {
    return this.dataSetFiltersFormGroup.controls;
  }

  /**
   * Grabs the data from each dataset filter row.
   *
   * @returns Formarray of dataset filters
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
   *
   */
  addNewDatasetGroup(): void {
    //TODO: Implement Filter Group
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
   * Tp get data set
   */
  getDataSet(): void {
    this.apollo
      .query<any>({
        query: GET_DATA_SET,
        variables: {
          resourceId: this.selectedResourceId,
          layoutId: this.layoutData?.id,
        },
      })
      .subscribe((res) => {
        this.dataSet = res.data.dataSet;
        this.dataList = this.dataSet.records.map(
          (record: { data: { [key: string]: string } }) => record.data
        );
      });
  }

  /**
   * To store layout in the resource
   */
  saveLayoutInResource(): void {
    const layout = this.dataSetFiltersFormGroup.value;
    this.apollo
      .mutate<AddLayoutMutationResponse>({
        mutation: ADD_LAYOUT,
        variables: {
          resource: this.selectedResourceId,
          layout,
        },
      })
      .subscribe(({ data }) => {
        this.layoutData = data?.addLayout;
        if (this.layoutData?.id) this.getDataSet();
      });
  }

  /**
   * Dynamic Form Submission
   */
  onSubmit(): void {
    const finalResponse = this.dataSetFiltersFormGroup.value;
    console.log('Final Response', finalResponse);
    this.saveLayoutInResource();
  }

  /**
   * Adds a tab
   */
  public addTab() {
    this.tabs.forEach((tab) => (tab.active = false));
    this.tabs.push({
      title: `Tab ${this.tabs.length + 1}`,
      content: `Tab ${this.tabs.length + 1} Content`,
      active: true,
    });
    this.activeTab =
      this.tabs.filter((tab: any) => tab.active == true).length > 0
        ? this.tabs.filter((tab: any) => tab.active == true)[0]
        : '';
  }

  /**
   * Deletes a block tab at the specified index.
   *
   * @param index The index of the tab to delete.
   * @param event The event that triggered the deletion.
   */
  public deleteTab(index: number, event: Event) {
    event.stopPropagation();
    this.tabs.splice(index, 1);
    this.activeTab =
      this.activeTab.active == true && this.tabs.length > 0
        ? this.tabs[this.tabs.length - 1]
        : this.activeTab;
    this.activeTab.active = true;
  }

  /**
   *
   * @param selectedOperator
   * @param filterData
   */
  public onOperatorChange(selectedOperator: string, filterData: any) {
    const operator = this.filterOperators.find(
      (x) => x.value === selectedOperator
    );
    if (operator?.disableValue) {
      filterData.get('hideEditor').setValue(true);
    } else {
      filterData.get('hideEditor').setValue(false);
    }
  }
}
