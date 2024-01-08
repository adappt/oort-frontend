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
  public metaData!: any;
  public dataSetResponse: any;
  public dataSetFields!: string[];
  public selectedResourceId!: string;
  public dataList!: { [key: string]: any }[];
  public selectedFields!: { name: string; type: string }[];
  public filterFields!: { name: string; type: string }[];
  public availableFields!: { name: string; type: string }[];
  public operators: { [key: number]: { value: string; label: string }[] } = {};

  filterOperators = FILTER_OPERATORS;
  @ViewChild('datasetPreview') datasetPreview: any;
  @Output() changeMainTab: EventEmitter<any> = new EventEmitter();
  @Output() navigateToPreview: EventEmitter<any> = new EventEmitter();
  public loading = false;

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
    if (this.query.value.name == null) {
      const name = 'Block ' + (this.activeTab.index + 1);
      this.query.controls['name'].setValue(name);
    }
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
        filterFields,
        selectedResourceId,
      } = this.query.controls.cacheData.value;

      this.dataList = dataList;
      this.resource = resource;
      this.operators = operators;
      this.dataSetFields = dataSetFields;
      this.selectedFields = selectedFields;
      this.filterFields = filterFields;
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
      filterFields: this.filterFields,
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
    this.availableFields = [];
    this.selectedFields = [];
    this.filterFields = [];
    this.query.get('fields').reset();
    // console.log(this.query.value.fields);
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
          this.metaData = res.data?.resource?.metadata;
          if (this.metaData?.length) {
            this.metaData.forEach((field: any) => {
              if (field && field.type !== 'resource') {
                if (field) {
                  if (field.name === 'createdBy' && field.fields?.length) {
                    field.fields.forEach((obj: any) => {
                      obj.name = '_createdBy.user.' + obj.name;
                      this.availableFields.push(clone(obj));
                      obj.name = 'createdBy.' + obj.name.split('.')[2];
                      this.filterFields.push(obj);
                    });
                  } else if (
                    field.name === 'lastUpdatedBy' &&
                    field.fields?.length
                  ) {
                    field.fields.forEach((obj: any) => {
                      obj.name = '_lastUpdatedBy.user.' + obj.name;
                      this.availableFields.push(clone(obj));
                      obj.name = 'lastUpdatedBy.' + obj.name.split('.')[2];
                      this.filterFields.push(obj);
                    });
                  } else if (
                    field.name === 'lastUpdateForm' &&
                    field.fields?.length
                  ) {
                    field.fields.forEach((obj: any) => {
                      obj.name = '_lastUpdateForm.' + obj.name;
                      this.availableFields.push(clone(obj));
                      obj.name = 'lastUpdateForm.' + obj.name.split('.')[1];
                      this.filterFields.push(obj);
                    });
                  } else if (field.name === 'form' && field.fields?.length) {
                    field.fields.forEach((obj: any) => {
                      obj.name = '_form.' + obj.name;
                      this.availableFields.push(clone(obj));
                      obj.name = 'form.' + obj.name.split('.')[1];
                      this.filterFields.push(obj);
                    });
                  } else if (field.type === 'resource') {
                    field.fields.forEach((obj: any) => {
                      obj.name = `${field.name}.${obj.name}`;
                      obj.type = 'resource';
                      this.availableFields.push(clone(obj));
                      this.filterFields.push(obj);
                    });
                  } else {
                    this.availableFields.push(clone(field));
                    this.filterFields.push(clone(field));
                  }
                }
              }
            });
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
      (fieldType === 'date' ||
        fieldType === 'datetime' ||
        fieldType === 'datetime-local') &&
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
   * To add the selective fields in the layout
   *
   * @param inputString string
   * @returns modifiedSegments
   */
  removeUserString(inputString: any): any {
    if (inputString !== undefined) {
      const segments: string[] = inputString.split('.');
      const modifiedSegments: string[] = segments.map((segment) =>
        segment === 'user' ? '-' : segment
      );
      return modifiedSegments.join('.');
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
    const fields = clone(this.metaData);
    const field = fields.find(
      (x: { name: any }) => x.name === name.split('.')[0]
    );
    let type: { operators: any; editor: string; defaultOperator: string } = {
      operators: undefined,
      editor: '',
      defaultOperator: '',
    };
    if (field) {
      const fieldType = FIELD_TYPES.find(
        (x) =>
          x.editor ===
          (field.type === 'datetime-local' ? 'datetime' : field.type || 'text')
      );
      if (fieldType) {
        type = {
          ...fieldType,
          ...field.filter,
        };
      }
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
   * @param field string
   */
  addSelectiveFields(field: any): void {
    const existFields = clone(this.query.value.fields) || [];
    if (!JSON.stringify(existFields).includes(field.name)) {
      existFields.push(field);
      this.query.controls.fields.setValue(existFields);
      this.selectedFields = existFields;
    }

    // console.log(`Field type of ${field.name}: ${field.type}`); // Print the field type to the console
    // Removes the selected field from the available fields list
    this.availableFields = this.availableFields
      .filter((f: { name: string }) => f.name !== field.name)
      .sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1));
  }

  /**
   * This function removes selected fields from the block table.
   *
   * @param field The name of the field to remove.
   */
  removeSelectiveFields(field: any): void {
    const existFields = this.query.controls.fields.value || [];
    const index = existFields.findIndex(
      (f: { name: string }) => f.name === field.name
    );
    if (index !== -1) {
      existFields.splice(index, 1);
      this.query.controls.fields.setValue(existFields);
      this.selectedFields = existFields;
    }
    // Adds the deselected field back to the available fields list
    this.availableFields.push(field);

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
    if (
      this.query.controls['name'].value !== null &&
      this.query.controls['name'].value !== ''
    ) {
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
          this.tabs.findIndex((x: any) => x.content == this.activeTab.content) +
            1
        );
      }
      let allPreviewData: any = [];
      if (tabName == 'preview') {
        let count = 0;
        for (const query of this.queryValue) {
          if (count == 0) {
            this.loading = true;
          }
          query.tabIndex = count;
          count++;
          this.fetchDataSet(query).subscribe(
            (res: { data: { dataSet: any } }) => {
              if (res?.data?.dataSet) {
                this.dataSetResponse = res?.data?.dataSet;
                this.dataList = res?.data?.dataSet.records?.map(
                  (record: any) => {
                    const flattenedObject = this.flattenRecord(record);

                    delete flattenedObject.data;

                    const flatData = Object.fromEntries(
                      Object.entries(flattenedObject).filter(
                        ([, value]) => value !== null && value !== undefined
                      )
                    );

                    return flatData;
                  }
                );
                if (this.dataList?.length) {
                  this.dataSetFields = [
                    ...new Set(
                      this.dataList
                        .map((data: { [key: string]: any }) =>
                          Object.keys(data)
                        )
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
                  this.loading = false;
                  this.navigateToPreview.emit(allPreviewData);
                  this.emailService.setAllPreviewData(allPreviewData);
                }
              }
            }
          );
        }
      }
    } else {
      this.query.controls['name'].markAsTouched();
    }
  }

  /**
   * Flattens the given record object into a single level object.
   *
   * @param record The record to flatten.
   * @returns The flattened record.
   */
  flattenRecord(record: any): any {
    const result: any = {};

    for (const key in record) {
      // eslint-disable-next-line no-prototype-builtins
      if (record.hasOwnProperty(key)) {
        const value = record[key];

        if (typeof value === 'object' && value !== null) {
          const flattenedValue = this.flattenRecord(value);

          for (const subKey in flattenedValue) {
            // eslint-disable-next-line no-prototype-builtins
            if (flattenedValue.hasOwnProperty(subKey)) {
              result[`${key}-${subKey}`] = flattenedValue[subKey];
            }
          }
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }
}
