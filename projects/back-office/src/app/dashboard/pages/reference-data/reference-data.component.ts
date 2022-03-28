import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Apollo, QueryRef } from 'apollo-angular';
import {
  PermissionsManagement,
  PermissionType,
  ReferenceData,
  SafeAuthService,
  SafeConfirmModalComponent,
  SafeSnackBarService,
} from '@safe/builder';
import { Subscription } from 'rxjs';
import {
  GetReferenceDatasQueryResponse,
  GET_REFERENCE_DATAS,
} from '../../../graphql/queries';
import { 
  AddReferenceDataMutationResponse,
  ADD_REFERENCE_DATA,
  DeleteReferenceDataMutationResponse,
  DELETE_REFERENCE_DATA
} from '../../../graphql/mutations';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

const ITEMS_PER_PAGE = 10;

@Component({
  selector: 'app-reference-data',
  templateUrl: './reference-data.component.html',
  styleUrls: ['./reference-data.component.scss'],
})
export class ReferenceDataComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  // === DATA ===
  public loading = true;
  private referenceDatasQuery!: QueryRef<GetReferenceDatasQueryResponse>;
  displayedColumns = ['name', 'apiConfiguration', 'actions'];
  dataSource = new MatTableDataSource<ReferenceData>([]);
  public cachedReferenceDatas: ReferenceData[] = [];

  // === PERMISSIONS ===
  canAdd = false;
  private authSubscription?: Subscription;

  // === SORTING ===
  @ViewChild(MatSort) sort?: MatSort;

  // === FILTERS ===
  public searchText = '';

  public pageInfo = {
    pageIndex: 0,
    pageSize: ITEMS_PER_PAGE,
    length: 0,
    endCursor: '',
  };

  constructor(
    private apollo: Apollo,
    public dialog: MatDialog,
    private snackBar: SafeSnackBarService,
    private authService: SafeAuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  /**
   * Creates the Reference data query, and subscribes to the query changes.
   */
  ngOnInit(): void {
    this.referenceDatasQuery =
      this.apollo.watchQuery<GetReferenceDatasQueryResponse>({
        query: GET_REFERENCE_DATAS,
        variables: {
          first: ITEMS_PER_PAGE,
        },
      });

    this.referenceDatasQuery.valueChanges.subscribe((res) => {
      this.cachedReferenceDatas = res.data.referenceDatas.edges.map(
        (x) => x.node
      );
      this.dataSource.data = this.cachedReferenceDatas.slice(
        this.pageInfo.pageSize * this.pageInfo.pageIndex,
        this.pageInfo.pageSize * (this.pageInfo.pageIndex + 1)
      );
      this.pageInfo.length = res.data.referenceDatas.totalCount;
      this.pageInfo.endCursor = res.data.referenceDatas.pageInfo.endCursor;
      this.loading = res.loading;
      this.filterPredicate();
    });

    this.authSubscription = this.authService.user$.subscribe(() => {
      this.canAdd = this.authService.userHasClaim(
        PermissionsManagement.getRightFromPath(
          this.router.url,
          PermissionType.create
        )
      );
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
      e.length > this.cachedReferenceDatas.length
    ) {
      // Sets the new fetch quantity of data needed as the page size
      // If the fetch is for a new page the page size is used
      let neededSize = e.pageSize;
      // If the fetch is for a new page size, the old page size is substracted from the new one
      if (e.pageSize > this.pageInfo.pageSize) {
        neededSize -= this.pageInfo.pageSize;
      }
      this.loading = true;
      this.referenceDatasQuery.fetchMore({
        variables: {
          first: neededSize,
          afterCursor: this.pageInfo.endCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return prev;
          }
          return Object.assign({}, prev, {
            apiConfigurations: {
              edges: [
                ...prev.referenceDatas.edges,
                ...fetchMoreResult.referenceDatas.edges,
              ],
              pageInfo: fetchMoreResult.referenceDatas.pageInfo,
              totalCount: fetchMoreResult.referenceDatas.totalCount,
            },
          });
        },
      });
    } else {
      this.dataSource.data = this.cachedReferenceDatas.slice(
        e.pageSize * this.pageInfo.pageIndex,
        e.pageSize * (this.pageInfo.pageIndex + 1)
      );
    }
    this.pageInfo.pageSize = e.pageSize;
  }

  /**
   * Frontend filtering.
   */
  private filterPredicate(): void {
    this.dataSource.filterPredicate = (data: any) =>
      this.searchText.trim().length === 0 ||
      (this.searchText.trim().length > 0 &&
        data.name.toLowerCase().includes(this.searchText.trim()));
  }

  /**
   * Applies the filter to the data source.
   *
   * @param column Column to filter on.
   * @param event Value of the filter.
   */
  applyFilter(column: string, event: any): void {
    this.searchText = !!event
      ? event.target.value.trim().toLowerCase()
      : this.searchText;
    this.dataSource.filter = '##';
  }

  /**
   * Removes all the filters.
   */
  clearAllFilters(): void {
    this.searchText = '';
    this.applyFilter('', null);
  }

  /**
   * Displays the AddReferenceData modal.
   * Creates a new reference data on closed if result.
   */
   onAdd(): void {
    // TODO: Uncomment after the creation of the AddReferenceDataComponent (or whatever name)
    // const dialogRef = this.dialog.open(AddReferenceDataComponent);
    // dialogRef.afterClosed().subscribe((value) => {
    //   if (value) {
    //     this.apollo
    //       .mutate<AddReferenceDataMutationResponse>({
    //         mutation: ADD_REFERENCE_DATA,
    //         variables: {
    //           name: value.name,
    //         },
    //       })
    //       .subscribe(
    //         (res) => {
    //           if (res.errors) {
    //             this.snackBar.openSnackBar(
    //               this.translate.instant('notification.objectNotCreated', {
    //                 type: this.translate.instant('referenceData.apiConfiguration'),
    //                 error: res.errors[0].message,
    //               }),
    //               { error: true }
    //             );
    //           } else {
    //             if (res.data) {
    //               this.router.navigate([
    //                 '/referencedata',
    //                 res.data.addReferenceData.id,
    //               ]);
    //             }
    //           }
    //         },
    //         (err) => {
    //           this.snackBar.openSnackBar(err.message, { error: true });
    //         }
    //       );
    //   }
    // });
  }

  /**
   * Removes a reference data if authorized.
   *
   * @param element Reference data to delete.
   * @param e click event.
   */
   onDelete(element: any, e: any): void {
    e.stopPropagation();
    const dialogRef = this.dialog.open(SafeConfirmModalComponent, {
      data: {
        title: this.translate.instant('APIConf.delete'),
        content: this.translate.instant('APIConf.deleteDesc', {
          name: element.name,
        }),
        confirmText: this.translate.instant('action.delete'),
        cancelText: this.translate.instant('action.cancel'),
        confirmColor: 'warn',
      },
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.apollo
          .mutate<DeleteReferenceDataMutationResponse>({
            mutation: DELETE_REFERENCE_DATA,
            variables: {
              id: element.id,
            },
          })
          .subscribe((res) => {
            if (res && !res.errors) {
              this.snackBar.openSnackBar(
                this.translate.instant('notification.objectDeleted', {
                  value: this.translate.instant('table.referenceData'),
                })
              );
              this.dataSource.data = this.dataSource.data.filter(
                (x) => x.id !== element.id
              );
            }
          });
      }
    });
  }

  /**
   * Sets the sort in the view.
   */
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort || null;
  }

  /**
   * Removes all subscriptions.
   */
  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
