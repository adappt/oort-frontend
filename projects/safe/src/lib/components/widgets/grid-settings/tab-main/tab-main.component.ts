import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Apollo, QueryRef } from 'apollo-angular';
import { Form } from '../../../../models/form.model';
import { Resource } from '../../../../models/resource.model';
import { GetResourcesQueryResponse, GET_RESOURCES } from '../graphql/queries';

/** Default items per query, for pagination */
const ITEMS_PER_PAGE = 10;

/**
 * Main tab of widget grid configuration modal.
 */
@Component({
  selector: 'safe-tab-main',
  templateUrl: './tab-main.component.html',
  styleUrls: ['./tab-main.component.scss'],
})
export class TabMainComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() form: Form | null = null;
  @Input() resource: Resource | null = null;
  @Input() queries: any[] = [];
  @Input() templates: Form[] = [];

  public resourcesQuery!: QueryRef<GetResourcesQueryResponse>;

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.resourcesQuery = this.apollo.watchQuery<GetResourcesQueryResponse>({
      query: GET_RESOURCES,
      variables: {
        first: ITEMS_PER_PAGE,
        sortField: 'name',
      },
    });
  }
}
