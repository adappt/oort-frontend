import { Component } from '@angular/core';
import { EmailService } from './email.service';
import { ApplicationService } from '../../services/application/application.service';
import { UnsubscribeComponent } from '../utils/unsubscribe/unsubscribe.component';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmService } from '../../services/confirm/confirm.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { UIPageChangeEvent, handleTablePageEvent } from '@oort-front/ui';
import { ApiConfiguration } from '../../models/api-configuration.model';

/** Default number of items per request for pagination */
const DEFAULT_PAGE_SIZE = 5;
/**
 *
 */
const DISTRIBUTION_PAGE_SIZE = 5;
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
  public applicationId = '';
  public distributionLists: any = [];
  public emailNotifications: any = [];
  public pageInfo = {
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    length: 0,
    endCursor: '',
  };
  // === DISPLAYED COLUMNS ===
  public displayedColumns = ['name', 'alerttype', 'createdby', 'actions'];
  public distributionColumn = ['name'];
  public cachedApiConfigurations: ApiConfiguration[] = [];
  public distributionPageInfo = {
    pageIndex: 0,
    pageSize: DISTRIBUTION_PAGE_SIZE,
    length: 0,
    endCursor: '',
  };
  cacheDistributionList: any = [];

  /**
   *
   * @param emailService
   * @param router
   * @param applicationService
   * @param formBuilder
   * @param confirmService
   * @param translate
   * @param authService
   */
  constructor(
    public emailService: EmailService,
    public applicationService: ApplicationService,
    public formBuilder: FormBuilder,
    private confirmService: ConfirmService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.applicationService.application$.subscribe((res: any) => {
      this.emailService.datasetsForm.get('applicationId')?.setValue(res?.id);
      this.applicationId = res?.id;
    });
    this.getExistingTemplate();
    console.log(this.emailService.datasetsForm);
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
    this.loading = true;
    this.emailService.isExisting = true;
    this.applicationService.application$.subscribe((res: any) => {
      this.emailService.datasetsForm.get('applicationId')?.setValue(res?.id);
      this.applicationId = res?.id;
    });
    this.emailService
      .getEmailNotifications(this.applicationId)
      .subscribe((res: any) => {
        res?.data?.emailNotifications?.edges?.forEach((ele: any) => {
          this.templateActualData.push(ele.node);
          this.loading = false;
          ele.node.recipients.distributionListName !== null &&
          ele.node.recipients.distributionListName !== ''
            ? this.distributionLists.push(ele.node.recipients)
            : '';
        });
        this.filterTemplateData = this.templateActualData;
        this.emailNotifications = this.filterTemplateData.slice(
          this.pageInfo.pageSize * this.pageInfo.pageIndex,
          this.pageInfo.pageSize * (this.pageInfo.pageIndex + 1)
        );
        this.pageInfo.length = res?.data?.emailNotifications?.edges.length;

        this.cacheDistributionList = this.distributionLists;
        this.distributionLists = this.cacheDistributionList.slice(
          this.distributionPageInfo.pageSize *
            this.distributionPageInfo.pageIndex,
          this.distributionPageInfo.pageSize *
            (this.distributionPageInfo.pageIndex + 1)
        );
        this.distributionPageInfo.length = this.cacheDistributionList.length;
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
    this.emailNotifications = this.filterTemplateData.slice(
      this.pageInfo.pageSize * this.pageInfo.pageIndex,
      this.pageInfo.pageSize * (this.pageInfo.pageIndex + 1)
    );
    this.pageInfo.length = this.filterTemplateData.length;
  }

  /**
   *
   * @param id
   * @param isClone
   * @param isSendEmail
   */
  getEmailNotificationById(
    id: string,
    isClone?: boolean,
    isSendEmail?: boolean
  ) {
    this.loading = true;
    this.emailService
      .getEmailNotification(id, this.applicationId)
      .subscribe((res) => {
        const emailData = res.data.editAndGetEmailNotification;

        if (isClone) {
          delete emailData.createdAt;
          delete emailData.id;
          delete emailData.createdBy;
          delete emailData.modifiedAt;
          emailData.name = emailData.name + '_Clone';
          emailData.applicationId = this.applicationId;
          emailData?.dataSets?.forEach((element: any) => {
            delete element.__typename;
            delete element.resource.__typename;
            element?.fields.forEach((ele: any) => {
              delete ele.__typename;
            });
          });
          delete emailData?.emailLayout?.__typename;
          delete emailData.__typename;
          delete emailData?.recipients?.__typename;
          delete emailData.isDeleted;
          delete emailData.lastExecution;
          delete emailData.status;
          this.emailService
            .addEmailNotification(emailData)
            .subscribe((res: any) => {
              this.loading = false;
              this.emailService.configId = res.data.addEmailNotification.id;
              this.getEmailNotificationById(
                res.data.addEmailNotification.id,
                false
              );
            });
        } else {
          this.prepareEditData(emailData, isSendEmail);
        }
      });
  }

  /**
   *
   * @param emailData
   * @param isSendEmail
   */
  prepareEditData(emailData: any, isSendEmail?: boolean) {
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

    //Setting up Layout Data
    this.emailService.emailLayout = {
      subject: emailData.emailLayout.subject,
      header: emailData.emailLayout.header,
      body: emailData.emailLayout.body,
      banner: emailData.emailLayout.banner,
      footer: emailData.emailLayout.footer,
    };

    this.emailService.allLayoutdata = {
      /** IMAGES AND STYLES */
      bannerImage: emailData.emailLayout.banner.bannerImage,
      bannerImageStyle: emailData.emailLayout.banner.bannerImageStyle,
      /** CONTAINER STYLE */
      containerStyle: emailData.emailLayout.banner.containerStyle,
      /** FOOTER COPYRIGHT STYLE */
      copyrightStyle: emailData.emailLayout.banner.copyrightStyle,
      /** EMAIL SUBJECT */
      txtSubject: emailData.emailLayout.subject,
      /** EMAIL HEADER */
      headerHtml: emailData.emailLayout.header.headerHtml,
      headerLogo: emailData.emailLayout.header.headerLogo,
      headerLogoStyle: emailData.emailLayout.header.headerStyle,
      headerBackgroundColor: emailData.emailLayout.header.headerBackgroundColor,
      headerTextColor: emailData.emailLayout.header.headerTextColor,
      headerStyle: '',
      /** EMAIL BODY */
      bodyHtml: emailData.emailLayout.body.bodyHtml,
      bodyBackgroundColor: emailData.emailLayout.body.bodyBackgroundColor,
      bodyTextColor: emailData.emailLayout.body.bodyTextColor,
      bodyStyle: emailData.emailLayout.body.bodyStyle,
      /** EMAIL FOOTER */
      footerHtml: emailData.emailLayout.footer.footerHtml,
      footerLogo: emailData.emailLayout.footer.footerLogo,
      footerBackgroundColor: emailData.emailLayout.footer.footerBackgroundColor,
      footerTextColor: emailData.emailLayout.footer.footerTextColor,
      footerStyle: emailData.emailLayout.footer.footerStyle,
      footerImgStyle: emailData.emailLayout.footer.footerImgStyle,
      footerHtmlStyle: emailData.emailLayout.footer.footerHtmlStyle,
    };

    this.emailService.datasetsForm
      .get('applicationId')
      ?.setValue(this.applicationId);

    // this.emailService.datasetSave.emit(true);
    if (isSendEmail) {
      this.emailService.stepperStep = -1;
      this.emailService.getDataSet(emailData);
      setTimeout(() => {
        this.loading = false;
      }, 1500);
    } else {
      this.emailService.stepperStep = 0;
      this.loading = false;
    }
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

  // eslint-disable-next-line jsdoc/require-description
  /**
   *
   * @param data
   */
  public deleteEmailNotification(data: any) {
    const dialogRef = this.confirmService.openConfirmModal({
      title: this.translate.instant('common.deleteObject', {
        name: this.translate.instant('common.page.one'),
      }),
      content: 'Do you confirm the deletion of ' + data.name,
      // this.translate.instant(
      //   'components.application.pages.delete.confirmationMessage',
      //   { name: data.name }
      // ),
      confirmText: this.translate.instant('components.confirmModal.delete'),
      confirmVariant: 'danger',
    });
    dialogRef.closed.pipe(takeUntil(this.destroy$)).subscribe((value: any) => {
      if (value) {
        this.loading = true;
        this.emailService
          .deleteEmailNotification(data.id, this.applicationId)
          .subscribe(() => {
            this.distributionLists = [];
            this.emailNotifications = [];
            this.templateActualData = [];
            this.filterTemplateData = [];
            this.getExistingTemplate();
          });
      }
    });
  }

  /**
   *
   * @param data
   */
  public cloneEmailNotification(data: any) {
    this.getEmailNotificationById(data.id, true);
  }

  /**
   *
   * @param data
   */
  public sendEmailList(data: any) {
    this.getEmailNotificationById(data.id, false, true);
  }

  /**
   *
   * @param e
   */
  onPage(e: UIPageChangeEvent): void {
    const cachedData = handleTablePageEvent(
      e,
      this.pageInfo,
      this.filterTemplateData
    );
    // if (cachedData && cachedData.length === this.pageInfo.pageSize) {
    this.emailNotifications = cachedData;
    // this.filterTemplateData = this.emailNotifications;
    // }
  }

  /**
   *
   * @param e
   */
  onDistributionPage(e: UIPageChangeEvent): void {
    const cachedData = handleTablePageEvent(
      e,
      this.pageInfo,
      this.cacheDistributionList
    );
    // if (
    //   cachedData &&
    //   cachedData.length === this.distributionPageInfo.pageSize
    // ) {
    this.distributionLists = cachedData;
    // this.filterTemplateData = this.emailNotifications;
    // }
  }
}
