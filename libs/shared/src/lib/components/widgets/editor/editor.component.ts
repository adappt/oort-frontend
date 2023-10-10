import { Component, OnInit, Input } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { Apollo } from 'apollo-angular';
import { firstValueFrom, takeUntil } from 'rxjs';
import {
  GET_LAYOUT,
  GET_REFERENCE_DATA_AGGREGATION_DATA,
  GET_RESOURCE_AGGREGATION_DATA,
  GET_RESOURCE_METADATA,
} from '../summary-card/graphql/queries';
import { clone, get } from 'lodash';
import { QueryBuilderService } from '../../../services/query-builder/query-builder.service';
import { DataTemplateService } from '../../../services/data-template/data-template.service';
import { Dialog } from '@angular/cdk/dialog';
import { SnackbarService } from '@oort-front/ui';
import { TranslateService } from '@ngx-translate/core';
import { ResourceQueryResponse } from '../../../models/resource.model';
import { GridService } from '../../../services/grid/grid.service';
import { ReferenceDataQueryResponse } from '../../../models/reference-data.model';
import { AggregationService } from '../../../services/aggregation/aggregation.service';
import { AggregationBuilderService } from '../../../services/aggregation-builder/aggregation-builder.service';
import { UnsubscribeComponent } from '../../utils/unsubscribe/unsubscribe.component';

/**
 * Text widget component using KendoUI
 */
@Component({
  selector: 'shared-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent extends UnsubscribeComponent implements OnInit {
  // === WIDGET CONFIGURATION ===
  @Input() header = true;
  @Input() settings: any;

  private layout: any;
  private fields: any[] = [];
  private fieldsValue: any;
  private styles: any[] = [];
  private wholeCardStyles = false;

  public formattedHtml: SafeHtml = '';
  public formattedStyle?: string;

  /**
   * Constructor for shared-editor component
   *
   * @param apollo Apollo instance
   * @param queryBuilder Query builder service
   * @param dataTemplateService Shared data template service, used to render content from template
   * @param aggregationService aggregation service to fetch needed data
   * @param aggregationBuilderService aggregation builder service to map and build up any needed fields
   * @param dialog Dialog service
   * @param snackBar Shared snackbar service
   * @param translate Angular translate service
   * @param gridService Shared grid service
   */
  constructor(
    private apollo: Apollo,
    private queryBuilder: QueryBuilderService,
    private dataTemplateService: DataTemplateService,
    private aggregationService: AggregationService,
    private aggregationBuilderService: AggregationBuilderService,
    private dialog: Dialog,
    private snackBar: SnackbarService,
    private translate: TranslateService,
    private gridService: GridService
  ) {
    super();
  }

  /** Sanitizes the text. */
  ngOnInit(): void {
    this.setContentFromLayout();
  }

  /**
   * Sets content of the text widget, querying associated record if any.
   */
  private async setContentFromLayout(): Promise<void> {
    if (this.settings.record || this.settings.aggregationItem) {
      if (this.settings.record) {
        await this.getLayout();
        await this.getResourceData();
      } else if (this.settings.aggregationItem) {
        await this.getAggregationData();
      }
      this.formattedStyle = this.dataTemplateService.renderStyle(
        this.settings.wholeCardStyles || false,
        this.fieldsValue,
        this.styles
      );
      this.formattedHtml = this.dataTemplateService.renderHtml(
        this.settings.text,
        this.fieldsValue,
        this.fields,
        this.styles
      );
    } else {
      this.formattedHtml = this.dataTemplateService.renderHtml(
        this.settings.text
      );
    }
  }

  /** Sets layout */
  private async getLayout(): Promise<void> {
    const apolloRes = await firstValueFrom(
      this.apollo.query<ResourceQueryResponse>({
        query: GET_LAYOUT,
        variables: {
          id: this.settings.layout,
          resource: this.settings.resource,
        },
      })
    );

    if (get(apolloRes, 'data')) {
      this.layout = apolloRes.data.resource.layouts?.edges[0]?.node;
      if (this.settings.useStyles) {
        this.styles = this.layout?.query.style;
      }
    }
  }

  /**
   * Queries the resource data.
   */
  private async getResourceData() {
    const metaRes = await firstValueFrom(
      this.apollo.query<ResourceQueryResponse>({
        query: GET_RESOURCE_METADATA,
        variables: {
          id: this.settings.resource,
        },
      })
    );
    const queryName = get(metaRes, 'data.resource.queryName');

    const builtQuery = this.queryBuilder.buildQuery({
      query: this.layout.query,
    });
    const layoutFields = this.layout.query.fields;
    this.fields = get(metaRes, 'data.resource.metadata', []).map((f: any) => {
      const layoutField = layoutFields.find((lf: any) => lf.name === f.name);
      if (layoutField) {
        return { ...layoutField, ...f };
      }
      return f;
    });

    if (builtQuery) {
      const res = await firstValueFrom(
        this.apollo.query<any>({
          query: builtQuery,
          variables: {
            first: 1,
            filter: {
              // get only the record we need
              logic: 'and',
              filters: [
                {
                  field: 'id',
                  operator: 'eq',
                  value: this.settings.record,
                },
              ],
            },
          },
        })
      );
      const record: any = get(res.data, `${queryName}.edges[0].node`, null);
      this.fieldsValue = { ...record };
      const metaQuery = this.queryBuilder.buildMetaQuery(this.layout.query);
      if (metaQuery) {
        const metaData = await firstValueFrom(metaQuery);
        for (const field in metaData.data) {
          if (Object.prototype.hasOwnProperty.call(metaData.data, field)) {
            const metaFields = Object.assign({}, metaData.data[field]);
            try {
              await this.gridService.populateMetaFields(metaFields);
              this.fields = this.fields.map((field) => {
                //add shape for columns and matrices
                const metaData = metaFields[field.name];
                if (metaData && (metaData.columns || metaData.rows)) {
                  return {
                    ...field,
                    columns: metaData.columns,
                    rows: metaData.rows,
                  };
                }
                return field;
              });
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    }
  }

  /**
   * Queries the reference data data.
   */
  private async getAggregationData() {
    const type = this.settings.resource ? 'resource' : 'referenceData';

    const metaRes = await firstValueFrom(
      this.apollo.query<ResourceQueryResponse & ReferenceDataQueryResponse>({
        query: this.settings.resource
          ? GET_RESOURCE_AGGREGATION_DATA
          : GET_REFERENCE_DATA_AGGREGATION_DATA,
        variables: {
          id: this.settings.resource ?? this.settings.referenceData,
          aggregation: this.settings.aggregation
            ? [this.settings.aggregation]
            : [],
        },
      })
    );

    const queryName = this.aggregationService.setCurrentSourceQueryName(
      metaRes.data[type],
      type
    );
    const allGqlFields = this.queryBuilder.getFields(queryName);
    // Fetch fields at the end of the pipeline
    const aggregationItem: any = metaRes.data[type].aggregations?.edges[0].node;
    const fieldsName =
      metaRes.data[type].fields?.map((field: any) =>
        type === 'resource' ? field.name : field.graphQLFieldName
      ) ?? [];
    this.fields = this.aggregationBuilderService.fieldsAfter(
      allGqlFields
        ?.filter((x) => fieldsName.includes(x.name))
        .map((field: any) => {
          if (field.type?.kind !== 'SCALAR') {
            field.fields = this.queryBuilder
              .getFieldsFromType(
                field.type?.kind === 'OBJECT'
                  ? field.type.name
                  : field.type.ofType.name
              )
              .filter((y) => y.type.name !== 'ID' && y.type?.kind === 'SCALAR');
          }
          return field;
        }) || [],
      aggregationItem.pipeline ?? []
    );

    const aggregationItemQuery =
      this.aggregationService.aggregationDataWatchQuery(
        this.settings.resource ?? this.settings.referenceData,
        type,
        this.settings.aggregation,
        10,
        0,
        {
          // get only the aggregation item we need
          logic: 'and',
          filters: [
            {
              field: this.settings.aggregationItemIdentifier,
              operator: 'eq',
              value: this.settings.aggregationItem,
            },
          ],
        }
      );

    if (aggregationItemQuery) {
      aggregationItemQuery.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(({ data }) => {
          let selectedItem;
          if (type === 'resource') {
            selectedItem = data.recordsAggregation.items[0];
          } else {
            selectedItem = data.referenceDataAggregation.items.find(
              (item: any) =>
                item[this.settings.aggregationItemIdentifier] ===
                this.settings.aggregationItem
            );
          }
          this.fieldsValue = selectedItem ? { ...selectedItem } : {};
        });
    }
  }

  /**
   * Pass click event to data template service
   *
   * @param event Click event
   */
  public onClick(event: any) {
    this.dataTemplateService.onClick(event, this.fieldsValue);
  }

  /**
   * Open the dataSource modal.
   */
  public async openDataSource(): Promise<void> {
    if (this.layout?.query) {
      const { ResourceGridModalComponent } = await import(
        '../../search-resource-grid-modal/search-resource-grid-modal.component'
      );
      this.dialog.open(ResourceGridModalComponent, {
        data: {
          gridSettings: clone(this.layout.query),
        },
      });
    } else {
      this.snackBar.openSnackBar(
        this.translate.instant(
          'components.widget.summaryCard.errors.invalidSource'
        ),
        { error: true }
      );
    }
  }
}
