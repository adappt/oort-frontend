import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Form } from '../../../models/form.model';
import { AggregationService } from '../../../services/aggregation/aggregation.service';
import {
  Resource,
  ResourceQueryResponse,
} from '../../../models/resource.model';
import {
  GET_REFERENCE_DATA_AGGREGATIONS,
  GET_RESOURCE_AGGREGATIONS,
} from './graphql/queries';
import { Apollo, QueryRef } from 'apollo-angular';
import { UntypedFormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  DialogModule,
  FormWrapperModule,
  GraphQLSelectComponent,
  GraphQLSelectModule,
  TooltipModule,
} from '@oort-front/ui';
import { ButtonModule } from '@oort-front/ui';
import { takeUntil } from 'rxjs';
import { UnsubscribeComponent } from '../../utils/unsubscribe/unsubscribe.component';
import {
  ReferenceData,
  ReferenceDataQueryResponse,
} from '../../../models/reference-data.model';

/**
 * Data needed for the dialog, should contain an aggregations array, a form and a resource
 */
interface DialogData {
  hasAggregations: boolean;
  form?: Form;
  resource?: Resource;
  referenceData?: ReferenceData;
}

/**
 * Modal to add or select an aggregation.
 * Result of the action will be added to the component list that triggered the modal.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DialogModule,
    GraphQLSelectModule,
    ReactiveFormsModule,
    ButtonModule,
    FormWrapperModule,
    TooltipModule,
  ],
  selector: 'shared-add-aggregation-modal',
  templateUrl: './add-aggregation-modal.component.html',
  styleUrls: ['./add-aggregation-modal.component.scss'],
})
export class AddAggregationModalComponent
  extends UnsubscribeComponent
  implements OnInit
{
  private form?: Form;
  private resource?: Resource;
  private referenceData?: ReferenceData;
  public hasAggregations = false;
  public nextStep = false;

  public queryRef!:
    | QueryRef<ResourceQueryResponse>
    | QueryRef<ReferenceDataQueryResponse>;

  public selectedAggregationControl = new UntypedFormControl('');

  /** Reference to graphql select for layout */
  @ViewChild(GraphQLSelectComponent)
  aggregationSelect?: GraphQLSelectComponent;

  /**
   * Modal to add or select an aggregation.
   * Result of the action will be added to the component list that triggered the modal.
   *
   * @param dialogRef Dialog reference
   * @param dialog Dialog instance
   * @param apollo Apollo client service
   * @param data Data used by the modal
   * @param aggregationService Shared aggregation service
   */
  constructor(
    private dialogRef: DialogRef<AddAggregationModalComponent>,
    private dialog: Dialog,
    private apollo: Apollo,
    @Inject(DIALOG_DATA) public data: DialogData,
    private aggregationService: AggregationService
  ) {
    super();
    this.hasAggregations = data.hasAggregations;
    this.form = data.form;
    this.resource = data.resource;
    this.referenceData = data.referenceData;
  }

  ngOnInit(): void {
    if (this.resource)
      this.queryRef = this.apollo.watchQuery<ResourceQueryResponse>({
        query: GET_RESOURCE_AGGREGATIONS,
        variables: {
          resource: this.resource?.id,
        },
      });
    else if (this.referenceData)
      this.queryRef = this.apollo.watchQuery<ReferenceDataQueryResponse>({
        query: GET_REFERENCE_DATA_AGGREGATIONS,
        variables: {
          referenceData: this.referenceData?.id,
        },
      });
    // emits selected aggregation
    this.selectedAggregationControl.valueChanges.subscribe((value) => {
      if (value) {
        this.dialogRef.close(
          this.aggregationSelect?.elements
            .getValue()
            .find((x) => x.id === value)
        );
      }
    });
  }

  /**
   * Opens the panel to create a new aggregation.
   */
  public async onCreate(): Promise<void> {
    const { EditAggregationModalComponent } = await import(
      '../edit-aggregation-modal/edit-aggregation-modal.component'
    );
    const dialogRef = this.dialog.open(EditAggregationModalComponent, {
      disableClose: true,
      data: {
        resource: this.resource,
        referenceData: this.referenceData,
      },
    });
    dialogRef.closed
      .pipe(takeUntil(this.destroy$))
      .subscribe((aggregation: any) => {
        if (aggregation) {
          const id = this.resource?.id ?? this.referenceData?.id;
          const type = this.resource?.id ? 'resource' : 'referenceData';
          this.aggregationService
            .addAggregation(aggregation, id, type)
            .subscribe(({ data }) => {
              if (data?.addAggregation) {
                this.dialogRef.close(data.addAggregation as any);
              } else {
                this.dialogRef.close();
              }
            });
        }
      });
  }
}
