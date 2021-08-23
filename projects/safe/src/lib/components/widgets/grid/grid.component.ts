import { Apollo } from 'apollo-angular';
import { CompositeFilterDescriptor, filterBy, orderBy, SortDescriptor } from '@progress/kendo-data-query';
import {
  GridComponent as KendoGridComponent,
  GridDataResult,
  PageChangeEvent,
  SelectableSettings,
  SelectionEvent,
  PagerSettings,
  ColumnResizeArgs,
  ColumnBase,
  ColumnVisibilityChangeEvent
} from '@progress/kendo-angular-grid';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  CONVERT_RECORD,
  ConvertRecordMutationResponse, EDIT_RECORD, EditRecordMutationResponse,
  PUBLISH, PUBLISH_NOTIFICATION, PublishMutationResponse, PublishNotificationMutationResponse, DELETE_RECORDS
} from '../../../graphql/mutations';
import { SafeFormModalComponent } from '../../form-modal/form-modal.component';
import { Subscription } from 'rxjs';
import { QueryBuilderService } from '../../../services/query-builder.service';
import { SafeConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { SafeConvertModalComponent } from '../../convert-modal/convert-modal.component';
import { Form } from '../../../models/form.model';
import { GET_RECORD_DETAILS, GetRecordDetailsQueryResponse, GetRecordByIdQueryResponse, GET_RECORD_BY_ID } from '../../../graphql/queries';
import { SafeRecordHistoryComponent } from '../../record-history/record-history.component';
import { SafeLayoutService } from '../../../services/layout.service';
import {
  Component, OnInit, OnChanges, OnDestroy, ViewChild, Input, Output, ComponentFactory, Renderer2,
  ComponentFactoryResolver, EventEmitter, Inject, AfterViewInit, AfterContentInit, AfterViewChecked, QueryList
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SafeSnackBarService } from '../../../services/snackbar.service';
import { SafeRecordModalComponent } from '../../record-modal/record-modal.component';
import { GradientSettings } from '@progress/kendo-angular-inputs';
import { SafeWorkflowService } from '../../../services/workflow.service';
import { SafeChooseRecordModalComponent } from '../../choose-record-modal/choose-record-modal.component';
import { SafeDownloadService } from '../../../services/download.service';
import { NOTIFICATIONS } from '../../../const/notifications';
import { SafeExpandedCommentComponent } from './expanded-comment/expanded-comment.component';
import {ActivatedRoute} from '@angular/router';
import {SafeAuthService} from '../../../services/auth.service';

const matches = (el: any, selector: any) => (el.matches || el.msMatchesSelector).call(el, selector);

const DEFAULT_FILE_NAME = 'grid.xlsx';

const cloneData = (data: any[]) => data.map(item => Object.assign({}, item));

const DISABLED_FIELDS = ['id', 'createdAt', 'modifiedAt'];

const SELECTABLE_SETTINGS: SelectableSettings = {
  checkboxOnly: true,
  mode: 'multiple',
  drag: false
};

const PAGER_SETTINGS: PagerSettings = {
  buttonCount: 5,
  type: 'numeric',
  info: true,
  pageSizes: true,
  previousNext: true
};

const GRADIENT_SETTINGS: GradientSettings = {
  opacity: false
};

const MULTISELECT_TYPES: string[] = ['checkbox', 'tagbox'];
@Component({
  selector: 'safe-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
/*  Grid widget using KendoUI.
*/
export class SafeGridComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {

  // === CONST ACCESSIBLE IN TEMPLATE ===
  public multiSelectTypes: string[] = MULTISELECT_TYPES;

  // === TEMPLATE REFERENCE TO KENDO GRID ===
  @ViewChild(KendoGridComponent)
  private grid?: KendoGridComponent;

  // === DETECTION OF TRIGGER FOR INLINE EDITION ===
  private docClickSubscription: any;

  // === DATA ===
  public gridData: GridDataResult = { data: [], total: 0 };
  private items: any[] = [];
  private originalItems: any[] = [];
  private updatedItems: any[] = [];
  private editedRowIndex = 0;
  private editedRecordId = '';
  public formGroup: FormGroup = new FormGroup({});
  private isNew = false;
  public loading = true;
  public queryError = false;
  public fields: any[] = [];
  private metaFields: any;
  public detailsField: any;
  public canEdit = false;
  private dataQuery: any;
  private metaQuery: any;
  private dataSubscription?: Subscription;
  private dashboardId = 0;
  private id = '';
  private columnsOrder: any[] = [];
  private storedObj: any = {};
  private stopReorderEvent = false;
  private columnsWidth: any[] = [];
  private columnsDisplay: any[] = [];

  // === VERIFICATION IF USER IS ADMIN ===
  public isAdmin: boolean;

  // === VERIFICATION UPDATE FIELDS ===
  private checkFieldsUpdated: boolean;

  // === SORTING ===
  public sort: SortDescriptor[] = [];

  // === PAGINATION ===
  public pageSize = 10;
  public skip = 0;

  // === FILTER ===
  public filter: CompositeFilterDescriptor = { logic: 'and', filters: [] };
  public showFilter = false;

  // === SETTINGS ===
  @Input() header = true;
  @Input() settings: any = null;
  @Input() widgetId = 0;

  // === PARENT DATA FOR CHILDREN-GRID ===
  @Input() parent: any;

  // === ACTIONS ON SELECTION ===
  public selectedRowsIndex: number[] = [];
  public hasEnabledActions = false;
  public canUpdateSelectedRows = false;
  public canDeleteSelectedRows = false;
  public selectableSettings = SELECTABLE_SETTINGS;
  public pagerSettings = PAGER_SETTINGS;
  public gradientSettings = GRADIENT_SETTINGS;
  public editionActive = false;

  // === EMIT STEP CHANGE FOR WORKFLOW ===
  @Output() goToNextStep: EventEmitter<any> = new EventEmitter();

  // === NOTIFY CHANGE OF GRID CHILD ===
  @Output() childChanged: EventEmitter<any> = new EventEmitter();

  // === HISTORY COMPONENT TO BE INJECTED IN LAYOUT SERVICE ===
  public factory?: ComponentFactory<any>;

  // === DOWNLOAD ===
  public excelFileName = '';
  private apiUrl = '';
  public exportData: Array<any> = [
    {
      text: '.csv',
      click: () => this.onExportRecord(this.selectedRowsIndex, 'csv')
    },
    {
      text: '.xlsx',
      click: () => this.onExportRecord(this.selectedRowsIndex, 'xlsx')
    }
  ];

  get hasChanges(): boolean {
    return this.updatedItems.length > 0;
  }

  constructor(
    @Inject('environment') environment: any,
    private apollo: Apollo,
    private http: HttpClient,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private renderer: Renderer2,
    private queryBuilder: QueryBuilderService,
    private layoutService: SafeLayoutService,
    private resolver: ComponentFactoryResolver,
    private snackBar: SafeSnackBarService,
    private workflowService: SafeWorkflowService,
    private downloadService: SafeDownloadService,
    private route: ActivatedRoute,
    private safeAuthService: SafeAuthService
  ) {
    this.apiUrl = environment.API_URL;
    this.checkFieldsUpdated = false;
    this.isAdmin = false;
  }

  ngOnInit(): void {
    this.factory = this.resolver.resolveComponentFactory(SafeRecordHistoryComponent);
    // Creation of the unique id (in order to identify the grid in the local storage)
    this.route.params.subscribe((params) => {
      this.dashboardId = params.id;
    });
    this.id = this.dashboardId.toString() + this.widgetId;

    // initialization of storedObj (it represent the localStorage)
    this.storedObj = JSON.parse(localStorage.getItem(this.id) || '{}');

    // Update columns filters
    this.filter = this.storedObj.filter;
    this.loadItems();
  }

  /*  Detect changes of the settings to (re)load the data.
  */
  ngOnChanges(): void {
    this.hasEnabledActions = !this.settings.actions ||
      Object.entries(this.settings.actions).filter((action) => action.includes(true)).length > 0;
    this.excelFileName = this.settings.title ? `${this.settings.title}.xlsx` : DEFAULT_FILE_NAME;
    this.dataQuery = this.queryBuilder.buildQuery(this.settings);
    this.metaQuery = this.queryBuilder.buildMetaQuery(this.settings, this.parent);
    if (this.metaQuery) {
      this.metaQuery.subscribe((res: any) => {
        this.queryError = false;
        for (const field in res.data) {
          if (Object.prototype.hasOwnProperty.call(res.data, field)) {
            this.metaFields = res.data[field];
          }
        }
        this.getRecords();
      }, () => {
        this.loading = false;
        this.queryError = true;
      });
    } else {
      this.loading = false;
      this.queryError = true;
    }
    this.docClickSubscription = this.renderer.listen('document', 'click', this.onDocumentClick.bind(this));
  }

  ngAfterViewChecked(): void {
    // checkFieldsUpdated enable us to not have to call again and again the updateFeature methode
    // because the ngAfterViewChecked() methode is called many times
    // but we have to use ngAfterViewChecked() because before that the grid fields are not initialized
    if (!this.checkFieldsUpdated){
      // Update columns: order, width and display
      this.updateFeature('columnsOrder');
      this.updateFeature('columnsWidth');
      this.updateFeature('columnsDisplay');
    }
  }

  private flatDeep(arr: any[]): any[] {
    return arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? this.flatDeep(val) : val), []);
  }

  private getFields(fields: any[], prefix?: string, disabled?: boolean): any[] {
    return this.flatDeep(fields.filter(x => x.kind !== 'LIST').map(f => {
      const fullName = prefix ? `${prefix}.${f.name}` : f.name;
      switch (f.kind) {
        case 'OBJECT': {
          return this.getFields(f.fields, fullName, true);
        }
        default: {
          return {
            name: fullName,
            title: f.label ? f.label : f.name,
            type: f.type,
            format: this.getFormat(f.type),
            editor: this.getEditor(f.type),
            filter: this.getFilter(f.type),
            meta: this.metaFields[fullName],
            disabled: disabled || DISABLED_FIELDS.includes(f.name) || this.metaFields[fullName].readOnly,
            order: 0
          };
        }
      }
    }));
  }

  private convertDateFields(items: any[]): void {
    const dateFields = this.fields.filter(x => ['Date', 'DateTime', 'Time'].includes(x.type)).map(x => x.name);
    items.map(x => {
      for (const [key, value] of Object.entries(x)) {
        if (dateFields.includes(key)) {
          x[key] = x[key] && new Date(x[key]);
        }
      }
    });
  }

  /*  Load the data, using widget parameters.
  */
  private getRecords(): void {
    this.loading = true;
    this.updatedItems = [];

    // Child grid
    if (!!this.parent) {
      this.items = this.parent[this.settings.name];
      if (this.items.length > 0) {
        this.fields = this.getFields(this.settings.fields);
        this.convertDateFields(this.items);
        this.originalItems = cloneData(this.items);
        this.detailsField = this.settings.fields.find((x: any) => x.kind === 'LIST');
      } else {
        this.originalItems = [];
        this.fields = [];
        this.detailsField = '';
      }
      this.loadItems();
      this.loading = false;

      // Parent grid
    } else {
      if (this.dataQuery) {
        this.dataSubscription = this.dataQuery.valueChanges.subscribe((res: any) => {
          this.queryError = false;
          const fields = this.settings.query.fields;
          for (const field in res.data) {
            if (Object.prototype.hasOwnProperty.call(res.data, field)) {
              this.loading = false;
              this.fields = this.getFields(fields);
              this.items = cloneData(res.data[field] ? res.data[field] : []);
              this.convertDateFields(this.items);
              this.originalItems = cloneData(this.items);
              this.detailsField = fields.find((x: any) => x.kind === 'LIST');
              if (this.detailsField) {
                this.detailsField = { ...this.detailsField, actions: this.settings.actions };
              }
              this.loadItems();
            }
          }
        },
        () => {
          this.queryError = true;
          this.loading = false;
        });
      } else {
        this.loading = false;
      }
    }
  }

  /*  Set the list of items to display.
  */
  private loadItems(): void {
    this.gridData = {
      data: (this.sort ? orderBy((this.filter ? filterBy(this.items, this.filter) : this.items), this.sort) :
        (this.filter ? filterBy(this.items, this.filter) : this.items))
        .slice(this.skip, this.skip + this.pageSize),
      total: this.items.length
    };
  }

  /*  Display an embedded form in a modal to add new record.
    Create a record if result not empty.
  */
  public onAdd(): void {
    const dialogRef = this.dialog.open(SafeFormModalComponent, {
      data: {
        template: this.settings.addTemplate,
        locale: 'en'
      }
    });
  }

  /*  Inline edition of the data.
  */
  public cellClickHandler({ isEdited, dataItem, rowIndex }: any): void {
    if (!this.gridData.data[rowIndex].canUpdate || isEdited || (this.formGroup && !this.formGroup.valid)) {
      return;
    }

    if (this.isNew) {
      rowIndex += 1;
    }

    if (this.editedRecordId) {
      this.updateCurrent();
    }

    this.formGroup = this.createFormGroup(dataItem);
    this.editedRecordId = dataItem.id;
    this.editedRowIndex = rowIndex;

    this.grid?.editRow(rowIndex, this.formGroup);
  }

  public cancelHandler(): void {
    this.closeEditor();
  }

  /*  Update a record when inline edition completed.
  */
  public updateCurrent(): void {
    if (this.isNew) {
    } else {
      if (this.formGroup.dirty) {
        this.update(this.editedRecordId, this.formGroup.value);
      }
    }
    this.closeEditor();
  }

  private update(id: string, value: any): void {
    const item = this.updatedItems.find(x => x.id === id);
    if (item) {
      Object.assign(item, { ...value, id });
    } else {
      this.updatedItems.push({ ...value, id });
    }
    Object.assign(this.items.find(x => x.id === id), value);
  }

  /*  Close the inline edition.
  */
  private closeEditor(): void {
    this.grid?.closeRow(this.editedRowIndex);
    this.grid?.cancelCell();
    this.isNew = false;
    this.editedRowIndex = 0;
    this.editedRecordId = '';
    this.formGroup = new FormGroup({});
  }

  /* Save all in-line changes and then reload data
  */
  public onSaveChanges(): void {
    this.closeEditor();
    if (this.hasChanges) {
      Promise.all(this.promisedChanges()).then(() => this.reloadData());
    }
  }

  private promisedChanges(): Promise<any>[] {
    const promises: Promise<any>[] = [];
    for (const item of this.updatedItems) {
      const data = Object.assign({}, item);
      delete data.id;
      promises.push(this.apollo.mutate<EditRecordMutationResponse>({
        mutation: EDIT_RECORD,
        variables: {
          id: item.id,
          data
        }
      }).toPromise());
    }
    return promises;
  }

  public onCancelChanges(): void {
    this.closeEditor();
    this.updatedItems = [];
    this.items = this.originalItems;
    this.originalItems = cloneData(this.originalItems);
    this.loadItems();
  }

  /*  Detect document click to save record if outside the inline edition form.
  */
  private onDocumentClick(e: any): void {
    if (this.formGroup && !this.editionActive && this.formGroup.valid &&
      !matches(e.target, '#customGrid tbody *, #customGrid .k-grid-toolbar .k-button .k-animation-container')) {
      this.updateCurrent();
    }
  }

  private getEditor(type: any): string {
    switch (type) {
      case 'Int': {
        return 'numeric';
      }
      case 'Float': {
        return 'float';
      }
      case 'Boolean': {
        return 'boolean';
      }
      case 'Date': {
        return 'date';
      }
      case 'DateTime': {
        return 'datetime';
      }
      case 'Time': {
        return 'time';
      }
      case 'JSON': {
        return '';
      }
      default: {
        return 'text';
      }
    }
  }

  private getFormat(type: any): string {
    switch (type) {
      case 'Date':
        return 'dd/MM/yy';
      case 'DateTime':
        return 'dd/MM/yy HH:mm';
      case 'Time':
        return 'HH:mm';
      default:
        return '';
    }
  }

  private getFilter(type: any): string {
    switch (type) {
      case 'Int': {
        return 'numeric';
      }
      case 'Boolean': {
        return 'boolean';
      }
      case 'Date': {
        return 'date';
      }
      case 'DateTime': {
        return 'date';
      }
      case 'Time': {
        return 'date';
      }
      case 'JSON': {
        return '';
      }
      default: {
        return 'text';
      }
    }
  }

  /* Generates the form group for in-line edition.
  */
  public createFormGroup(dataItem: any): FormGroup {
    const formGroup: any = {};
    this.fields.filter(x => !x.disabled).forEach((field, index) => {
      if (field.type !== 'JSON' || this.multiSelectTypes.includes(field.meta.type)) {
        formGroup[field.name] = [dataItem[field.name]];
        if ((field.meta.type === 'dropdown' || this.multiSelectTypes.includes(field.meta.type)) && field.meta.choicesByUrl) {
          this.http.get(field.meta.choicesByUrl.url).toPromise().then((res: any) => {
            this.fields[index] = {
              ...field,
              meta: { ...field.meta, choices: field.meta.choicesByUrl.path ? res[field.meta.choicesByUrl.path] : res }
            };
          });
        }
      } else {
        if (field.meta.type === 'multipletext') {
          const fieldGroup: any = {};
          for (const item of field.meta.items) {
            fieldGroup[item.name] = [dataItem[field.name] ? dataItem[field.name][item.name] : null];
          }
          formGroup[field.name] = this.formBuilder.group(fieldGroup);
        }
        if (field.meta.type === 'matrix') {
          const fieldGroup: any = {};
          for (const row of field.meta.rows) {
            fieldGroup[row.name] = [dataItem[field.name] ? dataItem[field.name][row.name] : null];
          }
          formGroup[field.name] = this.formBuilder.group(fieldGroup);
        }
        if (field.meta.type === 'matrixdropdown') {
          const fieldGroup: any = {};
          const fieldValue = dataItem[field.name];
          for (const row of field.meta.rows) {
            const rowValue = fieldValue ? fieldValue[row.name] : null;
            const rowGroup: any = {};
            for (const column of field.meta.columns) {
              const columnValue = rowValue ? rowValue[column.name] : null;
              rowGroup[column.name] = [columnValue];
            }
            fieldGroup[row.name] = this.formBuilder.group(rowGroup);
          }
          formGroup[field.name] = this.formBuilder.group(fieldGroup);
        }
        if (field.meta.type === 'matrixdynamic') {
          const fieldArray: any = [];
          const fieldValue = dataItem[field.name] ? dataItem[field.name] : [];
          for (const rowValue of fieldValue) {
            const rowGroup: any = {};
            for (const column of field.meta.columns) {
              const columnValue = rowValue ? rowValue[column.name] : null;
              if (this.multiSelectTypes.includes(column.cellType)) {
                rowGroup[column.name] = [columnValue];
              } else {
                rowGroup[column.name] = columnValue;
              }
            }
            fieldArray.push(this.formBuilder.group(rowGroup));
          }
          formGroup[field.name] = this.formBuilder.array(fieldArray);
        }
      }
    });
    return this.formBuilder.group(formGroup);
  }

  /*  Detect sort events and update the items loaded.
  */
  public sortChange(sort: SortDescriptor[]): void {
    this.sort = sort;
    this.skip = 0;
    this.loadItems();
  }

  /*  Detect pagination events and update the items loaded.
  */
  public pageChange(event: PageChangeEvent): void {
    this.loading = true;
    this.skip = event.skip;
    this.pageSize = event.take;
    this.selectedRowsIndex = [];
    this.canUpdateSelectedRows = false;
    this.canDeleteSelectedRows = false;
    this.loadItems();
    this.loading = false;
  }

  /*  Detect filtering events and update the items loaded.
  */
  public filterChange(filter: CompositeFilterDescriptor): void {
    this.isAdmin = this.safeAuthService.userIsAdmin;
    this.filter = filter;
    this.storedObj.filter = this.filter;
    localStorage.setItem(this.id, JSON.stringify(this.storedObj));
    this.loadItems();
  }

  /* Detect selection event and display actions available on rows.
  */
  public selectionChange(selection: SelectionEvent): void {
    const deselectedRows = selection.deselectedRows || [];
    const selectedRows = selection.selectedRows || [];
    if (deselectedRows.length > 0) {
      const deselectIndex = deselectedRows.map((item => item.index - this.skip));
      this.selectedRowsIndex = [...this.selectedRowsIndex.filter((item) => !deselectIndex.includes(item))];
    }
    if (selectedRows.length > 0) {
      const selectedItems = selectedRows.map((item) => item.index - this.skip);
      this.selectedRowsIndex = this.selectedRowsIndex.concat(selectedItems);
    }
    this.canUpdateSelectedRows = !this.gridData.data.some((x, idx) => this.selectedRowsIndex.includes(idx) && !x.canUpdate);
    this.canDeleteSelectedRows = !this.gridData.data.some((x, idx) => this.selectedRowsIndex.includes(idx) && !x.canDelete);
  }

  /* Open the form corresponding to selected row in order to update it
  */
  public onUpdateRow(items: number | number[]): void {
    const ids = (Array.isArray(items) && items.length > 1) ? items.map((i) => (this.gridData.data as any)[i].id) :
      (Array.isArray(items) ? this.gridData.data[(items as any)[0]].id : items);
    const dialogRef = this.dialog.open(SafeFormModalComponent, {
      data: {
        recordId: ids,
        locale: 'en'
      }
    });
    dialogRef.afterClosed().subscribe(value => {
      if (value) {
        this.reloadData();
      }
    });
  }

  /* Opens the history of the record on the right side of the screen.
  */
  public onViewHistory(id: string): void {
    this.apollo.query<GetRecordDetailsQueryResponse>({
      query: GET_RECORD_DETAILS,
      variables: {
        id
      }
    }).subscribe(res => {
      this.layoutService.setRightSidenav({
        factory: this.factory,
        inputs: {
          record: res.data.record,
          revert: (item: any, dialog: any) => {
            this.confirmRevertDialog(res.data.record, item);
          }
        },
      });
    });
  }

  /* Opens the record on a read-only modal.
  */
  public onShowDetails(id: string): void {
    this.dialog.open(SafeRecordModalComponent, {
      data: {
        recordId: id,
        locale: 'en'
      },
      height: '98%',
      width: '100vw',
      panelClass: 'full-screen-modal',
    });
  }

  private confirmRevertDialog(record: any, version: any): void {
    const date = new Date(parseInt(version.created, 0));
    const formatDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const dialogRef = this.dialog.open(SafeConfirmModalComponent, {
      data: {
        title: `Recovery data`,
        content: `Do you confirm recovery the data from ${formatDate} to the current register?`,
        confirmText: 'Confirm',
        confirmColor: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(value => {
      if (value) {
        this.apollo.mutate<EditRecordMutationResponse>({
          mutation: EDIT_RECORD,
          variables: {
            id: record.id,
            version: version.id
          }
        }).subscribe((res) => {
          this.reloadData();
          this.layoutService.setRightSidenav(null);
          this.snackBar.openSnackBar(NOTIFICATIONS.dataRecovered);
        });

      }
    });
  }

  /* Open a confirmation modal and then delete the selected record
  */
  public onDeleteRow(items: number[]): void {
    const recordIds: string[] = [];
    for (const index of items) {
      const id = this.gridData.data[index].id;
      recordIds.push(id);
    }
    const rowsSelected = items.length;
    const dialogRef = this.dialog.open(SafeConfirmModalComponent, {
      data: {
        title: `Delete row${rowsSelected > 1 ? 's' : ''}`,
        content: `Do you confirm the deletion of ${rowsSelected > 1 ?
          'these ' + rowsSelected : 'this'} row${rowsSelected > 1 ? 's' : ''} ?`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    dialogRef.afterClosed().subscribe(value => {
      if (value) {
        this.apollo.mutate<EditRecordMutationResponse>({
          mutation: DELETE_RECORDS,
          variables: {
            ids: recordIds
          }
        }).subscribe(() => {
          this.reloadData();
          this.layoutService.setRightSidenav(null);
        });
      }
    });
  }

  /* Export selected records to a csv file
  */
  public onExportRecord(items: number[], type: string): void {
    const ids: any[] = [];
    for (const index of items) {
      const id = this.gridData.data[index].id;
      ids.push(id);
    }
    const url = `${this.apiUrl}/download/records`;
    const fileName = `${this.settings.title}.${type}`;
    const queryString = new URLSearchParams({ type }).toString();
    this.downloadService.getFile(`${url}?${queryString}`, `text/${type};charset=utf-8;`, fileName, { params: { ids: ids.join(',') } });
  }

  /* Open a dialog component which provide tools to convert the selected record
  */
  public onConvertRecord(items: number[]): void {
    const rowsSelected = items.length;
    const record: string = this.gridData.data[items[0]].id;
    const dialogRef = this.dialog.open(SafeConvertModalComponent, {
      data: {
        title: `Convert record${rowsSelected > 1 ? 's' : ''}`,
        record
      },
    });
    dialogRef.afterClosed().subscribe((value: { targetForm: Form, copyRecord: boolean }) => {
      if (value) {
        const promises: Promise<any>[] = [];
        for (const index of items) {
          const id = this.gridData.data[index].id;
          promises.push(this.apollo.mutate<ConvertRecordMutationResponse>({
            mutation: CONVERT_RECORD,
            variables: {
              id,
              form: value.targetForm.id,
              copyRecord: value.copyRecord
            }
          }).toPromise());
        }
        Promise.all(promises).then(() => {
          this.reloadData();
        });
      }
    });
  }

  /* Reload data and unselect all rows
  */
  public reloadData(): void {
    if (!this.parent) {
      if (this.dataSubscription) {
        this.dataSubscription.unsubscribe();
      }
      this.dataQuery = this.queryBuilder.buildQuery(this.settings);
      this.getRecords();
    } else {
      this.childChanged.emit();
    }
    this.selectedRowsIndex = [];
  }

  /* Execute sequentially actions enabled by settings for the floating button
  */
  public async onFloatingButtonClick(options: any): Promise<void> {
    let rowsIndexToModify = [...this.selectedRowsIndex];

    if (options.autoSave && options.modifySelectedRows) {
      const unionRows = this.selectedRowsIndex.filter(index => this.updatedItems.some(item => item.id === this.gridData.data[index].id));
      if (unionRows.length > 0) {
        await Promise.all(this.promisedRowsModifications(options.modifications, unionRows));
        this.updatedItems = this.updatedItems.filter(x => !unionRows.some(y => x.id === this.gridData.data[y].id));
        rowsIndexToModify = rowsIndexToModify.filter(x => !unionRows.includes(x));
      }
    }

    if (options.autoSave) {
      await Promise.all(this.promisedChanges());
    }
    if (options.modifySelectedRows) {
      await Promise.all(this.promisedRowsModifications(options.modifications, rowsIndexToModify));
    }
    if (this.selectedRowsIndex.length > 0) {
      const selectedRecords = this.gridData.data.filter((x, index) => this.selectedRowsIndex.includes(index));
      if (options.attachToRecord) {
        await this.promisedAttachToRecord(selectedRecords, options.targetForm, options.targetFormField, options.targetFormQuery);
      }
      const promises: Promise<any>[] = [];
      if (options.notify) {
        promises.push(this.apollo.mutate<PublishNotificationMutationResponse>({
          mutation: PUBLISH_NOTIFICATION,
          variables: {
            action: options.notificationMessage ? options.notificationMessage : 'Records update',
            content: selectedRecords,
            channel: options.notificationChannel
          }
        }).toPromise());
      }
      if (options.publish) {
        promises.push(this.apollo.mutate<PublishMutationResponse>({
          mutation: PUBLISH,
          variables: {
            ids: selectedRecords.map(x => x.id),
            channel: options.publicationChannel
          }
        }).toPromise());
      }
      if (options.sendMail) {
        const body = this.buildBody(this.selectedRowsIndex, options.bodyFields);
        window.location.href = `mailto:${options.distributionList}?subject=${options.subject}&body=${encodeURIComponent(body)}`;
        this.onExportRecord(this.selectedRowsIndex, 'xlsx');
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      if (options.passDataToNextStep) {
        const promisedRecords: Promise<any>[] = [];
        for (const record of selectedRecords) {
          promisedRecords.push(this.apollo.query<GetRecordDetailsQueryResponse>({
            query: GET_RECORD_DETAILS,
            variables: {
              id: record.id
            }
          }).toPromise());
        }
        const records = (await Promise.all(promisedRecords)).map(x => x.data.record);
        this.workflowService.storeRecords(records);
      }
    }
    if (options.goToNextStep) {
      this.goToNextStep.emit(true);
    } else {
      this.reloadData();
    }
  }

  /*  Return a list of promises containing all the mutations in order to modify selected records accordingly to settings.
      Apply inline edition before applying modifications.
  */
  private promisedRowsModifications(modifications: any[], rows: number[]): Promise<any>[] {
    const promises: Promise<any>[] = [];
    for (const index of rows) {
      const record = this.gridData.data[index];
      const data = Object.assign({}, record);
      for (const modification of modifications) {
        data[modification.field.name] = modification.value;
      }
      delete data.id;
      delete data.__typename;
      promises.push(this.apollo.mutate<EditRecordMutationResponse>({
        mutation: EDIT_RECORD,
        variables: {
          id: record.id,
          data
        }
      }).toPromise());
    }
    return promises;
  }

  /* Download the file.
  */
  public onDownload(file: any): void {
    const path = `download/file/${file.content}`;
    this.downloadService.getFile(path, file.type, file.name);
  }

  /* Open a modal to select which record we want to attach the rows to and perform the attach.
  */
  private async promisedAttachToRecord(
    selectedRecords: any[], targetForm: Form, targetFormField: string, targetFormQuery: any): Promise<void> {
    const dialogRef = this.dialog.open(SafeChooseRecordModalComponent, {
      data: {
        targetForm,
        targetFormField,
        targetFormQuery
      },
    });
    const value = await Promise.resolve(dialogRef.afterClosed().toPromise());
    if (value && value.record) {
      this.apollo.query<GetRecordByIdQueryResponse>({
        query: GET_RECORD_BY_ID,
        variables: {
          id: value.record
        }
      }).subscribe(res => {
        const resourceField = targetForm.fields?.find(field => field.resource && field.resource === this.settings.resource);
        let data = res.data.record.data;
        const key = resourceField.name;
        if (resourceField.type === 'resource') {
          data = { ...data, [key]: selectedRecords[0].id };
        } else {
          if (data[key]) {
            const ids = selectedRecords.map(x => x.id);
            data = { ...data, [key]: data[key].concat(ids) };
          } else {
            data = { ...data, [key]: selectedRecords.map(x => x.id) };
          }
        }
        this.apollo.mutate<EditRecordMutationResponse>({
          mutation: EDIT_RECORD,
          variables: {
            id: value.record,
            data
          }
        }).subscribe(res2 => {
          if (res2.data) {
            const record = res2.data.editRecord;
            if (record) {
              this.snackBar.openSnackBar(NOTIFICATIONS.addRowsToRecord(selectedRecords.length, key, record.data[targetFormField]));
              this.dialog.open(SafeFormModalComponent, {
                data: {
                  recordId: record.id,
                  locale: 'en'
                }
              });
            }
          }
        });
      });
    }
  }

  /* Dialog to open if text or comment overlows
  */
  public onExpandComment(item: any, rowTitle: any): void {
    const dialogRef = this.dialog.open(SafeExpandedCommentComponent, {
      data: {
        title: rowTitle,
        comment: item[rowTitle]
      },
      autoFocus: false,
      position: {
        bottom: '0',
        right: '0'
      },
      panelClass: 'expanded-widget-dialog'
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== item[rowTitle]) {
        this.gridData.data.find(x => x.id === item.id)[rowTitle] = res;
        this.items.find(x => x.id === item.id)[rowTitle] = res;
        if (this.updatedItems.find(x => x.id === item.id) !== undefined) {
          this.updatedItems.find(x => x.id === item.id)[rowTitle] = res;
        }
        else {
          this.updatedItems.push({ [rowTitle]: res, id: item.id });
        }
      }
    });
  }

  /* Check if element overflows
  */
  isEllipsisActive(e: any): boolean {
    return (e.offsetWidth < e.scrollWidth);
  }

  /**
   * Toggle quick filter visibility
   */
  public onToggleFilter(): void {
    this.showFilter = !this.showFilter;
    if (this.showFilter) {
      this.fields.filter(x => !x.disabled).forEach((field, index) => {
        if (field.type !== 'JSON' || this.multiSelectTypes.includes(field.meta.type)) {
          if ((field.meta.type === 'dropdown' || this.multiSelectTypes.includes(field.meta.type)) && field.meta.choicesByUrl) {
            this.http.get(field.meta.choicesByUrl.url).toPromise().then((res: any) => {
              this.fields[index] = {
                ...field,
                meta: { ...field.meta, choices: field.meta.choicesByUrl.path ? res[field.meta.choicesByUrl.path] : res }
              };
            });
          }
        }
      });
    }
  }

  /*
   * Build email body in plain text from selected rows
   */
  private buildBody(rowsIndex: number[], fields: any): string {
    let body = '';
    let i = 1;
    for (const index of rowsIndex) {
      body += `######   ${i}   ######\n`;
      const item = this.gridData.data[index];
      body += this.buildBodyRow(item, fields);
      body += '______________________\n';
      i ++;
    }
    return body;
  }

  private buildBodyRow(item: any, fields: any, tabs = ''): string {
    let body = '';
    for (const field of fields) {
      switch (field.kind) {
        case 'LIST':
          body += `${tabs}${field.name}:\n`;
          const list = item ? item[field.name] || [] : [];
          list.forEach((element: any, index: number) => {
            body += this.buildBodyRow(element, field.fields, tabs + '\t');
            if (index < (list.length - 1)) {
              body += `${tabs + '\t'}______________________\n`;
            }
          });
          break;
        case 'OBJECT':
          body += `${tabs}${field.name}:\n`;
          body += this.buildBodyRow(item ? item[field.name] : null, field.fields, tabs + '\t');
          break;
        default:
          body += `${tabs}${field.name}:   ${item ? item[field.name] : ''}\n`;
      }
    }
    return body;
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  /**
   * Update the feature we want we want
   * @param storedObjFieldArg the feature we want to update (storage side)
   * (for the moment, only: columnsOrder, columnsWidth, columnsDisplay)
   */
  updateFeature(storedObjFieldArg: string): void {
    if (this.grid?.columns.toArray().length !== 0
      && (storedObjFieldArg === 'columnsOrder'
        || storedObjFieldArg === 'columnsWidth'
        || storedObjFieldArg === 'columnsDisplay')){
      if (this.storedObj[storedObjFieldArg] !== null && this.storedObj[storedObjFieldArg] !== undefined){
        if (this.storedObj[storedObjFieldArg].length !== 0){
          const storedField = this.storedObj[storedObjFieldArg];
          let verify = false;
          const fieldsToAdd = [];
          const fieldsToRemove = [];

          // fields to remove
          for (const sf of storedField) {
            for (const f of this.fields) {
              if ((storedObjFieldArg === 'columnsOrder' && f.name === sf.name)
                || (storedObjFieldArg === 'columnsWidth' && f.title === sf.title)
                || (storedObjFieldArg === 'columnsDisplay' && f.title === sf.title)){
                verify = true;
              }
            }
            if (!verify){
              fieldsToRemove.push(sf);
            }
            verify = false;
          }

          // fields to add
          for (const f of this.fields) {
            for (const sf of storedField) {
              if ((storedObjFieldArg === 'columnsOrder' && f.name === sf.name)
                || (storedObjFieldArg === 'columnsWidth' && f.title === sf.title)
                || (storedObjFieldArg === 'columnsDisplay' && f.title === sf.title)){
                verify = true;
              }
            }
            if (!verify){
              fieldsToAdd.push(f);
            }
            verify = false;
          }

          if (fieldsToAdd.length !== 0 || fieldsToRemove.length !== 0) {
            for (const f of fieldsToAdd) {
              storedField.push(f);
            }
            for (const f of fieldsToRemove) {
              storedField.pop(f);
            }
            this[storedObjFieldArg] = storedField.filter((el: any) => {
              return el != null;
            });
          }
          else {
            this[storedObjFieldArg] = storedField;
          }

          // we need to turn off reorderEvent, because when we update it we don't want it to react
          // we want it to react only when the user drag and drop columns
          if (storedObjFieldArg === 'columnsOrder'){
            this.stopReorderEvent = true;
          }

          // update features
          for (const [i, field] of this[storedObjFieldArg].entries()) {
            this.grid?.columns.forEach((c, n, a) => {
              // not sure if it's the best methode to identify the column
              // but I can't get c.field so...
              if (c.title === field.title){
                // +1 because getFields() doesn't return the first column (checkbox column)
                // btw he doesn't take the last two column too
                if (storedObjFieldArg === 'columnsOrder'){
                  this.grid?.reorderColumn(c, i + 1);
                }
                else if (storedObjFieldArg === 'columnsWidth'){
                  c.width = field.width;
                }
                else if (storedObjFieldArg === 'columnsDisplay'){
                  c.hidden = field.display;
                }
              }
            });
          }
          if (storedObjFieldArg === 'columnsOrder'){
            this.stopReorderEvent = false;
          }
        }
        // if no localstorage
        else {
          this.noLocalStorage(storedObjFieldArg);
        }
      }
      // if no localstorage
      else {
        this.noLocalStorage(storedObjFieldArg);
      }
      if (storedObjFieldArg === 'columnsOrder'){
        this.checkFieldsUpdated = true;
      }
    }
  }

  /**
   * Methode to call if there is no localstorage
   * @param storedObjFieldArg the local storage field
   */
  noLocalStorage(storedObjFieldArg: string): void {
    if (storedObjFieldArg === 'columnsOrder'){
      this.columnsOrder = this.fields;
    }
    else if (storedObjFieldArg === 'columnsWidth'){
      this.fillColumnWidth();
    }
    else if (storedObjFieldArg === 'columnsDisplay'){
      this.fillColumnDisplay();
    }
  }

  /**
   * Order columns event
   * @param e event parameter (oldIndex, newIndex)
   */
  columnReorder(e: any): void {
    this.isAdmin = this.safeAuthService.userIsAdmin;
    if (!this.stopReorderEvent){
      const tempFields: any[] = [];
      let j = 0;
      // shift by 1 because the old and new index take in account the first checkbox column
      const oldIndex = e.oldIndex - 1;
      const newIndex = e.newIndex - 1;

      for (let i = 0; i < this.columnsOrder.length; i++) {
        if (i === newIndex){
          if (oldIndex < newIndex) {
            tempFields[j] = this.columnsOrder[i];
            j++;
            tempFields[j] = this.columnsOrder[oldIndex];
          }
          if (oldIndex > newIndex){
            tempFields[j] = this.columnsOrder[oldIndex];
            j++;
            tempFields[j] = this.columnsOrder[i];
          }

          j++;
        }
        else if (i !== oldIndex){
          tempFields[j] = this.columnsOrder[i];
          j++;
        }
      }

      this.columnsOrder = tempFields;
      this.storedObj.columnsOrder = this.columnsOrder;
      localStorage.setItem(this.id, JSON.stringify(this.storedObj));
    }
  }

  /**
   * Resize columns width event
   * @param e event parameter (oldWidth, newWidth)
   */
  columnResize(e: Array<ColumnResizeArgs>): void {
    this.isAdmin = this.safeAuthService.userIsAdmin;
    this.columnsWidth.forEach((c, i, a) => {
      if (c.title === e[0].column.title){
        c.width = e[0].newWidth;
      }
    });
    this.storedObj.columnsWidth = this.columnsWidth;
    localStorage.setItem(this.id, JSON.stringify(this.storedObj));
  }

  /**
   * Display columns event
   * @param e event parameter
   */
  columnVisibilityChange(e: ColumnVisibilityChangeEvent): void {
    this.isAdmin = this.safeAuthService.userIsAdmin;
    this.columnsDisplay.forEach((c, i, a) => {
      if (c.title === e.columns[0].title){
        c.display = e.columns[0].hidden;
      }
    });
    this.storedObj.columnsDisplay = this.columnsDisplay;
    localStorage.setItem(this.id, JSON.stringify(this.storedObj));
  }

  /**
   * Fill columnsWidth variable with grid columns base properties (used when there is no localStorage)
   */
  fillColumnWidth(): void {
    this.grid?.columns.forEach((c, i, a) => {
      if (c.title !== undefined){
        this.columnsWidth.push({title: c.title, width: c.width});
      }
    });
  }

  /**
   * Fill columnsDisplay variable with grid columns base properties (used when there is no localStorage)
   */
  fillColumnDisplay(): void {
    this.grid?.columns.forEach((c, i, a) => {
      if (c.title !== undefined){
        if (c.hidden === undefined){
          this.columnsDisplay.push({title: c.title, display: false});
        }
        else {
          this.columnsDisplay.push({title: c.title, display: c.hidden});
        }
      }
    });
  }

  saveGridStatus(e: any): void {
    console.log('Save status');
    console.log(e);
  }
}
