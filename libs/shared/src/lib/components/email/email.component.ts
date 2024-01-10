import { Component } from '@angular/core';
import { EmailService } from './email.service';
import { ApplicationService } from '../../services/application/application.service';
import { UnsubscribeComponent } from '../utils/unsubscribe/unsubscribe.component';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

/** Default number of items per request for pagination */
const DEFAULT_PAGE_SIZE = 5;
/**
 * Email Notification setup component.
 */
@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
})
export class EmailComponent extends UnsubscribeComponent {
  filterTemplateData: any = [];
  templateActualData: any = [];
  public loading = true;
  public distributionLists: any[] = [];
  public emailNotifications = [];
  public pageInfo = {
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    length: 0,
    endCursor: '',
  };
  // === DISPLAYED COLUMNS ===
  public displayedColumns = ['name', 'alerttype', 'createdby', 'actions'];

  /**
   *
   * @param emailService
   * @param router
   * @param applicationService
   * @param formBuilder
   */
  constructor(
    public emailService: EmailService,
    public applicationService: ApplicationService,
    public formBuilder: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this.getExistingTemplate();
  }

  /**
   *
   */
  toggle() {
    this.emailService.isExisting = !this.emailService.isExisting;
  }

  /**
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getExistingTemplate() {
    this.emailService.getEmailNotifications().subscribe((res: any) => {
      res?.data?.emailNotifications?.edges?.forEach((ele: any) => {
        this.templateActualData.push(ele.node);
        this.loading = false;
        ele.node.recipients.distributionListName !== null &&
        ele.node.recipients.distributionListName !== ''
          ? this.distributionLists.push(ele.node.recipients)
          : '';
      });
      this.filterTemplateData = this.templateActualData;
      // this.emailNotifications = this.filterTemplateData.slice(
      //   this.pageInfo.pageSize * this.pageInfo.pageIndex,
      //   this.pageInfo.pageSize * (this.pageInfo.pageIndex + 1)
      // );
      // this.pageInfo.length = res?.data?.emailNotifications?.edges.length;
      // // this.pageInfo.endCursor =
      // //   res.data.application.customNotifications.pageInfo.endCursor;
    });
  }

  /**
   *
   * @param searchText
   * @param event
   */
  searchTemplate(event: any) {
    const searchText = event.target.value?.trim()?.toLowerCase();
    this.filterTemplateData = this.templateActualData.filter((x: any) =>
      x.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  /**
   *
   * @param id
   */
  getEmailNotificationById(id: string) {
    this.loading = true;
    this.emailService.getEmailNotification(id).subscribe((res) => {
      this.loading = false;
      const emailData = res.data.editAndGetEmailNotification;
      const dataArray: FormArray | any = new FormArray([]);
      for (let index = 0; index < emailData.dataSets.length; index++) {
        //Adding Tabs detail
        dataArray.push(this.createNewDataSetGroup(emailData.dataSets[index]));
        if (index === 0) {
          this.emailService.tabs[0].title = emailData.dataSets[index].name;
          this.emailService.tabs[0].content = emailData.dataSets[index].name;
        } else {
          this.emailService.tabs.push({
            title: emailData.dataSets[index].name,
            content: emailData.dataSets[index].name,
            active: false,
            index: index,
          });
        }
      }
      this.emailService.tabs.forEach((ele: any) => {
        ele.active = false;
      });
      this.emailService.tabs[this.emailService.tabs.length - 1].active = true;

      //Creating DatasetForm
      this.emailService.datasetsForm = this.formBuilder.group({
        name: emailData.name,
        notificationType: emailData.notificationType,
        dataSets: dataArray,
        recipients: {
          distributionListName: emailData.recipients.distributionListName,
          To: emailData.recipients.To,
          Cc: emailData.recipients.Cc,
          Bcc: emailData.recipients.Bcc,
        },
        emailLayout: emailData.emailLayout,
        schedule: emailData.schedule,
      });

      //Setting up edit screen
      this.emailService.isExisting = !this.emailService.isExisting;

      //Setting up Recipients data
      this.emailService.recipients =
        this.emailService.datasetsForm.controls['recipients'].value;
    });
  }

  /**
   *
   * @param ele
   */
  createNewDataSetGroup(ele: any): FormGroup {
    const tempData = this.formBuilder.group({
      resource: ele.resource,
      name: ele.name,
      pageSize: ele.pageSize,
      filter: this.getFilterGroup(ele.filter),
      fields: ele.fields,
      cacheData: {},
    });
    tempData.controls.fields.setValue(ele.fields);
    return tempData;
  }

  /**
   *
   * @param filterData
   */
  getFilterGroup(filterData: any) {
    const filterArray: FormArray | any = new FormArray([]);
    filterData?.filters?.forEach((ele: any) => {
      filterArray.push(this.getNewFilterFields(ele));
    });
    return this.formBuilder.group({
      logic: filterData.logic,
      filters: filterArray,
    });
  }

  /**
   *
   * @param filter
   */
  getNewFilterFields(filter: any): FormGroup {
    return this.formBuilder.group({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
      hideEditor: filter.hideEditor,
    });
  }

  /**
   *
   * @param data
   */
  public editEmailNotification(data: any) {
    this.getEmailNotificationById(data.id);
  }

  // eslint-disable-next-line jsdoc/require-description
  /**
   *
   * @param data
   */
  public deleteEmailNotification(data: any) {
    console.log(data);
  }
}
