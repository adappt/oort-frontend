import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Apollo, QueryRef } from 'apollo-angular';
import { clone } from 'lodash';
import {
  Resource,
  ResourceQueryResponse,
  ResourcesQueryResponse,
} from '../../../../models/resource.model';
import { EmailService } from '../../email.service';
import { FIELD_TYPES, FILTER_OPERATORS } from '../../filter/filter.constant';
import { GET_RESOURCE, GET_RESOURCES } from '../../graphql/queries';

/** Default items per query, for pagination */
let ITEMS_PER_PAGE = 0;
/**
 *
 */
@Component({
  selector: 'shared-dataset-filter',
  templateUrl: './dataset-filter.component.html',
  styleUrls: ['./dataset-filter.component.scss'],
})
export class DatasetFilterComponent implements OnDestroy {
  @Input() activeTab: any;
  @Input() tabs: any;
  @Input() query: FormGroup | any;
  @Input() queryValue: FormGroup | any;
  showPreview = false;
  public searchSelectedField = '';
  public searchAvailableField = '';
  public filteredFields: any[] = [];
  public resourcesQuery!: QueryRef<ResourcesQueryResponse>;
  public replaceUnderscores: any = this.emailService.replaceUnderscores;
  public fetchDataSet: any = this.emailService.fetchDataSet;

  public resource!: Resource;
  public dataSetResponse: any;
  public dataSetFields!: string[];
  public selectedResourceId!: string;
  public dataList!: { [key: string]: any }[];
  public selectedFields!: { name: string; type: string }[];
  public availableFields!: { name: string; type: string }[];
  public operators: { [key: number]: { value: string; label: string }[] } = {};

  filterOperators = FILTER_OPERATORS;
  @ViewChild('datasetPreview') datasetPreview: any;
  @Output() changeMainTab: EventEmitter<any> = new EventEmitter();
  @Output() navigateToPreview: EventEmitter<any> = new EventEmitter();

  /**
   * To use helper functions, Apollo serve
   *
   * @param emailService helper functions
   * @param apollo server
   * @param formGroup Angular form builder
   */
  constructor(
    public emailService: EmailService,
    private apollo: Apollo,
    private formGroup: FormBuilder
  ) {}

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngOnInit(): void {
    if (!this.emailService?.resourcesNameId?.length) {
      this.getResourceDataOnScroll();
    }
    this.filteredFields = this.resource?.fields;
    if (this.query?.controls?.cacheData?.value) {
      const {
        dataList,
        resource,
        operators,
        dataSetFields,
        selectedFields,
        availableFields,
        selectedResourceId,
      } = this.query.controls.cacheData.value;

      this.dataList = dataList;
      this.resource = resource;
      this.operators = operators;
      this.dataSetFields = dataSetFields;
      this.selectedFields = selectedFields;
      this.availableFields = availableFields;
      this.selectedResourceId = selectedResourceId;
    }
  }

  ngOnDestroy() {
    const cacheData = {
      dataList: this.dataList,
      resource: this.resource,
      operators: this.operators,
      dataSetFields: this.dataSetFields,
      selectedFields: this.selectedFields,
      availableFields: this.availableFields,
      dataSetResponse: this.dataSetResponse,
      selectedResourceId: this.selectedResourceId,
    };
    this.query.controls.cacheData.setValue(cacheData);
  }

  /**
   *
   * To fetch Resource Data On Scroll
   */
  getResourceDataOnScroll() {
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
          this.emailService.resourcesNameId = resources.map((element) => {
            return { id: element?.id?.toString(), name: element?.name };
          });
        });
      }
    }
  }

  /**
   * To fetch resource details
   */
  getResourceData() {
    if (this.selectedResourceId && this.emailService?.resourcesNameId?.length) {
      this.query.controls.resource.setValue(
        this.emailService.resourcesNameId.find(
          (element) => element.id === this.selectedResourceId
        )
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
          if (this.resource.fields) {
            this.availableFields = this.resource.fields;
          }
        });
    }
  }

  /**
   * Retrieves the field type of the field.
   *
   * @param fieldIndex - Index of the field in graphql.
   * @returns field type
   */
  getFieldType(fieldIndex: number): string {
    const fieldControl = this.datasetFilterInfo.at(fieldIndex).get('field');
    const fieldName = fieldControl ? fieldControl.value : null;
    const field = fieldName
      ? this.resource.fields.find((field: any) => field.name === fieldName)
      : null;
    return field ? field.type : '';
  }

  /**
   * Checks if the current field is date or time field.
   *
   * @param fieldIndex - Index of the field in graphql.
   * @returns true if the field is date or datetime
   */
  isDateOrDatetimeOperator(fieldIndex: number): boolean {
    const operators = ['eq', 'neq', 'gte', 'gt', 'lte', 'lt'];
    const fieldType = this.getFieldType(fieldIndex);
    const operatorControl = this.datasetFilterInfo
      .at(fieldIndex)
      .get('operator');
    const fieldOperator = operatorControl ? operatorControl.value : null;
    return (
      (fieldType === 'date' || fieldType === 'datetime') &&
      operators.includes(fieldOperator)
    );
  }

  /**
   * Grabs filter row values.
   *
   *  @returns FormGroup
   */
  get getNewFilterFields(): FormGroup {
    return this.formGroup.group({
      field: [],
      operator: ['eq'],
      value: [],
      hideEditor: false,
    });
  }

  /**
   * Grabs the data from each dataset filter row.
   *
   * @returns Form array of dataset filters
   */
  get datasetFilterInfo(): FormArray {
    return this.query.get('filter').get('filters') as FormArray;
  }

  /**
   * To add new dataset filter in the form
   */
  addNewDatasetFilter(): void {
    this.datasetFilterInfo.push(this.getNewFilterFields);
  }

  /**
   * Remove filter at index
   *
   * @param index filter index
   */
  deleteDatasetFilter(index: number): void {
    this.datasetFilterInfo.removeAt(index);
    if (this.operators?.[index]) {
      delete this.operators[index];
    }
  }

  /**
   * On the operator change
   *
   * @param selectedOperator string
   * @param filterData any
   */
  onOperatorChange(selectedOperator: string, filterData: any) {
    const operator = this.filterOperators.find(
      (x) => x.value === selectedOperator
    );
    if (operator?.disableValue) {
      filterData.get('hideEditor').setValue(true);
    } else {
      filterData.get('hideEditor').setValue(false);
    }
  }

  /**
   * Set field.
   *
   * @param event field name
   * @param fieldIndex filter row index
   */
  public setField(event: any, fieldIndex: number) {
    const name = event.target.value;
    const fields = clone(this.resource?.fields);
    const field = fields.find((x: { name: any }) => x.name === name);
    if (field) {
      const type = {
        ...FIELD_TYPES.find((x) => x.editor === field.type),
        ...field.filter,
      };
      const fieldOperator = FILTER_OPERATORS.filter((x) =>
        type?.operators?.includes(x.value)
      );
      this.operators = {
        ...(this.operators && { ...this.operators }),
        [fieldIndex]: fieldOperator,
      };
    }
  }

  /**
   * To add the selective fields in the layout
   *
   * @param fieldName string
   */
  addSelectiveFields(fieldName: string): void {
    const existFields = clone(this.query.value.fields) || [];
    if (!JSON.stringify(existFields).includes(fieldName)) {
      existFields.push({ name: fieldName, type: typeof fieldName });
      this.query.controls.fields.setValue(existFields);
      this.selectedFields = existFields;
    }
    // Removes the selected field from the available fields list
    this.availableFields = this.availableFields
      .filter((field: { name: string }) => field.name !== fieldName)
      .sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1));
  }

  /**
   * This function removes selected fields from the block table.
   *
   * @param fieldName The name of the field to remove.
   */
  removeSelectiveFields(fieldName: string): void {
    const existFields = this.query.controls.fields.value || [];
    const index = existFields.findIndex(
      (field: { name: string }) => field.name === fieldName
    );
    if (index !== -1) {
      existFields.splice(index, 1);
      this.query.controls.fields.setValue(existFields);
      this.selectedFields = existFields;
    }
    // Adds the deselected field back to the available fields list
    this.availableFields.push({ name: fieldName, type: typeof fieldName });

    this.availableFields.sort((a, b) =>
      a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1
    );
  }

  /**
   * To get data set for the applied filters.
   *
   * @param tabName - The name of the tab for which to get the data set.
   */
  getDataSet(tabName?: any): void {
    if (tabName == 'filter') {
      this.datasetPreview.selectTab(1);
    }
    if (
      tabName == 'fields' &&
      this.showPreview == false &&
      this.tabs.findIndex((x: any) => x.content == this.activeTab.content) <
        this.tabs.length - 1
    ) {
      this.changeMainTab.emit(
        this.tabs.findIndex((x: any) => x.content == this.activeTab.content) + 1
      );
    }
    let allPreviewData: any = [];
    if (tabName == 'preview') {
      let count = 0;
      for (const query of this.queryValue) {
        query.tabIndex = count;
        count++;
        this.fetchDataSet(query).subscribe(
          (res: { data: { dataSet: any } }) => {
            if (res?.data?.dataSet) {
              this.dataSetResponse = res?.data?.dataSet;
              this.dataList = res?.data?.dataSet.records?.map(
                (record: any) => record
              );
              if (this.dataList?.length) {
                this.dataSetFields = [
                  ...new Set(
                    this.dataList
                      .map((data: { [key: string]: any }) => Object.keys(data))
                      .flat()
                  ),
                ];
              }
              allPreviewData.push({
                dataList: this.dataList,
                dataSetFields: this.dataSetFields,
                tabIndex: res?.data?.dataSet?.tabIndex,
                tabName:
                  res?.data?.dataSet?.tabIndex < this.tabs.length
                    ? this.tabs[res.data.dataSet.tabIndex].title
                    : '',
              });
              if (this.tabs.length == allPreviewData.length) {
                allPreviewData = allPreviewData.sort(
                  (a: any, b: any) => a.tabIndex - b.tabIndex
                );
                this.navigateToPreview.emit(allPreviewData);
              }
            }
          }
        );
      }
    }
  }
}
