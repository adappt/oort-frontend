import { Injectable } from '@angular/core';
import { QueryBuilderService } from './query-builder.service';
import { SafeApiProxyService } from './api-proxy.service';
import { Apollo } from 'apollo-angular';
import { mergeMap, map, take } from 'rxjs/operators';
import { from } from 'rxjs';
import get from 'lodash/get';

/** Clones an array of data */
const cloneData = (data: any[]) => data.map(item => Object.assign({}, item));
/** List of question types with choices */
const OPTION_QUESTIONS = ['dropdown', 'radiogroup', 'tagbox', 'checkbox', 'owner'];

/**
 * Shared preprocessor service.
 * The preprocessor service is used by email service in order to transform the parameters of the email into text.
 */
@Injectable({
  providedIn: 'root'
})
export class SafePreprocessorService {

  /**
   * Shared preprocessor service.
   * The preprocessor service is used by email service in order to transform the parameters of the email into text.
   *
   * @param queryBuilder Shared query builder service
   * @param apollo Apollo client
   * @param apiProxyService Shared API proxy service
   */
  constructor(
    private queryBuilder: QueryBuilderService,
    private apollo: Apollo,
    private apiProxyService: SafeApiProxyService,
  ) { }

  /**
   * Preprocesses text to replace keyword with corresponding data
   *
   * @param text text to preprocess.
   * @param dataset optional dataset settings.
   * @returns preprocessed string.
   */
  public async preprocess(text: string, dataset: {
    settings: any;
    ids: string[];
    sortField?: string;
    sortOrder?: string;
  } | null = null): Promise<string> {
    const promises: Promise<any>[] = [];

    // === DATASET ===
    if (text.includes('{dataset}') && dataset) {
      const builtQuery = this.queryBuilder.buildQuery(dataset.settings);
      if (builtQuery) {
        const dataQuery = this.apollo.watchQuery<any>({
          query: builtQuery,
          variables: {
            first: dataset.ids.length,
            sortField: dataset.sortField ?? null,
            sortOrder: dataset.sortOrder || '',
            filter: {
              logic: 'and',
              filters: [
                {
                  operator: 'eq',
                  field: 'ids',
                  value: dataset.ids
                }
              ]
            }
          }
        });
        const metaQuery = this.queryBuilder.buildMetaQuery(dataset.settings);
        let metaFields: any = [];
        if (metaQuery) {
          promises.push(metaQuery.pipe(
            mergeMap((res: any) => {
              for (const metaField in res.data) {
                if (Object.prototype.hasOwnProperty.call(res.data, metaField)) {
                  metaFields = Object.assign({}, res.data[metaField]);
                }
              }
              return from(this.populateMetaFields(metaFields));
            }),
            mergeMap(() => dataQuery.valueChanges),
            map((res2: any) => {
              let fields = dataset.settings.query.fields;
              let items: any = [];
              for (const field in res2.data) {
                if (Object.prototype.hasOwnProperty.call(res2.data, field)) {
                  fields = this.getFields(metaFields, fields);
                  const nodes = res2.data[field].edges.map((x: any) => x.node) || [];
                  items = cloneData(nodes);
                  this.convertDateFields(fields, items);
                }
              }
              const datasetToString = this.datasetToString(items, fields);
              text = text.split('{dataset}').join(datasetToString);
              return;
            }),
            take(1)
          ).toPromise());
        }
      }
    }

    // === TODAY ===
    if (text.includes('{today}')) {
      const todayToString = (new Date()).toDateString();
      text = text.split('{today}').join(todayToString);
    }

    await Promise.all(promises);
    return text;
  }

  /**
   * Builds the body of the email to open.
   *
   * @param items list of items to stringify
   * @param fields fields to use for query.
   * @returns body of the email.
   */
   private datasetToString(items: any[], fields: any): string {
    let body = '';
    // eslint-disable-next-line max-len
    body += `--------------------------------------------------------------------------------------------------------------------------------\n`;
    for (const item of items) {
      body += this.datasetRowToString(item, fields);
      // eslint-disable-next-line max-len
      body += '--------------------------------------------------------------------------------------------------------------------------------\n';
    }
    return body;
  }

  /**
   * Builds a row of the email to open.
   *
   * @param item item to stringify.
   * @param fields fields to use for query.
   * @param tabs string indentation.
   * @returns body of the email.
   */
  private datasetRowToString(item: any, fields: any, tabs = ''): string {
    let body = '';
    for (const field of fields) {
      switch (field.kind) {
        case 'LIST':
          body += `${tabs}${field.label ? field.label : field.name}:\n`;
          const list = item ? item[field.name] || [] : [];
          list.forEach((element: any, index: number) => {
            body += this.datasetRowToString(element, field.fields, tabs + '\t');
            if (index < (list.length - 1)) {
              body += `${tabs + '\t'}-----------------------\n`;
            }
          });
          break;
        case 'OBJECT':
          body += `${tabs}${field.label ? field.label : field.name}:\n`;
          body += this.datasetRowToString(item ? item[field.name] : null, field.fields, tabs + '\t');
          break;
        default:
          const rawValue = get(item, field.name, '') || '';
          const value = rawValue && OPTION_QUESTIONS.includes(field.meta.type) ? this.getDisplayText(rawValue, field.meta) : rawValue;
          body += `${tabs}${field.label ? field.label : field.title ? field.title : field.name}:\t${value}\n`;
      }
    }
    return body;
  }

  /**
   * Populates questions with choices, with meta data.
   *
   * @param metaFields list of meta fields.
   */
  private async populateMetaFields(metaFields: any): Promise<void> {
    for (const fieldName of Object.keys(metaFields)) {
      const meta = metaFields[fieldName];
      if (meta.choicesByUrl) {
        const url: string = meta.choicesByUrl.url;
        const localRes = localStorage.getItem(url);
        if (localRes) {
          metaFields[fieldName] = {
            ...meta,
            choices: this.extractChoices(JSON.parse(localRes), meta.choicesByUrl)
          };
        } else {
          const res: any = await this.apiProxyService.promisedRequestWithHeaders(url);
          localStorage.setItem(url, JSON.stringify(res));
          metaFields[fieldName] = {
            ...meta,
            choices: this.extractChoices(res, meta.choicesByUrl)
          };
        }
      }
    }
  }

  /**
   * Extracts choices using choicesByUrl properties
   *
   * @param res Result of http request.
   * @param choicesByUrl Choices By Url property.
   * @returns list of choices.
   */
  private extractChoices(res: any, choicesByUrl: { path?: string; value?: string; text?: string }): { value: string; text: string }[] {
    const choices = choicesByUrl.path ? [...get(res, choicesByUrl.path)] : [...res];
    return choices ? choices.map((x: any) => ({
      value: (choicesByUrl.value ? get(x, choicesByUrl.value) : x).toString(),
      text: choicesByUrl.text ? get(x, choicesByUrl.text) : choicesByUrl.value ? get(x, choicesByUrl.value) : x
    })) : [];
  }

  private flatDeep(arr: any[]): any[] {
    return arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? this.flatDeep(val) : val), []);
  }

  private getFields(metaFields: any, fields: any[], prefix?: string, disabled?: boolean): any[] {
    return this.flatDeep(fields.map(f => {
      const fullName: string = prefix ? `${prefix}.${f.name}` : f.name;
      switch (f.kind) {
        case 'OBJECT': {
          return {
            name: f.name,
            title: f.label ? f.label : f.name,
            kind: 'OBJECT',
            fields: this.getFields(metaFields, f.fields, fullName, true)
          };
        }
        case 'LIST': {
          return {
            name: f.name,
            title: f.label ? f.label : f.name,
            kind: 'LIST',
            fields: this.getFields(metaFields, f.fields, fullName, true)
          };
        }
        default: {
          const metaData = get(metaFields, fullName);
          return {
            name: f.name,
            title: f.label ? f.label : f.name,
            type: f.type,
            meta: metaData
          };
        }
      }
    })).sort((a, b) => a.order - b.order);
  }

  /**
   * Transforms stored dates into readable dates.
   *
   * @param fields list of fields.
   * @param items list of items.
   */
  private convertDateFields(fields: any[], items: any[]): void {
    const dateFields = fields.filter(x => ['Date', 'DateTime', 'Time'].includes(x.type)).map(x => x.name);
    items.map(x => {
      for (const [key, value] of Object.entries(x)) {
        if (dateFields.includes(key)) {
          x[key] = x[key] && new Date(x[key]);
        }
      }
    });
  }

  /**
   * Displays text instead of values for questions with select.
   *
   * @param meta meta data of the question.
   * @param value question value.
   * @returns text value of the question.
   */
  private getDisplayText(value: string | string[], meta: { choices?: { value: string; text: string }[] }): string | string[] {
    if (meta.choices) {
      if (Array.isArray(value)) {
        return meta.choices.reduce((acc: string[], x) => value.includes(x.value) ? acc.concat([x.text]) : acc, []);
      } else {
        return meta.choices.find(x => x.value === value)?.text || '';
      }
    } else {
      return value;
    }
  }
}

