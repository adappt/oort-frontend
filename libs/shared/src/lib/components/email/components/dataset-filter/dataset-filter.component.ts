import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { Apollo, QueryRef } from 'apollo-angular';
import { clone, cloneDeep } from 'lodash';
import {
  Resource,
  ResourceQueryResponse,
  ResourcesQueryResponse,
} from '../../../../models/resource.model';
import { EmailService } from '../../email.service';
import {
  FIELD_TYPES,
  FILTER_OPERATORS,
  TYPE_LABEL,
} from '../../filter/filter.constant';
import { FIELD_NAME } from './metadata.constant';
import { GET_RESOURCE, GET_RESOURCES } from '../../graphql/queries';
import { Subscription } from 'rxjs';
import { SnackbarService } from '@oort-front/ui';
/** Default items per query, for pagination */
let ITEMS_PER_PAGE = 0;
/**
 * Available fields object
 */
interface fieldStore {
  name: string;
  type: string;
  fields?: string[] | null;
  __typename: string;
  parentName?: string | null;
  childName?: string | null;
  childType?: string | null;
}

/**
 * Component for filtering, selecting fields and styling block data sets.
 */
@Component({
  selector: 'shared-dataset-filter',
  templateUrl: './dataset-filter.component.html',
  styleUrls: ['./dataset-filter.component.scss'],
})
export class DatasetFilterComponent implements OnInit, OnDestroy {
  /** ACTIVE TAB IN THE COMPONENT. */
  @Input() activeTab: any;
  /** ARRAY OF TABS IN THE COMPONENT. */
  @Input() tabs: any;
  /** QUERY FORMGROUP USED FOR FILTERING. */
  @Input() query: FormGroup | any;
  /** VALUE OF THE QUERY FORMGROUP. */
  @Input() queryValue: FormGroup | any;
  /** FLAG TO CONTROL THE VISIBILITY OF THE PREVIEW. */
  showPreview = false;
  /** SUBSCRIPTION TO DATASET SAVING. */
  private datasetSaveSubscription?: Subscription;
  /** GRAPHQL QUERY REFERENCE FOR FETCHING RESOURCES. */
  public resourcesQuery!: QueryRef<ResourcesQueryResponse>;
  /** METHOD TO FETCH DATA SETS. */
  public fetchDataSet: any = this.emailService.fetchDataSet;
  /** SELECTED RESOURCE. */
  public resource!: Resource;
  /** METADATA OF THE SELECTED RESOURCE. */
  public metaData!: any;
  /** RESPONSE OF THE DATA SET. */
  public dataSetResponse: any;
  /** FIELDS OF THE DATA SET. */
  public dataSetFields!: any[];
  /** SELECTED RESOURCE ID. */
  public selectedResourceId!: string;
  /** LIST OF DATA. */
  public dataList!: { [key: string]: any }[];
  /** SELECTED SEARCH FIELD. */
  public searchSelectedField = '';
  /** AVAILABLE SEARCH FIELD. */
  public searchAvailableField = '';
  /** FILTERED FIELDS FOR SEARCH. */
  public filteredFields: any[] = [];
  /** SELECTED FIELDS FOR FILTERING. */
  public selectedFields: fieldStore[] = [];
  /** FIELDS FOR FILTERING. */
  public filterFields: any[] = [];
  /** AVAILABLE FIELDS FOR FILTERING. */
  public availableFields: fieldStore[] = [];
  /** OPERATORS FOR FILTERING. */
  public operators: { [key: number]: { value: string; label: string }[] } = {};
  /** FLAG TO SHOW THE DATASET LIMIT WARNING. */
  public showDatasetLimitWarning = false;
  /** TOTAL NUMBER OF MATCHING RECORDS. */
  public totalMatchingRecords = 0;
  /** CURRENT TAB INDEX. */
  public currentTabIndex = 0;
  /** FLAG TO SWITCH BETWEEN DATE PICKER AND TEXT EXPRESSION. */
  public useExpression = false;
  /** FILTER OPERATORS FROM FILTER CONSTANT */
  filterOperators = FILTER_OPERATORS;
  /** FLAG FOR SENDING INDIVUAL EMAILS */
  public separateEmail = false;
  /** DISABLED FIELDS LIST */
  public disabledFields: string[] = [];
  /** DISABLED FIELDS TYPE LIST */
  public disabledTypes: string[] = [];
  /** TYPE LABELS */
  public TYPE_LABEL = TYPE_LABEL;
  /** TIME UNITS FOR FILTERING. */
  public timeUnits = [
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
  ];
  /** DATASET PREVIEW VIEWCHILD. */
  @ViewChild('datasetPreview') datasetPreview: any;
  /** EVENT EMITTER FOR CHANGING THE MAIN TAB. */
  @Output() changeMainTab: EventEmitter<any> = new EventEmitter();
  /** NAVIGATE TO DATASET PREVIEW SCREEN EMITTER */
  @Output() navigateToPreview: EventEmitter<any> = new EventEmitter();
  /** LOADING STATUS. */
  public loading = false;
  /** FIELD OPTIONS. */
  fieldOptions: any;
  /** CURRENT FIELD NAME. */
  currentFieldName: any;
  /** VALIDATION ERROR MESSAGE */
  showErrorMessage: any = '';
  /** INDEX OF CURRENT HIGHLIGHTED FIELD FROM SELECTED FIELD LIST */
  selectedFieldIndex: number | null = null;
  /** INDEX OF CURRENT HIGHLIGHTED FIELD FROM AVAILABLE FIELD LIST */
  availableFieldIndex: number | null = null;

  /**
   * To use helper functions, Apollo serve
   *
   * @param emailService helper functions
   * @param apollo server
   * @param formGroup Angular form builder
   * @param snackBar snackbar helper function
   */
  constructor(
    public emailService: EmailService,
    private apollo: Apollo,
    private formGroup: FormBuilder,
    public snackBar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.query.controls.name.valueChanges.subscribe((data: any) => {
      this.emailService.title.next(data);
      this.emailService.index.next(this.activeTab.index);
    });
    this.separateEmail = this.emailService.updateSeparateEmail(
      this.activeTab.index
    );
    if (this.query.value.name == null) {
      const name = 'Block ' + (this.activeTab.index + 1);
      this.query.controls['name'].setValue(name);
    }
    if (this.query?.value?.resource?.id) {
      ITEMS_PER_PAGE = 70;
      this.getResourceDataOnScroll();
    } else if (
      !this.emailService?.resourcesNameId?.length ||
      (this.query?.value?.cacheData?.resource === undefined &&
        this.query?.value?.resource?.id)
    ) {
      ITEMS_PER_PAGE = 0;
      this.getResourceDataOnScroll();
    } else {
      if (this.query?.value?.resource?.id && this.metaData == undefined) {
        this.selectedResourceId = this.query?.value?.resource?.id;
        this.getResourceData(false);
      }
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
    // Saves Dataset form form when called.
    this.datasetSaveSubscription = this.emailService.datasetSave.subscribe(
      (save) => {
        if (save) {
          this.getDataSet('preview');
        }
      }
    );
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

    // Safely destroys dataset save subscription
    if (this.datasetSaveSubscription) {
      this.datasetSaveSubscription.unsubscribe();
    }
  }

  /**
   * Handles Filter, Field, Style Tab selection changes
   *
   * @param event The tab selected
   */
  onTabSelect(event: any): void {
    const newIndex = event.index;
    const previousIndex = this.currentTabIndex;
    const filterTabIndex = 0;
    const fieldsTabIndex = 1;

    // Check if the current active tab is "Filter" and the selected tab is "Fields"
    if (newIndex === fieldsTabIndex && previousIndex === filterTabIndex) {
      this.getDataSet('filter');
    }
    this.currentTabIndex = newIndex;
  }

  /**
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
        this.loading = true;
        this.resourcesQuery.valueChanges.subscribe(({ data }) => {
          this.loading = false;
          ITEMS_PER_PAGE =
            ITEMS_PER_PAGE > data?.resources?.totalCount ? -1 : ITEMS_PER_PAGE;
          const resources =
            data?.resources?.edges?.map((edge) => edge.node) || [];
          this.emailService.resourcesNameId = resources.map((element) => {
            return { id: element?.id?.toString(), name: element?.name };
          });

          // Edit Mode data
          if (this.query?.value?.resource?.id) {
            this.selectedResourceId = this.query?.value?.resource?.id;
            const found = this.emailService.resourcesNameId.some(
              (resource) => resource.id === this.selectedResourceId
            );

            // Keeps scrolling until name is found
            if (!found && ITEMS_PER_PAGE !== -1) {
              this.getResourceDataOnScroll();
            }
            const resources =
              data?.resources?.edges?.map((edge) => edge.node) || [];
            this.emailService.resourcesNameId = resources.map((element) => {
              return { id: element?.id?.toString(), name: element?.name };
            });
            this.getResourceData(false);
          }
        });
      }
    }
  }

  /**
   * To fetch resource details
   *
   * @param fromHtml - If state is in edit mode then false else true if new notification (means Event from UI)
   */
  getResourceData(fromHtml: boolean) {
    this.availableFields = [];
    this.selectedFields = [];
    this.filterFields = [];
    fromHtml ? this.query.controls.fields.setValue([]) : '';
    this.showDatasetLimitWarning = false;
    this.emailService.disableSaveAndProceed.next(false);
    this.disabledFields = [];
    this.disabledTypes = [];
    this.currentTabIndex = 0;
    if (this.selectedResourceId && this.emailService?.resourcesNameId?.length) {
      this.query.controls.resource.setValue(
        this.emailService.resourcesNameId.find(
          (element) => element.id === this.selectedResourceId
        )
      );
      this.resource = {};
      this.loading = true;
      this.showErrorMessage = '';
      this.apollo
        .query<ResourceQueryResponse>({
          query: GET_RESOURCE,
          variables: {
            id: this.selectedResourceId,
          },
        })
        .subscribe((res) => {
          this.loading = false;
          this.resource = res.data.resource;
          this.metaData = res.data?.resource?.metadata;
          if (this.metaData?.length) {
            this.metaData.forEach((field: any) => {
              if (
                field &&
                !['matrix', 'matrixdynamic', 'matrixdropdown'].includes(
                  field.type
                )
              ) {
                if (field) {
                  if (
                    field.name === FIELD_NAME.createdBy &&
                    field.fields?.length
                  ) {
                    field.fields.forEach((obj: any) => {
                      obj.name = `_${FIELD_NAME.createdBy}.user.` + obj.name;
                      this.availableFields.filter((x) => x.name == obj.name)
                        .length === 0
                        ? this.availableFields.push(clone(obj))
                        : '';
                      obj.name =
                        `${FIELD_NAME.createdBy}.` + obj.name.split('.')[2];
                      this.filterFields.push(obj);
                    });
                  } else if (
                    field.name === FIELD_NAME.lastUpdatedBy &&
                    field.fields?.length
                  ) {
                    field.fields.forEach((obj: any) => {
                      obj.name =
                        `_${FIELD_NAME.lastUpdatedBy}.user.` + obj.name;
                      this.availableFields.filter((x) => x.name == obj.name)
                        .length === 0
                        ? this.availableFields.push(clone(obj))
                        : '';
                      obj.name =
                        `${FIELD_NAME.lastUpdatedBy}.` + obj.name.split('.')[2];
                      this.filterFields.push(obj);
                    });
                  } else if (
                    field.name === 'lastUpdateForm' &&
                    field.fields?.length
                  ) {
                    field.fields.forEach((obj: any) => {
                      obj.name = '_lastUpdateForm.' + obj.name;
                      this.availableFields.filter((x) => x.name == obj.name)
                        .length === 0
                        ? this.availableFields.push(clone(obj))
                        : '';
                      obj.name = 'lastUpdateForm.' + obj.name.split('.')[1];
                      this.filterFields.push(obj);
                    });
                  } else if (field.name === 'form' && field.fields?.length) {
                    field.fields.forEach((obj: any) => {
                      obj.name = '_form.' + obj.name;
                      this.availableFields.filter((x) => x.name == obj.name)
                        .length === 0
                        ? this.availableFields.push(clone(obj))
                        : '';
                      obj.name = 'form.' + obj.name.split('.')[1];
                      this.filterFields.push(obj);
                    });
                  } else if (field.type === TYPE_LABEL.resource) {
                    if (field.fields) {
                      field.fields.forEach((obj: any) => {
                        obj.parentName = field.name;
                        if (
                          obj.name === FIELD_NAME.createdBy ||
                          obj.name === FIELD_NAME.lastUpdatedBy
                        ) {
                          const obj1 = cloneDeep(obj);
                          obj1.childName = `${field.name} - _${obj.name}.user.username`;
                          obj1.name = `${field.name} - _${obj.name}.user.username`;
                          obj1.parentName = field.name;
                          obj1.type = 'text';
                          this.availableFields.filter(
                            (x) => x.name == obj1.name
                          ).length === 0
                            ? this.availableFields.push(obj1)
                            : '';

                          // Create and push the second object
                          const obj2 = cloneDeep(obj);
                          obj2.name = `${field.name} - _${obj.name}.user._id`;
                          obj2.childName = `${field.name} - _${obj.name}.user._id`;
                          obj2.parentName = field.name;
                          obj2.type = 'text';
                          this.availableFields.filter(
                            (x) => x.name == obj2.name
                          ).length === 0
                            ? this.availableFields.push(obj2)
                            : '';

                          // Create and push the third object
                          const obj3 = cloneDeep(obj);
                          obj3.name = `${field.name} - _${obj.name}.user.name`;
                          obj3.childName = `${field.name} - _${obj.name}.user.name`;
                          obj3.parentName = field.name;
                          obj3.type = 'text';
                          this.availableFields.filter(
                            (x) => x.name == obj3.name
                          ).length === 0
                            ? this.availableFields.push(obj3)
                            : '';
                          obj.fields = [];
                          obj.fields?.filter((x: any) => x.name == obj.name)
                            .length === 0
                            ? obj.fields.push(clone(obj1))
                            : '';
                          obj.fields?.filter((x: any) => x.name == obj.name)
                            .length === 0
                            ? obj.fields.push(clone(obj2))
                            : '';
                          obj.fields?.filter((x: any) => x.name == obj.name)
                            .length === 0
                            ? obj.fields.push(clone(obj3))
                            : '';
                          obj.childName = field.name + ' - ' + obj.name;
                          obj.name = field.name + ' - ' + obj.name;
                        } else {
                          obj.childName = field.name + ' - ' + obj.name;
                          obj.name = field.name + ' - ' + obj.name;
                          this.availableFields.filter((x) => x.name == obj.name)
                            .length === 0
                            ? this.availableFields.push(clone(obj))
                            : '';
                        }
                      });
                    } else {
                      this.availableFields.filter((x) => x.name == field.name)
                        .length === 0
                        ? this.availableFields.push(clone(field))
                        : '';
                    }

                    this.filterFields.push(field);
                  } else if (field.type === TYPE_LABEL.resources) {
                    this.availableFields.filter((x) => x.name == field.name)
                      .length === 0
                      ? this.availableFields.push(clone(field))
                      : '';
                    this.filterFields.push(field);
                  } else {
                    this.availableFields.filter((x) => x.name == field.name)
                      ? this.availableFields.push(clone(field))
                      : '';
                    this.filterFields.push(clone(field));
                  }
                }
                this.availableFields = this.availableFields ?? [];
                this.filterFields = this.filterFields ?? [];
                this.availableFields?.sort((a, b) =>
                  a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1
                );
              } else {
                this.disabledFields.push(field.name);
                this.disabledTypes.push(field.type);
                this.disabledTypes = [...new Set(this.disabledTypes)];
              }
            });

            //Checking Edit mode data
            if (
              this.query?.controls?.fields?.value &&
              (this.selectedFields === undefined ||
                this.selectedFields.length === 0)
            ) {
              this.selectedFields =
                this.selectedFields === undefined ? [] : this.selectedFields;
              this.selectedFields =
                this.query?.controls?.fields?.value?.length > 0
                  ? this.query?.controls?.fields?.value
                  : this.selectedFields;
              this.query?.controls?.fields?.value?.forEach((fieldEle: any) => {
                this.populateFields(fieldEle);
              });
            }

            if (this.query?.controls?.filter?.value) {
              this.query?.controls?.filter?.value?.filters?.forEach(
                (fValue: any, fIndex: number) => {
                  this.setField(fValue.field, fIndex);
                }
              );
            }
          }
          if (
            this.query?.value?.resource !== null &&
            !this.resource?.fields?.length
          ) {
            this.showErrorMessage = "Selected form doesn't contain any fields";
          }
        });
    } else {
      this.showErrorMessage = "Selected form doesn't contain any fields";
    }
  }

  /**
   * Retrieves the field type of the field.
   *
   * @param fieldIndex - Index of the field in graphql.
   * @returns field type
   */
  getFieldType(fieldIndex: number): string | undefined {
    const fieldControl = this.datasetFilterInfo.at(fieldIndex);
    const fieldName = fieldControl ? fieldControl.value : null;
    let field = fieldName
      ? this.resource?.metadata?.find(
          (data: any) => data.name === fieldName.field.split('.')[0]
        )
      : null;
    if (field && field?.type === TYPE_LABEL.resources) {
      field = fieldName
        ? field.fields?.find(
            (data: any) => data.name === fieldName.field.split('.')[1]
          )
        : null;
    }
    if (field && field.type === TYPE_LABEL.resource) {
      if (field.fields) {
        field = field?.fields?.find(
          (x: { name: any }) =>
            x.name.split(' - ')[1] === fieldName.field.split('.')[1]
        );
      }
    }
    return field ? field.type : '';
  }

  /**
   * Checks if the current field is date or time field.
   *
   * @param fieldIndex - Index of the field in graphql.
   * @returns true if the field is date or datetime
   */
  isDateOrDatetimeOperator(fieldIndex: number): boolean {
    const operators = ['eq', 'neq', 'gte', 'gt', 'lte', 'lt', 'inthelast'];
    const fieldType = this.getFieldType(fieldIndex);
    const operatorControl = this.datasetFilterInfo
      .at(fieldIndex)
      .get('operator');
    const fieldOperator = operatorControl ? operatorControl.value : null;
    return (
      (fieldType === TYPE_LABEL.date ||
        fieldType === TYPE_LABEL.datetime ||
        fieldType === TYPE_LABEL.datetime_local) &&
      operators.includes(fieldOperator)
    );
  }

  /**
   * Checks if the selected operator for a field is numeric.
   *
   * @param fieldIndex The index of the field in the dataset filter.
   * @returns Returns true if the operator is numeric, otherwise false.
   */
  isNumericOperator(fieldIndex: number): boolean {
    const operators = [
      'eq',
      'neq',
      'gte',
      'gt',
      'lte',
      'lt',
      'isnull',
      'isnotnull',
    ];
    const operatorControl = this.datasetFilterInfo
      .at(fieldIndex)
      .get('operator');
    const fieldOperator = operatorControl ? operatorControl.value : null;
    return (
      this.getFieldType(fieldIndex) === 'numeric' &&
      operators.includes(fieldOperator)
    );
  }

  /**
   * Returns an array of numbers from 1 to 90
   * for the "In the last" dropdown.
   *
   * @returns an array of numbers from 1 to 90.
   */
  getNumbersArray(): number[] {
    return Array.from({ length: 90 }, (_, i) => i + 1);
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
      inTheLast: this.formGroup.group({
        number: [1],
        unit: ['days'],
      }),
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

    //Updated Object key number as Operators missing in filter when we try to delete few of the filters
    const new_Operators: any[] = [];
    Object.keys(this.operators)
      .filter((op: any) => parseInt(op) < index)
      .forEach((ele: any) => {
        new_Operators[ele] = this.operators[ele];
      });
    Object.keys(this.operators)
      .filter((op: any) => parseInt(op) > index)
      .forEach((ele: any) => {
        if (parseInt(ele) !== 0) {
          const old_key = parseInt(ele);
          const new_key = old_key - 1;
          new_Operators[new_key] = this.operators[old_key];
        } else {
          new_Operators[ele] = this.operators[ele];
        }
      });
    this.operators = new_Operators;
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
   * Maps operator to the correct operator value,
   * and enables or disables value input box.
   *
   * @param selectedOperator Filter Operator that has been selected
   * @param filterData Filter form data.
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
   * Sets field input box values.
   *
   * @param event field name
   * @param fieldIndex filter row index
   */
  public setField(event: any, fieldIndex: number) {
    const name = event?.target?.value || event;
    const fields = clone(this.metaData);
    let field = fields.find(
      (x: { name: any }) => x.name === name.split('.')[0]
    );
    if (field && field.type === TYPE_LABEL.resources) {
      const child = name.split('.')[1];
      if (field.fields) {
        field = field?.fields.find((x: { name: any }) => x.name === child);
      }
    }

    if (field && field.type === TYPE_LABEL.resource) {
      if (field.fields) {
        field =
          field?.fields.find(
            (x: { name: any }) => x.name.split(' - ')[1] === name.split('.')[1]
          ) ?? field;
      }
    }
    let type: { operators: any; editor: string; defaultOperator: string } = {
      operators: undefined,
      editor: '',
      defaultOperator: '',
    };
    if (field) {
      const fieldType = FIELD_TYPES.find(
        (x) =>
          x.editor ===
          (field.type === TYPE_LABEL.datetime_local
            ? TYPE_LABEL.datetime
            : field.type || TYPE_LABEL.text)
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
   * @param field to be added to list
   */
  populateFields(field: any): void {
    const fieldExists = clone(this.query.value.fields) || [];
    const fieldExistsArray = fieldExists?.map((ele: any) => ele?.name);
    if (!fieldExistsArray.includes(field.name)) {
      fieldExists.push(field);
      this.query.controls.fields.setValue(fieldExists);
      this.selectedFields = fieldExists;
    }
    // Removes the selected field from the available fields list
    this.availableFields = this.availableFields
      .filter((f: { name: string }) => f.name !== field.name)
      .sort((a, b) => (a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1));
  }

  /**
   * Adds field from available field to selected field list.
   */
  addSelectedField(): void {
    if (this.availableFieldIndex !== null) {
      const field = this.availableFields[this.availableFieldIndex];
      this.selectedFields.push(field);
      this.availableFields.splice(this.availableFieldIndex, 1);
      this.availableFields = this.availableFields.sort((a, b) =>
        a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1
      );
      this.availableFieldIndex = null;
      this.selectedFieldIndex = this.selectedFields.length - 1;
      this.query.controls.fields.setValue(this.selectedFields);
    }
  }

  /**
   * This function removes selected fields from the block table.
   *
   * @param index index of field to remove
   */
  removeSelectiveFields(index: number | null): void {
    if (index !== null) {
      const field = this.selectedFields[index];
      const fieldExists = this.query.controls.fields.value || [];
      const fieldIndex = fieldExists.findIndex(
        (f: { name: string }) => f.name === field.name
      );
      if (fieldIndex !== -1) {
        fieldExists.splice(fieldIndex, 1);
        this.query.controls.fields.setValue(fieldExists);
        this.selectedFields = fieldExists;
      }
      // Remove the field from the selectedFields array
      this.selectedFields = this.selectedFields.filter(
        (f: { name: string }) => f.name !== field.name
      );
      // Adds the deselected field back to the available fields list
      this.availableFields.push(field);
      this.availableFields = this.availableFields.sort((a, b) =>
        a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1
      );

      // Set the availableFieldsIndex to the index of the field in the availableFields list
      this.availableFieldIndex = this.availableFields.findIndex(
        (f) => f.name === field.name
      );
      this.selectedFieldIndex = null; // Reset the selected field index
    }
  }

  /**
   * Moves all selected fields back into available fields list.
   */
  removeAllSelectedFields(): void {
    this.availableFields = [
      ...this.availableFields,
      ...this.selectedFields.map((field: fieldStore) =>
        JSON.parse(JSON.stringify(field))
      ),
    ];
    this.selectedFields = [];
    this.availableFields.sort((a, b) =>
      a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1
    );
    this.query.controls.fields.setValue(this.selectedFields);
  }

  /**
   * Moves all available fields into selected fields list.
   */
  addAllAvailableFields(): void {
    this.selectedFields = [
      ...this.selectedFields,
      ...this.availableFields.map((field) => JSON.parse(JSON.stringify(field))),
    ];
    this.availableFields = [];
    this.query.controls.fields.setValue(this.selectedFields);
  }

  /**
   * Moves field up in selected fields list.
   *
   * @param index of field to be moved up
   */
  moveUp(index: number | null): void {
    if (index && index > 0) {
      const field = this.selectedFields[index];
      this.selectedFields.splice(index, 1);
      this.selectedFields.splice(index - 1, 0, field);
      this.selectedFieldIndex = index - 1;
      this.query.controls.fields.setValue(this.selectedFields);
    }
  }

  /**
   * Moves field down in selected fields list.
   *
   * @param index of field to be moved down.
   */
  moveDown(index: number | null): void {
    if (index !== null && index < this.selectedFields.length - 1) {
      const field = this.selectedFields[index];
      this.selectedFields.splice(index, 1);
      this.selectedFields.splice(index + 1, 0, field);
      this.selectedFieldIndex = index + 1;
      this.query.controls.fields.setValue(this.selectedFields);
    }
  }

  /**
   * Moves field in selected fields list to top of list.
   *
   * @param index of field to be moved to top.
   */
  moveTop(index: number | null): void {
    if (index !== null && index > 0) {
      const field = this.selectedFields[index];
      this.selectedFields.splice(index, 1);
      this.selectedFields.splice(0, 0, field);
      this.selectedFieldIndex = 0;
      this.query.controls.fields.setValue(this.selectedFields);
    }
  }

  /**
   * Moves field in selected fields list to bottom of list.
   *
   * @param index of field to be moved to bottom.
   */
  moveBottom(index: number | null): void {
    if (index !== null) {
      const field = this.selectedFields[index];
      this.selectedFields.splice(index, 1);
      this.selectedFields.push(field);
      this.selectedFieldIndex = this.selectedFields.length - 1;
      this.query.controls.fields.setValue(this.selectedFields);
    }
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
      if (this.query.get('filter') && this.query.get('filter').get('filters')) {
        const filtersArray = this.query
          .get('filter')
          .get('filters') as FormArray;

        // Iterate over the filters and update the value for 'inthelast' operators
        filtersArray.controls.forEach(
          (filterControl: AbstractControl, filterIndex: number) => {
            const filterFormGroup = filterControl as FormGroup;
            const operatorControl = filterFormGroup.get('operator');

            if (operatorControl && operatorControl.value === 'inthelast') {
              const inTheLastGroup = filterFormGroup.get(
                'inTheLast'
              ) as FormGroup;
              if (inTheLastGroup) {
                const inTheLastNumberControl = inTheLastGroup.get('number');
                const inTheLastUnitControl = inTheLastGroup.get('unit');

                if (inTheLastNumberControl && inTheLastUnitControl) {
                  const days = this.emailService.convertToMinutes(
                    inTheLastNumberControl.value,
                    inTheLastUnitControl.value
                  );
                  // Sets filter value to the in the last filter converted to minutes.
                  filterFormGroup.get('value')?.setValue(days);
                  this.queryValue[this.activeTab.index].filter.filters[
                    filterIndex
                  ].value = days;
                }
              }
            }
          }
        );
      }

      if (tabName == 'filter') {
        const query = this.queryValue[this.activeTab.index];
        query.pageSize = 1;
        query.tabIndex = this.activeTab.index;
        this.loading = true;
        /**
         Fetches the data records for selected fields
        (by default its all records in the resource).
         */
        this.fetchDataSet(query).subscribe(
          (res: any) => {
            this.loading = false;
            this.totalMatchingRecords = res?.data?.dataSet?.totalCount;
            if (res?.data?.dataSet?.totalCount <= 50) {
              this.datasetPreview.selectTab(1);
              this.showDatasetLimitWarning = false;
              this.emailService.disableSaveAndProceed.next(false);
            } else {
              this.showDatasetLimitWarning = true;
              this.emailService.disableSaveAndProceed.next(true);
            }
          },
          (error: any) => {
            this.loading = false;
            this.showDatasetLimitWarning = false;
            this.emailService.disableSaveAndProceed.next(true);
            this.snackBar.openSnackBar(
              error?.message ?? 'Something Went Wrong',
              { error: true }
            );
          }
        );
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
          query.fields.forEach((x: any) => {
            /**
             * Converts the resource field name to parents name
             * so the resource parent is converted back to an object.
             */
            if (x.parentName) {
              const child = x.name;
              x.childName = child.split(' - ')[1];
              x.name = x.parentName;
              x.childType = x.type;
              x.type = TYPE_LABEL.resource;
            }
          });

          if (count == 0) {
            this.loading = true;
          }
          query.tabIndex = count;
          count++;
          query.pageSize = 50;
          this.fetchDataSet(query).subscribe(
            (res: { data: { dataSet: any } }) => {
              if (res?.data?.dataSet) {
                this.dataSetResponse = res?.data?.dataSet;
                this.dataList = res?.data?.dataSet.records?.map(
                  (record: any) => {
                    const flattenedObject = this.emailService.flattenRecord(
                      record,
                      query
                    );
                    query.fields.forEach((x: any) => {
                      /**
                       * Converts the resource field name back to {resourceName} - {resourceField}
                       * so the field can be mapped to the correct data.
                       */
                      if (x.parentName) {
                        x.name = `${x.parentName} - ${x.childName}`;
                        x.type = x.childType;
                      }
                    });

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
                  const tempIndex = res?.data?.dataSet?.tabIndex;
                  this.dataSetFields = [
                    ...new Set(
                      this.queryValue[tempIndex].fields
                        .map((data: any) => data.name)
                        .flat()
                    ),
                  ];
                }
                allPreviewData.push({
                  dataList: this.dataList,
                  dataSetFields: this.dataSetFields,
                  tabIndex: res?.data?.dataSet?.tabIndex,
                  tabName:
                    res?.data?.dataSet?.tabIndex < this.queryValue.length
                      ? this.queryValue[res.data.dataSet.tabIndex].name
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
    this.emailService.selectedDataSet = '';
    this.emailService.toEmailFilter = '';
    this.emailService.ccEmailFilter = '';
    this.emailService.bccEmailFilter = '';
  }

  /**
   * Update input type of date editor.
   */
  public changeEditor(): void {
    this.useExpression = !this.useExpression;
  }

  /**
   * Updating the separate email boolean flag on change
   */
  onChangeSeparateEmail() {
    this.emailService.setSeperateEmail(
      this.separateEmail,
      this.activeTab.index
    );
  }
}
