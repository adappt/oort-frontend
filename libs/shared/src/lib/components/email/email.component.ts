import { Component } from '@angular/core';
import { EmailService } from './email.service';
import { ApplicationService } from '../../services/application/application.service';
import { UnsubscribeComponent } from '../utils/unsubscribe/unsubscribe.component';
import { takeUntil } from 'rxjs';
import { DistributionList } from '../../models/distribution-list.model';

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
  public distributionLists: DistributionList[] = [];

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
    this.getDistribuionList();
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
      });
    });
    this.filterTemplateData = this.templateActualData;
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

  getDistribuionList() {
    this.applicationService.application$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.distributionLists = value?.distributionLists || [];
      });
  }
}
