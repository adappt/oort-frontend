import { Apollo, QueryRef } from 'apollo-angular';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  Application,
  SafeAuthService,
  SafeConfirmService,
  SafeSnackBarService,
  SafeUnsubscribeComponent,
} from '@safe/builder';
import {
  GetApplicationsQueryResponse,
  GET_APPLICATIONS,
} from './graphql/queries';
import {
  DeleteApplicationMutationResponse,
  DELETE_APPLICATION,
  AddApplicationMutationResponse,
  ADD_APPLICATION,
  EditApplicationMutationResponse,
  EDIT_APPLICATION,
} from './graphql/mutations';
import { ChoseRoleComponent } from './components/chose-role/chose-role.component';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PreviewService } from '../../../services/preview.service';
import { DuplicateApplicationModalComponent } from '../../../components/duplicate-application-modal/duplicate-application-modal.component';
import { MatEndDate, MatStartDate } from '@angular/material/datepicker';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';

/** Default number of items per request for pagination */
const DEFAULT_PAGE_SIZE = 10;

/** Applications page component. */
@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
})
export class ApplicationsComponent
  extends SafeUnsubscribeComponent
  implements OnInit
{
  // === DATA ===
  public loading = true;
  public updating = false;
  private applicationsQuery!: QueryRef<GetApplicationsQueryResponse>;
  private newApplicationsQuery!: QueryRef<GetApplicationsQueryResponse>;
  public applications = new MatTableDataSource<Application>([]);
  public cachedApplications: Application[] = [];
  public displayedColumns = [
    'name',
    'createdAt',
    'status',
    'usersCount',
    'actions',
  ];
  public newApplications: Application[] = [];
  public filter: any;
  private sort: Sort = { active: '', direction: '' };

  public pageInfo = {
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    length: 0,
    endCursor: '',
  };

  @ViewChild('startDate', { read: MatStartDate })
  startDate!: MatStartDate<string>;
  @ViewChild('endDate', { read: MatEndDate }) endDate!: MatEndDate<string>;

  /**
   * Applications page component
   *
   * @param apollo Apollo service
   * @param dialog Material dialog service
   * @param router Angular router
   * @param snackBar Shared snackbar service
   * @param authService Shared authentication service
   * @param previewService Shared preview service
   * @param confirmService Share confirm service
   * @param translate Angular translate service
   */
  constructor(
    private apollo: Apollo,
    public dialog: MatDialog,
    private router: Router,
    private snackBar: SafeSnackBarService,
    private authService: SafeAuthService,
    private previewService: PreviewService,
    private confirmService: SafeConfirmService,
    private translate: TranslateService
  ) {
    super();
  }

  /**
   * Creates the application query and subscribes to the query changes.
   */
  ngOnInit(): void {
    this.applicationsQuery =
      this.apollo.watchQuery<GetApplicationsQueryResponse>({
        query: GET_APPLICATIONS,
        variables: {
          first: DEFAULT_PAGE_SIZE,
        },
      });
    // new query for card

    this.newApplicationsQuery =
      this.apollo.watchQuery<GetApplicationsQueryResponse>({
        query: GET_APPLICATIONS,
        variables: {
          first: DEFAULT_PAGE_SIZE,
          sortField: 'modifiedAt',
          sortOrder: 'desc',
        },
      });
    this.applicationsQuery.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ data, loading }) => {
        this.cachedApplications = data.applications.edges.map((x) => x.node);
        this.applications.data = this.cachedApplications.slice(
          this.pageInfo.pageSize * this.pageInfo.pageIndex,
          this.pageInfo.pageSize * (this.pageInfo.pageIndex + 1)
        );
        this.pageInfo.length = data.applications.totalCount;
        this.pageInfo.endCursor = data.applications.pageInfo.endCursor;
        this.loading = loading;
        this.updating = false;
      });
    this.newApplicationsQuery.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ data }) => {
        this.newApplications = data.applications.edges
          .map((x) => x.node)
          .slice(0, 5);
      });
  }

  /**
   * Handles page event.
   *
   * @param e page event.
   */
  onPage(e: any): void {
    this.pageInfo.pageIndex = e.pageIndex;
    // Checks if with new page/size more data needs to be fetched
    if (
      (e.pageIndex > e.previousPageIndex ||
        e.pageSize > this.pageInfo.pageSize) &&
      e.length > this.cachedApplications.length
    ) {
      // Sets the new fetch quantity of data needed as the page size
      // If the fetch is for a new page the page size is used
      let first = e.pageSize;
      // If the fetch is for a new page size, the old page size is substracted from the new one
      if (e.pageSize > this.pageInfo.pageSize) {
        first -= this.pageInfo.pageSize;
      }
      this.pageInfo.pageSize = first;
      this.fetchApplications();
    } else {
      this.applications.data = this.cachedApplications.slice(
        e.pageSize * this.pageInfo.pageIndex,
        e.pageSize * (this.pageInfo.pageIndex + 1)
      );
    }
    this.pageInfo.pageSize = e.pageSize;
  }

  /**
   * Filters applications and updates table.
   *
   * @param filter filter event.
   */
  onFilter(filter: any): void {
    this.filter = filter;
    this.fetchApplications(true);
  }

  /**
   * Handle sort change.
   *
   * @param event sort event
   */
  onSort(event: Sort): void {
    this.sort = event;
    this.fetchApplications(true);
  }

  /**
   * Update applications query.
   *
   * @param refetch erase previous query results
   */
  private fetchApplications(refetch?: boolean): void {
    this.updating = true;
    if (refetch) {
      this.cachedApplications = [];
      this.pageInfo.pageIndex = 0;
      this.applicationsQuery
        .refetch({
          first: this.pageInfo.pageSize,
          afterCursor: null,
          filter: this.filter,
          sortField: this.sort?.direction && this.sort.active,
          sortOrder: this.sort?.direction,
        })
        .then(() => {
          this.loading = false;
          this.updating = false;
        });
    } else {
      this.applicationsQuery.fetchMore({
        variables: {
          first: this.pageInfo.pageSize,
          afterCursor: this.pageInfo.endCursor,
          filter: this.filter,
          sortField: this.sort?.direction && this.sort.active,
          sortOrder: this.sort?.direction,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return prev;
          }
          return Object.assign({}, prev, {
            applications: {
              edges: [
                ...prev.applications.edges,
                ...fetchMoreResult.applications.edges,
              ],
              pageInfo: fetchMoreResult.applications.pageInfo,
              totalCount: fetchMoreResult.applications.totalCount,
            },
          });
        },
      });
    }
  }

  /**
   * Deletes an application if authorized.
   *
   * @param element application.
   * @param e click event.
   */
  onDelete(element: any, e?: any): void {
    if (e) {
      e.stopPropagation();
    }
    const dialogRef = this.confirmService.openConfirmModal({
      title: this.translate.instant('common.deleteObject', {
        name: this.translate.instant('common.application.one'),
      }),
      content: this.translate.instant(
        'components.application.delete.confirmationMessage',
        { name: element.name }
      ),
      confirmText: this.translate.instant('components.confirmModal.delete'),
      confirmColor: 'warn',
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        const id = element.id;
        this.apollo
          .mutate<DeleteApplicationMutationResponse>({
            mutation: DELETE_APPLICATION,
            variables: {
              id,
            },
          })
          .subscribe(({ data }) => {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectDeleted', {
                value: this.translate.instant('common.application.one'),
              })
            );
            this.applications.data = this.applications.data.filter(
              (x) => x.id !== data?.deleteApplication.id
            );
            this.newApplications = this.newApplications.filter(
              (x) => x.id !== data?.deleteApplication.id
            );
          });
      }
    });
  }

  /**
   * Displays the AddApplication component.
   * Adds a new application once closed, if result exists.
   */
  onAdd(): void {
    this.apollo
      .mutate<AddApplicationMutationResponse>({
        mutation: ADD_APPLICATION,
      })
      .subscribe(({ errors, data }) => {
        if (errors?.length) {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectNotCreated', {
              type: this.translate
                .instant('common.application.one')
                .toLowerCase(),
              error: errors[0].message,
            }),
            { error: true }
          );
        } else {
          if (data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectCreated', {
                type: this.translate
                  .instant('common.application.one')
                  .toLowerCase(),
                value: data.addApplication.name,
              })
            );
            const id = data.addApplication.id;
            this.router.navigate(['/applications', id]);
          }
        }
      });
  }

  /**
   * Edits the permissions layer.
   *
   * @param e permissions.
   * @param element application.
   */
  saveAccess(e: any, element: Application): void {
    this.apollo
      .mutate<EditApplicationMutationResponse>({
        mutation: EDIT_APPLICATION,
        variables: {
          id: element.id,
          permissions: e,
        },
      })
      .subscribe(({ data }) => {
        if (data) {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectUpdated', {
              type: this.translate.instant('common.access').toLowerCase(),
              value: element.name,
            })
          );
          const index = this.applications.data.findIndex(
            (x) => x.id === element.id
          );
          this.applications.data[index] = data.editApplication;
          this.applications.data = this.applications.data;
        }
      });
  }

  /**
   * Opens a dialog to choose roles to fit in the preview.
   *
   * @param element application to preview.
   */
  onPreview(element: Application): void {
    const dialogRef = this.dialog.open(ChoseRoleComponent, {
      data: {
        application: element.id,
      },
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.previewService.setRole(value.role);
        this.router.navigate(['./app-preview', element.id]);
      }
    });
  }

  /**
   * Opens a dialog to give a name for the duplicated application.
   *
   * @param application application to duplicate.
   */
  onClone(application: Application): void {
    const dialogRef = this.dialog.open(DuplicateApplicationModalComponent, {
      data: {
        id: application.id,
        name: application.name,
      },
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.applications.data.push(value);
        this.applications.data = this.applications.data;
      }
    });
  }

  /**
   * Navigates to application.
   *
   * @param id application id.
   */
  onOpenApplication(id: string): void {
    this.router.navigate(['/applications', id]);
  }
}
