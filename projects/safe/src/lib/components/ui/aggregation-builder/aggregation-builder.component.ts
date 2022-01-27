import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apollo, QueryRef } from 'apollo-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators'; 
import {
  GET_FORMS,
  GetFormsQueryResponse,
  GetFormByIdQueryResponse,
  GET_FORM_BY_ID,
} from '../../../graphql/queries';
import { Form } from '../../../models/form.model';

const ITEMS_PER_PAGE = 10;

@Component({
  selector: 'safe-aggregation-builder',
  templateUrl: './aggregation-builder.component.html',
  styleUrls: ['./aggregation-builder.component.scss'],
})
export class SafeAggregationBuilderComponent implements OnInit {
  // === DATA ===
  @Input() settings: any;
  // Data sources
  private forms = new BehaviorSubject<Form[]>([]);
  public forms$!: Observable<Form[]>;
  private formsQuery!: QueryRef<GetFormsQueryResponse>;
  public loading = true;
  private pageInfo = {
    endCursor: '',
    hasNextPage: true,
  };
  // Fields
  private fields = new BehaviorSubject<any[]>([]);
  public fields$!: Observable<any[]>;

  // === REACTIVE FORM ===
  aggregationForm: FormGroup = new FormGroup({});

  constructor(private apollo: Apollo, private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.aggregationForm = this.formBuilder.group({
      dataSource: [
        this.settings && this.settings.dataSource
          ? this.settings.dataSource
          : null,
        Validators.required,
      ],
      sourceFields: [
        this.settings && this.settings.sourceFields
          ? this.settings.sourceFields
          : [],
        Validators.required,
      ],
    });

    this.formsQuery = this.apollo.watchQuery<GetFormsQueryResponse>({
      query: GET_FORMS,
      variables: {
        first: ITEMS_PER_PAGE,
      },
    });
    this.forms$ = this.forms.asObservable();
    this.formsQuery.valueChanges.subscribe((res) => {
      this.forms.next(res.data.forms.edges.map((x) => x.node));
      this.pageInfo = res.data.forms.pageInfo;
      this.loading = res.loading;
    });

    this.fields$ = this.fields.asObservable();
    this.aggregationForm
      .get('dataSource')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((form) => {
        if (form && form.id) {
          this.aggregationForm.get('sourceFields')?.setValue([]);
          this.apollo
            .query<GetFormByIdQueryResponse>({
              query: GET_FORM_BY_ID,
              variables: {
                id: form.id,
              },
            })
            .subscribe((res) => {
              this.fields.next(res.data.form.fields || []);
            });
        }
      });
  }

  /**
   * Filter data sources by names.
   *
   * @param value string used to filter.
   */
  public onFilterDataSource(value: string): void {
    if (!this.loading) {
      this.loading = true;
      this.fetchMoreDataSources(false, value);
    }
  }

  /**
   * Fetch next page of data source to add to list.
   *
   * @param value string used to filter.
   */
  public onScrollDataSource(value: boolean): void {
    if (!this.loading && this.pageInfo.hasNextPage) {
      this.loading = true;
      this.fetchMoreDataSources(value);
    }
  }

  /**
   * Fetch more data sources using filtering and pagination.
   *
   * @param nextPage boolean to indicate if we must fetch the next page.
   */
  public fetchMoreDataSources(nextPage: boolean = false, filter: string = '') {
    const variables: any = {
      first: ITEMS_PER_PAGE,
    };
    if (filter) {
      variables.filter = {
        logic: 'and',
        filters: [
          {
            field: 'name',
            operator: 'contains',
            value: filter,
          },
        ],
      };
    }
    if (nextPage) {
      variables.afterCursor = this.pageInfo.endCursor;
    }
    this.formsQuery.fetchMore({
      variables,
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }
        return Object.assign({}, prev, {
          forms: {
            edges: prev.forms.edges.concat(
              fetchMoreResult.forms.edges.filter(
                (x) => !prev.forms.edges.some((y) => y.node.id === x.node.id)
              )
            ),
            pageInfo: fetchMoreResult.forms.pageInfo,
            totalCount: fetchMoreResult.forms.totalCount,
          },
        });
      },
    });
  }
}
