import {Apollo} from 'apollo-angular';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { Dashboard, SafeSnackBarService, SafeApplicationService, SafeWorkflowService, NOTIFICATIONS, SafeDashboardService } from '@safe/builder';
import { ShareUrlComponent } from './components/share-url/share-url.component';
import {
  EditDashboardMutationResponse, EDIT_DASHBOARD,
  EditPageMutationResponse, EDIT_PAGE,
  EditStepMutationResponse, EDIT_STEP } from '../../../graphql/mutations';
import { GetDashboardByIdQueryResponse, GET_DASHBOARD_BY_ID } from '../../../graphql/queries';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // === DATA ===
  public id = '';
  public applicationId?: string;
  public loading = true;
  public tiles: any[] = [];
  public dashboard?: Dashboard;

  // === GRID ===
  private generatedTiles = 0;

  // === DASHBOARD NAME EDITION ===
  public formActive = false;
  public dashboardNameForm: FormGroup = new FormGroup({});

  // === ROUTE ===
  private routeSubscription?: Subscription;

  // === STEP CHANGE FOR WORKFLOW ===
  @Output() goToNextStep: EventEmitter<any> = new EventEmitter();

  constructor(
    private applicationService: SafeApplicationService,
    private workflowService: SafeWorkflowService,
    private apollo: Apollo,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: SafeSnackBarService,
    private dashboardService: SafeDashboardService
  ) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.formActive = false;
      this.loading = true;
      this.id = params.id;
      this.apollo.query<GetDashboardByIdQueryResponse>({
        query: GET_DASHBOARD_BY_ID,
        variables: {
          id: this.id
        }
      }).subscribe((res) => {
        console.log('FFF: res');
        console.log(res);
        if (res.data.dashboard) {
          this.dashboard = res.data.dashboard;
          this.dashboardService.openDashboard(this.dashboard);
          this.dashboardNameForm = new FormGroup({
            dashboardName: new FormControl(this.dashboard.name, Validators.required)
          });
          this.tiles = res.data.dashboard.structure ? res.data.dashboard.structure : [];
          this.generatedTiles = this.tiles.length === 0 ? 0 : Math.max(...this.tiles.map(x => x.id)) + 1;
          this.applicationId = this.dashboard.page ? this.dashboard.page.application?.id : this.dashboard.step ?
            this.dashboard.step.workflow?.page?.application?.id : '';
          this.loading = res.loading;
        } else {
          this.snackBar.openSnackBar(NOTIFICATIONS.accessNotProvided('dashboard'), { error: true });
          this.router.navigate(['/applications']);
        }
        console.log('===> this.tiles');
        console.log(this.tiles);
        },
        (err) => {
          this.snackBar.openSnackBar(err.message, { error: true });
          this.router.navigate(['/applications']);
        }
      );
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    this.dashboardService.closeDashboard();
  }

  /*  Add a new widget to the dashboard.
  */
  onAdd(e: any): void {
    const tile = JSON.parse(JSON.stringify(e));
    tile.id = this.generatedTiles;
    this.generatedTiles += 1;
    this.tiles = [...this.tiles, tile];
    this.autoSaveChanges();
  }

  /*  Edit the settings or display of a widget.
  */
  onEditTile(e: any): void {
    console.log('e');
    console.log(e);
    // je pense que je devrait changer tiles ici
    console.log('this.tiles');
    console.log(this.tiles);
    // const options = e.options;
    console.log('this.tiles[e.id].settings.layout');
    console.log(e.id);
    const oId = this.tiles.findIndex((v: any) => v.id === e.id);
    console.log(this.tiles[oId]?.settings?.defaultLayout);
    const options = this.tiles[oId]?.settings?.defaultLayout ?
      {...e.options, defaultLayout: this.tiles[oId].settings.defaultLayout} : e.options;
    // const options = e.options;
    console.log('options');
    console.log(options);
    console.log('e.options');
    console.log(e.options);
    // const options = {...e.options, defaultLayout: this.tiles[e.id].settings.defaultLayout};
    if (options) {
      switch (e.type) {
        case 'display': {
          console.log('display');
          this.tiles = this.tiles.map(x => {
            if (x.id === e.id) {
              x = { ...x, defaultCols: options.cols, defaultRows: options.rows };
            }
            return x;
          });
          this.autoSaveChanges();
          break;
        }
        case 'data': {
          console.log('data');
          console.log(options);
          this.tiles = this.tiles.map(x => {
            if (x.id === e.id) {
              x = { ...x, settings: options };
            }
            return x;
          });
          this.autoSaveChanges();
          break;
        }
        default: {
          break;
        }
      }
    }
    console.log('MODIFIED: this.tiles');
    console.log(this.tiles);
  }

  /*  Remove a widget from the dashboard.
  */
  onDeleteTile(e: any): void {
    this.tiles = this.tiles.filter(x => x.id !== e.id);
    this.autoSaveChanges();
  }

  /*  Drag and drop a widget to move it.
  */
  onMove(): void {
    this.autoSaveChanges();
  }

  /*  Save the dashboard changes in the database.
  */
  private autoSaveChanges(): void {
    this.loading = true;
    this.apollo.mutate<EditDashboardMutationResponse>({
      mutation: EDIT_DASHBOARD,
      variables: {
        id: this.id,
        structure: this.tiles
      }
    }).subscribe(res => {
      console.log('autoSaveChanges');
      this.tiles = res.data?.editDashboard.structure;
      console.log('this.tiles');
      console.log(this.tiles);
      this.dashboardService.openDashboard({ ...this.dashboard, structure: this.tiles });
      this.loading = false;
    }, error => this.loading = false);
  }

  /*  Edit the permissions layer.
  */
  saveAccess(e: any): void {
    if (this.router.url.includes('/workflow/')) {
      this.apollo.mutate<EditStepMutationResponse>({
        mutation: EDIT_STEP,
        variables: {
          id: this.dashboard?.step?.id,
          permissions: e
        }
      }).subscribe(res => {
        this.dashboard = { ...this.dashboard, permissions: res.data?.editStep.permissions };
      });
    } else {
      this.apollo.mutate<EditPageMutationResponse>({
        mutation: EDIT_PAGE,
        variables: {
          id: this.dashboard?.page?.id,
          permissions: e
        }
      }).subscribe(res => {
        this.dashboard = { ...this.dashboard, permissions: res.data?.editPage.permissions };
      });
    }
  }

  toggleFormActive(): void {
    if (this.dashboard?.page ? this.dashboard.page.canUpdate : this.dashboard?.step?.canUpdate) { this.formActive = !this.formActive; }
  }

  /*  Update the name of the dashboard and the step or page linked to it.
  */
  saveName(): void {
    const { dashboardName } = this.dashboardNameForm.value;
    this.toggleFormActive();
    if (this.router.url.includes('/workflow/')) {
      this.apollo.mutate<EditStepMutationResponse>({
        mutation: EDIT_STEP,
        variables: {
          id: this.dashboard?.step?.id,
          name: dashboardName
        }
      }).subscribe(res => {
        if (res.data?.editStep) {
          this.dashboard = { ...this.dashboard, name: res.data?.editStep.name };
          this.workflowService.updateStepName(res.data.editStep);
        } else {
          this.snackBar.openSnackBar(NOTIFICATIONS.objectNotUpdated('step', res.errors ? res.errors[0].message : ''));
        }
      });
    } else {
      this.apollo.mutate<EditPageMutationResponse>({
        mutation: EDIT_PAGE,
        variables: {
          id: this.dashboard?.page?.id,
          name: dashboardName
        }
      }).subscribe(res => {
        this.dashboard = { ...this.dashboard, name: res.data?.editPage.name };
        if (res.data?.editPage) {
          this.applicationService.updatePageName(res.data.editPage);
        }
      });
    }
  }

  /*  Display the ShareUrl modal with the route to access the dashboard.
  */
  public onShare(): void {
    const dialogRef = this.dialog.open(ShareUrlComponent, {
      data: {
        url: window.location
      }
    });
    dialogRef.afterClosed().subscribe();
  }

  // onDefaultLayoutChanged(defaultLayout: any): void {
  //   this.apollo.query<GetDashboardByIdQueryResponse>({
  //     query: GET_DASHBOARD_BY_ID,
  //     variables: {
  //       id: this.id
  //     }
  //   }).subscribe((res) => {
  //     console.log('$$$ res');
  //     console.log(res);
  //   });
  //   // console.log('111: this.tiles');
  //   // console.log(this.tiles);
  //   // console.log('X: defaultLayout');
  //   // console.log(defaultLayout);
  //   this.defaultLayout = defaultLayout.defaultLayout;
  //   const i = this.tiles.findIndex(v => v.id === defaultLayout.id);
  //   // console.log('this.tiles[i]');
  //   // console.log(this.tiles[i]);
  //   const newTileSettings = {defaultLayout: defaultLayout.layout, ...this.tiles[i].settings };
  //   const newTile = { ...this.tiles[i], settings: newTileSettings };
  //   // console.log('newTile');
  //   // console.log(newTile);
  //   const newTiles = [...this.tiles];
  //   newTiles[i] = newTile;
  //   // this.tiles[i].settings.defaultLayout = defaultLayout.defaultLayout;
  //   // this.tiles[i].settings = newTileSettings;
  //   // this.tiles[i] = newTile;
  //   this.tiles = newTiles;
  //   // console.log('222: this.tiles');
  //   // console.log(this.tiles);
  // }
}
