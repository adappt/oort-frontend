import { Component } from '@angular/core';
import { EmailService } from './email.service';
import { ApplicationService } from '../../services/application/application.service';
import { UnsubscribeComponent } from '../utils/unsubscribe/unsubscribe.component';
import { takeUntil } from 'rxjs';

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
   */
  constructor(
    public emailService: EmailService,
    public applicationService: ApplicationService
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
        this.distributionLists.push(ele.node.recipients);
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
   */
  getDistribuionList() {
    this.applicationService.application$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.distributionLists = value?.distributionLists || [];
      });
  }
}
