import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Apollo } from 'apollo-angular';
import {
  Dashboard,
  DashboardQueryResponse,
  UnsubscribeComponent,
} from '@oort-front/shared';
import { GET_SHARE_DASHBOARD_BY_ID } from './graphql/queries';
import { takeUntil } from 'rxjs/operators';
import { SnackbarService } from '@oort-front/ui';

/**
 * Share URL access component.
 */
@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss'],
})
export class ShareComponent extends UnsubscribeComponent implements OnInit {
  /**
   * Share URL access component.
   *
   * @param router Angular router service
   * @param route Angular shared route service
   * @param apollo Apollo client service
   * @param snackBar Shared snackbar service
   * @param translateService Angular Translate service
   */
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apollo: Apollo,
    private snackBar: SnackbarService,
    private translateService: TranslateService
  ) {
    super();
  }

  /**
   * Query dashboard information from share url and redirect to dashboard page.
   */
  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: any) => {
        this.apollo
          .query<DashboardQueryResponse>({
            query: GET_SHARE_DASHBOARD_BY_ID,
            variables: {
              id: params.id,
            },
          })
          .subscribe({
            next: ({ data }) => {
              let url = '';
              const dashboard: Dashboard = data.dashboard;
              if (dashboard) {
                if (dashboard.step) {
                  url +=
                    '/' + data.dashboard.step?.workflow?.page?.application?.id;
                  url += '/workflow/' + data.dashboard.step?.workflow?.id;
                  url += '/dashboard/' + data.dashboard.id;
                } else {
                  url += '/' + data.dashboard.page?.application?.id;
                  url += '/dashboard/' + data.dashboard.id;
                }
              }
              this.router.navigate([url]);
            },
            error: () => {
              // Error handling
              this.snackBar.openSnackBar(
                this.translateService.instant(
                  'common.notifications.accessNotProvided',
                  {
                    type: this.translateService
                      .instant('common.dashboard.one')
                      .toLowerCase(),
                    error: '',
                  }
                ),
                { error: true }
              );
            },
          });
      });
  }
}
