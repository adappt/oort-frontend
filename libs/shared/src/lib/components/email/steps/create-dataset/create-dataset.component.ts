import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { QueryRef } from 'apollo-angular';
import { Observable } from 'rxjs';
import {
  Resource,
  ResourcesQueryResponse,
} from '../../../../models/resource.model';
import { EmailService } from '../../email.service';

/**
 * create-dataset page component.
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
  public notificationTypes: string[] = this.emailService.notificationTypes;
  public dataSetFormGroup: FormGroup | any = this.emailService.datasetsForm;
  public dataSetGroup: FormGroup | any =
    this.emailService.createNewDataSetGroup();
  public tabs: {
    title: string;
    content: string;
    active: boolean;
    index: number;
  }[] = this.emailService.tabs;
  public searchQuery = '';
  public searchSelectedField = '';
  public filteredFields: any[] = [];
  public activeTab: any =
    this.emailService.tabs[this.emailService.tabs.length - 1];
  public dataList!: { [key: string]: string }[];
  public selectedFields!: { name: string; type: string }[];
  public previewData: any = {};
  public showPreview = false;
  public replaceUnderscores: any = this.emailService.replaceUnderscores;
  @ViewChild('kendoStrip') kendoStrip: any;

  /**
   * Composite filter group.
   *
   * @param fb Angular form builder
   * @param emailService helper functions
   */
  constructor(private fb: FormBuilder, public emailService: EmailService) {}

  ngOnInit(): void {
    this.filteredFields = this.resource?.fields;
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
   * To change the tab
   *
   * @param $event params
   * @param tabIndex
   */
  changeTab($event: any) {
    const selectedIndex = $event?.index;

    if (selectedIndex !== undefined) {
      this.activeTab = this.emailService.tabs[selectedIndex];
      this.activeTab.active = true;

      this.emailService.tabs.forEach((tab, index) => {
        tab.active = index === selectedIndex; // Set active to true for the selected index, false otherwise
      });
    }
  }

  /**
   * To get datasetsFormArray
   *
   * @returns FormArray
   */
  get datasetsFormArray() {
    return this.dataSetFormGroup.get('dataSets') as FormArray;
  }

  /**
   * Filters the available fields based on the search query.
   *
   * @param searchQuery search Query string
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
    const existFields = this.dataSetFormGroup.get('query').value.fields || [];
    if (!JSON.stringify(existFields).includes(fieldName)) {
      existFields.push({ name: fieldName, type: typeof fieldName });
      this.dataSetFormGroup.controls.query.controls.fields.setValue(
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
      this.dataSetFormGroup.controls.query.controls.fields.value || [];
    const index = existFields.findIndex(
      (field: { name: string }) => field.name === fieldName
    );
    if (index !== -1) {
      existFields.splice(index, 1);
      this.dataSetFormGroup.controls.query.controls.fields.setValue(
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
    return this.dataSetFormGroup.controls;
  }

  /**
   * Dynamic Form Submission
   */
  onSubmit(): void {
    const finalResponse = this.dataSetFormGroup.value;
    console.log('Final Response', finalResponse);
  }

  /**
   * Adds a tab
   */
  public addTab() {
    this.datasetsFormArray.push(this.emailService.createNewDataSetGroup());
    this.tabs.forEach((tab) => (tab.active = false));
    this.tabs.push({
      title: `Tab ${this.tabs.length + 1}`,
      content: `Tab ${this.tabs.length + 1} Content`,
      active: true,
      index: this.tabs.length,
    });
    this.activeTab =
      this.tabs.filter((tab: any) => tab.active == true).length > 0
        ? this.tabs.filter((tab: any) => tab.active == true)[0]
        : '';
    this.dataSetGroup.value.name = this.activeTab.title;
    this.datasetsFormArray.push(this.dataSetGroup);
  }

  /**
   * Deletes a block tab at the specified index.
   *
   * @param index The index of the tab to delete.
   * @param event The event that triggered the deletion.
   */
  public deleteTab(index: number, event: Event) {
    event.stopPropagation();
    this.datasetsFormArray.removeAt(index); // Remove the associated form group from datasetsFormArray
    this.tabs.splice(index, 1);
    this.activeTab =
      this.activeTab.active == true && this.tabs.length > 0
        ? this.tabs[this.tabs.length - 1]
        : this.activeTab;
    this.activeTab.active = true;
  }

  /**
   *
   * @param previewData
   */
  public bindPreviewTbl(previewData: any) {
    this.previewData = previewData;
    this.showPreview = true;
  }
}
