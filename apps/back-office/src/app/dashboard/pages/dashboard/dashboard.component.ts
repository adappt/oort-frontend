import { Apollo, QueryRef } from 'apollo-angular';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  Dashboard,
  ApplicationService,
  WorkflowService,
  DashboardService,
  Application,
  UnsubscribeComponent,
  WidgetGridComponent,
  ConfirmService,
  ReferenceDataService,
  Record,
  ButtonActionT,
  ResourceRecordsNodesQueryResponse,
  DashboardQueryResponse,
  EditDashboardMutationResponse,
  RecordQueryResponse,
  PageGeographicContextType,
} from '@oort-front/shared';
import { EDIT_DASHBOARD } from './graphql/mutations';
import {
  GET_DASHBOARD_BY_ID,
  GET_RECORD_BY_ID,
  GET_RESOURCE_RECORDS,
} from './graphql/queries';
import { TranslateService } from '@ngx-translate/core';
import {
  map,
  takeUntil,
  filter,
  startWith,
  debounceTime,
} from 'rxjs/operators';
import { Observable, firstValueFrom } from 'rxjs';
import { FormControl } from '@angular/forms';
import { cloneDeep, isEqual } from 'lodash';
import { Dialog } from '@angular/cdk/dialog';
import { SnackbarService, UILayoutService } from '@oort-front/ui';
import localForage from 'localforage';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ContextService, CustomWidgetStyleComponent } from '@oort-front/shared';
import { DOCUMENT } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { GridsterConfig } from 'angular-gridster2';
import countries from 'assets/countries.json';

/** Default number of records fetched per page */
const ITEMS_PER_PAGE = 10;

/**
 * Back-office Dashboard page.
 * Edition of the dashboard ( if user has permission ).
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent
  extends UnsubscribeComponent
  implements OnInit, OnDestroy
{
  /** Change step event ( in workflow ) */
  @Output() changeStep: EventEmitter<number> = new EventEmitter();
  /** Widget grid reference */
  @ViewChild(WidgetGridComponent)
  widgetGridComponent!: WidgetGridComponent;
  /** Is dashboard in fullscreen mode */
  public isFullScreen = false;
  /** Dashboard id */
  public id = '';
  /** Application id */
  public applicationId?: string;
  /** Is dashboard loading */
  public loading = true;
  /** List of widgets */
  public widgets: any[] = [];
  /** Current dashboard */
  public dashboard?: Dashboard;
  /** Show dashboard filter */
  public showFilter!: boolean;
  /** User can update dashboard */
  public canUpdate = false;
  /** Dashboard name edition is active */
  public formActive = false;
  /** Show application menu */
  public showAppMenu = false;
  /** List of available applications */
  public applications: Application[] = [];
  /** Contextual reference data elements  */
  public refDataElements: any[] = [];
  /** Contextual records query */
  public recordsQuery!: QueryRef<ResourceRecordsNodesQueryResponse>;
  /** Contextual template id */
  public contextId = new FormControl<string | number | null>(null);
  /** Field of contextual reference data */
  public refDataValueField = '';
  /** Contextual record */
  public contextRecord: Record | null = null;
  /** Configured dashboard quick actions */
  public buttonActions: ButtonActionT[] = [];
  /** Timeout to scroll to newly added widget */
  private timeoutListener!: NodeJS.Timeout;
  /** Is edition active */
  @HostBinding('class.edit-mode-dashboard')
  public editionActive = true;
  /** Additional grid configuration */
  public gridOptions: GridsterConfig = {};
  /** Regions static list for geographic context */
  public geographicContextRegions = [
    {
      code: 'AF',
      name: 'AFRO',
    },
    {
      code: 'AM',
      name: 'AMRO',
    },
    {
      code: 'EM',
      name: 'EMRO',
    },
    {
      code: 'EU',
      name: 'EURO',
    },
    {
      code: 'SE',
      name: 'SEARO',
    },
    {
      code: 'WP',
      name: 'WPRO',
    },
    {
      code: 'HQ',
      name: 'HQ',
    },
  ];
  /** Countries for geographic context */
  public geographicContextCountries = countries;
  /** Geographic context country form control */
  public countryCode = new FormControl<string | undefined>('');
  /** Geographic context region form control */
  public regionCode = new FormControl<string | undefined>('');

  /** @returns type of context element */
  get contextType() {
    if (this.dashboard?.page?.context) {
      return 'resource' in this.dashboard.page.context ? 'record' : 'element';
    } else {
      return;
    }
  }

  /** @returns is dashboard a step or a page */
  get isStep(): boolean {
    return this.router.url.includes('/workflow/');
  }

  /**
   * Back-office Dashboard page.
   * Edition of the dashboard ( if user has permission ).
   *
   * @param applicationService Shared application service
   * @param workflowService Shared workflow service
   * @param apollo Apollo service
   * @param route Angular activated route
   * @param router Angular router
   * @param dialog Dialog service
   * @param snackBar Shared snackbar service
   * @param dashboardService Shared dashboard service
   * @param translate Angular translate service
   * @param confirmService Shared confirm service
   * @param contextService Dashboard context service
   * @param refDataService Shared reference data service
   * @param renderer Angular renderer
   * @param elementRef Angular element ref
   * @param layoutService Shared layout service
   * @param document Document
   * @param clipboard Angular clipboard service
   */
  constructor(
    private applicationService: ApplicationService,
    private workflowService: WorkflowService,
    private apollo: Apollo,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: Dialog,
    private snackBar: SnackbarService,
    private dashboardService: DashboardService,
    private translate: TranslateService,
    private confirmService: ConfirmService,
    private contextService: ContextService,
    private refDataService: ReferenceDataService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private layoutService: UILayoutService,
    @Inject(DOCUMENT) private document: Document,
    private clipboard: Clipboard
  ) {
    super();
  }

  ngOnInit(): void {
    this.contextId.valueChanges
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe((value) => {
        // Load template, or go back to default one
        this.onContextChange(value);
      });
    /** Listen to router events navigation end, to get last version of params & queryParams. */
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(this.router), // initialize
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loading = true;
        // Reset context
        this.contextRecord = null;
        this.contextId.setValue(null, {
          emitEvent: false,
          emitModelToViewChange: false,
          emitViewToModelChange: false,
        });
        this.contextId.markAsPristine();
        this.contextId.markAsUntouched();
        // Reset scroll when changing page
        const pageContainer = this.document.getElementById('appPageContainer');
        if (pageContainer) {
          pageContainer.scrollTop = 0;
        }

        /** Extract main dashboard id */
        const id = this.route.snapshot.paramMap.get('id');
        /** Extract query id to load template */
        const queryId = this.route.snapshot.queryParamMap.get('id');
        const queryGeographic =
          this.route.snapshot.queryParamMap.get('geographic');
        const context: any = {};

        if (id) {
          if (queryId || queryGeographic) {
            this.loadDashboard(id).then(() => {
              const templates = this.dashboard?.page?.contentWithContext;
              const type = this.contextType;
              let template: any;
              if (queryGeographic) {
                // geographic and queryId
                if (queryId) {
                  if (type) {
                    template = templates?.find((d) => {
                      // If templates use reference data
                      if (type === 'element')
                        return (
                          'element' in d &&
                          d.element.toString().trim() === queryId.trim() &&
                          'geographic' in d &&
                          d.geographic &&
                          d.geographic.toString().trim() ===
                            queryGeographic.trim()
                        );
                      // If templates use resource
                      else if (type === 'record')
                        return (
                          'record' in d &&
                          d.record.toString().trim() === queryId.trim() &&
                          'geographic' in d &&
                          d.geographic &&
                          d.geographic.toString().trim() ===
                            queryGeographic.trim()
                        );
                      return false;
                    });
                  }
                  // geographic
                } else {
                  template = templates?.find((d) => {
                    // If templates use reference data
                    return (
                      'geographic' in d &&
                      d.geographic &&
                      d.geographic.toString().trim() === queryGeographic.trim()
                    );
                  });
                }
                // queryId
              } else if (queryId) {
                template = templates?.find((d) => {
                  // If templates use reference data
                  if (type === 'element')
                    return (
                      'element' in d &&
                      d.element.toString().trim() === queryId.trim()
                    );
                  // If templates use resource
                  else if (type === 'record')
                    return (
                      'record' in d &&
                      d.record.toString().trim() === queryId.trim()
                    );
                  return false;
                });
              }
              if (template) {
                // if we found the contextual dashboard, load it
                this.loadDashboard(template.content).then(
                  () => (this.loading = false)
                );
              } else {
                if (this.dashboard?.page && this.canUpdate) {
                  this.snackBar.openSnackBar(
                    this.translate.instant(
                      'models.dashboard.context.notifications.creatingTemplate'
                    )
                  );
                  if (queryGeographic && queryId && type) {
                    context[type] = queryId;
                    context['geographic'] = queryGeographic;
                  } else if (queryId && type) {
                    context[type] = queryId;
                  } else if (queryGeographic) {
                    context['geographic'] = queryGeographic;
                  }
                  this.dashboardService
                    .createDashboardWithContext(
                      this.dashboard?.page?.id as string,
                      context
                    )
                    .then(({ data }) => {
                      if (!data?.addDashboardWithContext?.id) return;
                      this.snackBar.openSnackBar(
                        this.translate.instant(
                          'models.dashboard.context.notifications.templateCreated'
                        )
                      );
                      // load the contextual dashboard
                      this.loadDashboard(data.addDashboardWithContext.id).then(
                        () => (this.loading = false)
                      );
                    });
                }
              }
            });
          } else {
            // if there is no id, we are not on a contextual dashboard, we simply load the dashboard
            this.loadDashboard(id).then(() => (this.loading = false));
          }
        }
        // }
      });
    this.regionCode.valueChanges
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe((value) => {
        // reset country code as it's not possible to have country and region selected
        this.countryCode.setValue(value, { emitEvent: false });
        this.onGeographicContextChange(value);
      });
    this.countryCode.valueChanges
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe((value) => {
        // reset region code as it's not possible to have country and region selected
        this.regionCode.setValue(value, { emitEvent: false });
        this.onGeographicContextChange(value);
      });
  }

  /**
   * Init the dashboard
   *
   * @param id Dashboard id
   * @returns Promise
   */
  private async loadDashboard(id: string) {
    // don't init the dashboard if the id is the same
    if (this.dashboard?.id === id) {
      return;
    }

    const rootElement = this.elementRef.nativeElement;
    this.renderer.setAttribute(rootElement, 'data-dashboard-id', id);
    this.formActive = false;
    this.loading = true;
    this.id = id;
    return firstValueFrom(
      this.apollo.query<DashboardQueryResponse>({
        query: GET_DASHBOARD_BY_ID,
        variables: {
          id: this.id,
        },
      })
    )
      .then(({ data }) => {
        if (data.dashboard) {
          this.dashboard = data.dashboard;
          this.gridOptions = {
            ...this.gridOptions,
            ...this.dashboard?.gridOptions,
            scrollToNewItems: false,
          };
          if (this.dashboard.page?.geographicContext?.enabled) {
            if (this.dashboard.page.geographicContext.country) {
              this.countryCode.setValue(
                this.dashboard.page?.geographicContext?.country
              );
            } else {
              this.regionCode.setValue(
                this.dashboard.page?.geographicContext?.region
              );
            }
          }
          this.initContext();
          this.updateContextOptions();
          this.canUpdate =
            (this.dashboard?.page
              ? this.dashboard?.page?.canUpdate
              : this.dashboard?.step?.canUpdate) || false;
          this.editionActive = this.canUpdate;

          this.dashboardService.openDashboard(this.dashboard);
          this.widgets = cloneDeep(
            this.dashboard.structure
              ? [...this.dashboard.structure.filter((x: any) => x !== null)]
              : []
          );
          this.applicationId = this.dashboard.page
            ? this.dashboard.page.application?.id
            : this.dashboard.step
            ? this.dashboard.step.workflow?.page?.application?.id
            : '';
          this.buttonActions = this.dashboard.buttons || [];
          this.showFilter = this.dashboard.filter?.show ?? false;
          this.contextService.isFilterEnabled.next(this.showFilter);
          setTimeout(() => {
            this.gridOptions = {
              ...this.gridOptions,
              scrollToNewItems: true,
            };
          }, 1000);
        } else {
          this.contextService.isFilterEnabled.next(false);
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.accessNotProvided', {
              type: this.translate
                .instant('common.dashboard.one')
                .toLowerCase(),
              error: '',
            }),
            { error: true }
          );
          this.router.navigate(['/applications']);
        }
      })
      .catch((err) => {
        this.snackBar.openSnackBar(err.message, { error: true });
        this.router.navigate(['/applications']);
      });
  }

  /**
   * Leave dashboard
   */
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.timeoutListener) {
      clearTimeout(this.timeoutListener);
    }
    localForage.removeItem(this.applicationId + 'position'); //remove temporary contextual filter data
    localForage.removeItem(this.applicationId + 'filterStructure');
    this.dashboardService.closeDashboard();
  }

  /**
   * Show modal confirmation before leave the page if has changes on form
   *
   * @returns boolean of observable of boolean
   */
  canDeactivate(): Observable<boolean> | boolean {
    if (this.widgetGridComponent && !this.widgetGridComponent?.canDeactivate) {
      const dialogRef = this.confirmService.openConfirmModal({
        title: this.translate.instant('pages.dashboard.update.exit'),
        content: this.translate.instant('pages.dashboard.update.exitMessage'),
        confirmText: this.translate.instant('components.confirmModal.confirm'),
        confirmVariant: 'primary',
      });
      return dialogRef.closed.pipe(takeUntil(this.destroy$)).pipe(
        map((confirm) => {
          if (confirm) {
            return true;
          }
          return false;
        })
      );
    }
    return true;
  }

  /**
   * Add a new widget to the dashboard.
   *
   * @param e add event
   */
  onAdd(e: any): void {
    const widget = cloneDeep(e);
    this.widgets.push(widget);
    if (this.timeoutListener) {
      clearTimeout(this.timeoutListener);
    }
    // scroll to the element once it is created
    this.timeoutListener = setTimeout(() => {
      const widgetComponents =
        this.widgetGridComponent.widgetComponents.toArray();
      const target = widgetComponents[widgetComponents.length - 1];
      const el = this.document.getElementById(target.id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
  }

  /**
   * Edits the settings or display of a widget.
   *
   * @param e widget to save.
   */
  onEditTile(e: any): void {
    switch (e.type) {
      case 'display': {
        this.autoSaveChanges();
        break;
      }
      case 'data': {
        // Find the widget to be edited
        const widgetComponents =
          this.widgetGridComponent.widgetComponents.toArray();
        const targetIndex = widgetComponents.findIndex(
          (v: any) => v.id === e.id
        );
        if (targetIndex > -1) {
          // Update the configuration
          const options = this.widgets[targetIndex]?.settings?.defaultLayout
            ? {
                ...e.options,
                defaultLayout: this.widgets[targetIndex].settings.defaultLayout,
              }
            : e.options;
          if (options) {
            // Save configuration
            this.widgets[targetIndex] = {
              ...this.widgets[targetIndex],
              settings: options,
            };
            this.autoSaveChanges();
          }
        }

        break;
      }
      default: {
        break;
      }
    }
  }

  /**
   * Remove a widget from the dashboard.
   *
   * @param e delete event
   */
  onDeleteTile(e: any): void {
    const widgetComponents =
      this.widgetGridComponent.widgetComponents.toArray();
    const targetIndex = widgetComponents.findIndex((x) => x.id === e.id);
    if (targetIndex > -1) {
      this.widgets.splice(targetIndex, 1);
      this.autoSaveChanges();
    }
  }

  /**
   * Style a widget from the dashboard.
   *
   * @param e style event
   */
  onStyleTile(e: any): void {
    this.layoutService.setRightSidenav({
      component: CustomWidgetStyleComponent,
      inputs: {
        widgetComp: e,
        save: (tile: any) => this.onEditTile(tile),
      },
    });
    this.layoutService.closeRightSidenav = true;
  }

  /** Save the dashboard changes in the database. */
  private autoSaveChanges(): void {
    this.apollo
      .mutate<EditDashboardMutationResponse>({
        mutation: EDIT_DASHBOARD,
        variables: {
          id: this.id,
          structure: this.widgets,
        },
      })
      .subscribe({
        next: ({ errors }) => {
          this.applicationService.handleEditionMutationResponse(
            errors,
            this.translate.instant('common.dashboard.one')
          );
          if (!errors) {
            this.dashboardService.openDashboard({
              ...this.dashboard,
              structure: this.widgets,
            });
          }
        },
        complete: () => (this.loading = false),
      });
  }

  /**
   * Toggle visibility of form.
   */
  toggleFormActive(): void {
    if (
      this.dashboard?.page
        ? this.dashboard.page.canUpdate
        : this.dashboard?.step?.canUpdate
    ) {
      this.formActive = !this.formActive;
    }
  }

  /**
   * Update the name of the dashboard and the step or page linked to it.
   *
   * @param {string} dashboardName new dashboard name
   */
  saveName(dashboardName: string): void {
    if (dashboardName && dashboardName !== this.dashboard?.name) {
      const callback = () => {
        this.dashboard = { ...this.dashboard, name: dashboardName };
      };
      if (this.contextId.value) {
        // Seeing a template
        this.dashboardService.editName(dashboardName, callback);
      } else {
        // Not part of contextual page
        if (this.isStep) {
          this.workflowService.updateStepName(
            {
              id: this.dashboard?.step?.id,
              name: dashboardName,
            },
            callback
          );
        } else {
          this.applicationService.updatePageName(
            {
              id: this.dashboard?.page?.id,
              name: dashboardName,
            },
            callback
          );
        }
      }
    }
  }

  /** Display the ShareUrl modal with the route to access the dashboard. */
  public async onShare(): Promise<void> {
    const url = `${window.origin}/share/${this.dashboard?.id}`;
    this.clipboard.copy(url);
    this.snackBar.openSnackBar(
      this.translate.instant('common.notifications.copiedToClipboard')
    );
  }

  /** Open modal to add new button action */
  public async onAddButtonAction() {
    const { EditButtonActionComponent } = await import(
      './components/edit-button-action/edit-button-action.component'
    );
    const dialogRef = this.dialog.open<ButtonActionT | undefined>(
      EditButtonActionComponent
    );

    dialogRef.closed
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (button) => {
        if (!button) return;
        const currButtons =
          (await firstValueFrom(this.dashboardService.dashboard$))?.buttons ||
          [];

        this.dashboardService.saveDashboardButtons([...currButtons, button]);
        this.buttonActions.push(button);
      });
  }

  /** Opens modal for context dataset selection */
  public async selectContextDatasource() {
    const currContext =
      (await firstValueFrom(this.dashboardService.dashboard$))?.page?.context ??
      null;

    const { ContextDatasourceComponent } = await import(
      './components/context-datasource/context-datasource.component'
    );
    const dialogRef = this.dialog.open(ContextDatasourceComponent, {
      data: currContext,
    });

    const parentDashboardId = this.route.snapshot.paramMap.get('id');

    dialogRef.closed
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (context: any) => {
        if (context) {
          if (isEqual(context, currContext)) return;

          await this.dashboardService.updateContext(context);
          this.dashboard =
            (await firstValueFrom(this.dashboardService.dashboard$)) ||
            undefined;

          const urlArr = this.router.url.split('/');

          // load the linked data
          this.updateContextOptions();
          // go the the parent dashboard
          urlArr[urlArr.length - 1] = `${parentDashboardId}`;
          this.router.navigateByUrl(urlArr.join('/'));
        }
      });
  }

  /**
   * Update the context options.
   * Loads elements from reference data or records from resource.
   */
  private updateContextOptions() {
    const context = this.dashboard?.page?.context;
    if (!context) return;

    if ('resource' in context) {
      this.recordsQuery =
        this.apollo.watchQuery<ResourceRecordsNodesQueryResponse>({
          query: GET_RESOURCE_RECORDS,
          variables: {
            first: ITEMS_PER_PAGE,
            id: context.resource,
          },
        });
    }

    if ('refData' in context) {
      this.refDataService.loadReferenceData(context.refData).then((refData) => {
        this.refDataValueField = refData.valueField || '';
        this.refDataService.fetchItems(refData).then((items) => {
          this.refDataElements = items;
        });
      });
    }
  }

  /**
   * Handle dashboard geographic context change by simply updating the url.
   *
   * @param value value of the geographic field
   */
  private async onGeographicContextChange(value: string | null | undefined) {
    const queryParams = { ...this.route.snapshot.queryParams };
    if (
      !this.dashboard?.id ||
      !this.dashboard?.page?.id ||
      !this.dashboard.page.geographicContext?.enabled
    )
      return;
    if (value) {
      // Update the 'geographic' parameter if it exists, or set it if it's undefined
      if ('geographic' in queryParams) {
        queryParams.geographic = value;
      } else {
        queryParams['geographic'] = value;
      }
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams,
      });
    } else {
      // remove geographic from query params
      delete queryParams['geographic'];
      this.snackBar.openSnackBar(
        this.translate.instant(
          'models.dashboard.context.notifications.loadDefault'
        )
      );
      this.router.navigate(['.'], { relativeTo: this.route, queryParams });
    }
  }

  /**
   * Handle dashboard context change by simply updating the url.
   *
   * @param value id of the element or record
   */
  private async onContextChange(value: string | number | undefined | null) {
    const queryParams = { ...this.route.snapshot.queryParams };
    if (
      !this.dashboard?.id ||
      !this.dashboard?.page?.id ||
      !this.dashboard.page.context ||
      !this.contextType
    )
      return;
    if (value) {
      // Update the 'id' parameter if it exists, or set it if it's undefined
      if ('id' in queryParams) {
        queryParams.id = value;
      } else {
        queryParams['id'] = value;
      }
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams,
      });
      // const urlArr = this.router.url.split('/');
      // urlArr[urlArr.length - 1] = `${parentDashboardId}?id=${value}`;
      // this.router.navigateByUrl(urlArr.join('/'));
    } else {
      // remove id from query params
      delete queryParams['id'];
      this.snackBar.openSnackBar(
        this.translate.instant(
          'models.dashboard.context.notifications.loadDefault'
        )
      );
      this.router.navigate(['.'], { relativeTo: this.route, queryParams });
      // const urlArr = this.router.url.split('/');
      // urlArr[urlArr.length - 1] = parentDashboardId;
      // this.router.navigateByUrl(urlArr.join('/'));
    }
  }

  /** Initializes the dashboard context */
  private initContext() {
    if (!this.dashboard?.page?.context || !this.dashboard?.id) return;
    // Checks if the dashboard has context attached to it
    const contentWithContext = this.dashboard?.page?.contentWithContext || [];
    const id = this.dashboard.id;
    const dContext = contentWithContext.find((c) => c.content === id);

    if (!dContext) return;

    // If it has updated the form
    if ('element' in dContext) {
      this.contextId.setValue(dContext.element, { emitEvent: false });
    } else if ('record' in dContext) {
      // Get record by id
      this.apollo
        .query<RecordQueryResponse>({
          query: GET_RECORD_BY_ID,
          variables: {
            id: dContext.record,
          },
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res?.data) {
            this.contextRecord = res.data.record;
            this.contextId.setValue(dContext.record, { emitEvent: false });
          }
        });
    }
  }

  /**
   * Reorders button actions.
   *
   * @param event Drop event
   */
  public onButtonActionDrop(event: CdkDragDrop<typeof this.buttonActions>) {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(
      this.buttonActions,
      event.previousIndex,
      event.currentIndex
    );

    this.dashboardService.saveDashboardButtons(this.buttonActions);
  }

  /**
   * Open settings modal.
   */
  public async onOpenSettings(): Promise<void> {
    const { ViewSettingsModalComponent } = await import(
      '../../../components/view-settings-modal/view-settings-modal.component'
    );
    const dialogRef = this.dialog.open(ViewSettingsModalComponent, {
      data: {
        type: this.isStep ? 'step' : 'page',
        applicationId: this.applicationId,
        page: this.isStep ? undefined : this.dashboard?.page,
        step: this.isStep ? this.dashboard?.step : undefined,
        visible: this.dashboard?.page?.visible,
        icon: this.isStep
          ? this.dashboard?.step?.icon
          : this.dashboard?.page?.icon,
        accessData: {
          access: this.dashboard?.permissions,
          application: this.applicationId,
          objectTypeName: this.translate.instant(
            'common.' + this.isStep ? 'step' : 'page' + '.one'
          ),
        },
        canUpdate: this.dashboard?.page
          ? this.dashboard?.page.canUpdate
          : this.dashboard?.step
          ? this.dashboard?.step.canUpdate
          : false,
        dashboard: this.dashboard,
      },
    });
    // Subscribes to settings updates
    const subscription = dialogRef.componentInstance?.onUpdate
      .pipe(takeUntil(this.destroy$))
      .subscribe((updates: any) => {
        if (updates) {
          if (this.isStep) {
            this.dashboard = {
              ...this.dashboard,
              ...(updates.permissions && updates),
              ...(updates.gridOptions && updates),
              ...(updates.filter && updates),
              step: {
                ...this.dashboard?.step,
                ...(!updates.permissions && !updates.filter && updates),
              },
            };
          } else {
            this.dashboard = {
              ...this.dashboard,
              ...(updates.permissions && updates),
              ...(updates.gridOptions && updates),
              ...(updates.filter && updates),
              page: {
                ...this.dashboard?.page,
                ...(!updates.permissions && !updates.filter && updates),
              },
            };
          }
          this.gridOptions = {
            ...this.gridOptions,
            ...this.dashboard?.gridOptions,
          };

          if (updates.filter) {
            this.showFilter = updates.filter.show;
            this.contextService.isFilterEnabled.next(this.showFilter);
          }
        }
      });
    // Unsubscribe to dialog onUpdate event
    dialogRef.closed.pipe(takeUntil(this.destroy$)).subscribe(() => {
      subscription?.unsubscribe();
    });
  }

  /**
   * Update query based on text search.
   *
   * @param search Search text from the graphql select
   */
  public onSearchChange(search: string): void {
    const context = this.dashboard?.page?.context;
    if (!context) return;
    if ('resource' in context) {
      this.recordsQuery.refetch({
        variables: {
          first: ITEMS_PER_PAGE,
          id: context.resource,
        },
        filter: {
          logic: 'and',
          filters: [
            {
              field: context.displayField,
              operator: 'contains',
              value: search,
            },
          ],
        },
      });
    }
  }

  /**
   * Update query based on text search.
   *
   * @param update values to update in the page geographicContext
   * @param update.region region selected
   * @param update.country country selected
   */
  public onSearchChangeGeographicContext(update: {
    region?: string;
    country?: string;
  }): void {
    const geographicContext = {
      ...this.dashboard?.page?.geographicContext,
      ...(update.region && { region: update.region }),
      ...(update.country && { country: update.country }),
    };
    const callback = () => {
      this.dashboard = {
        ...this.dashboard,
        page: {
          ...this.dashboard?.page,
          geographicContext: geographicContext as PageGeographicContextType,
        },
      };
    };
    this.applicationService.updatePageGeographicContext(
      {
        id: this.dashboard?.page?.id,
        geographicContext: geographicContext as PageGeographicContextType,
      },
      callback
    );
  }
}
