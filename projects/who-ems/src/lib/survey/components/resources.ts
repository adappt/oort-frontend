import { WhoSurveyGridComponent } from '../../components/survey/survey-grid/survey-grid.component';
import { DomService } from '../../services/dom.service';
import { WhoFormModalComponent } from '../../components/form-modal/form-modal.component';
import { MatDialog } from '@angular/material/dialog';
import {
  GET_RESOURCE_BY_ID,
  GET_RESOURCES,
  GetResourceByIdQueryResponse,
  GetResourcesQueryResponse
} from '../../graphql/queries';
import { Apollo } from 'apollo-angular';

export function init(Survey: any, domService: DomService, dialog: MatDialog, apollo: Apollo): void {
  const getResources = () => apollo.query<GetResourcesQueryResponse>({
    query: GET_RESOURCES,
  });

  const getResourcesById = (id: string) => apollo.query<GetResourceByIdQueryResponse>({
    query: GET_RESOURCE_BY_ID,
    variables: {
      id
    }
  });

  let resourcesForms: any[] = [];

  const component = {
    name: 'resources',
    title: 'Resources',
    category: 'Custom Questions',
    questionJSON: {
      name: 'resources',
      type: 'tagbox',
      optionsCaption: 'Select a resource...',
      choicesOrder: 'asc',
      choices: [],
    },
    onInit(): void {
      Survey.Serializer.addProperty('resources', {
        name: 'resource',
        category: 'Custom Questions',
        visibleIndex: 3,
        required: true,
        choices: (obj: any, choicesCallback: any) => {
        getResources().subscribe((response) => {
            const serverRes = response.data.resources;
            resourcesForms = response.data.resources;
            const res = [];
            res.push({value: null});
            for (const item of serverRes) {
              res.push({value: item.id, text: item.name});
            }
            choicesCallback(res);
          });
        },
      });
      Survey.Serializer.addProperty('resources', {
        name: 'displayField',
        category: 'Custom Questions',
        dependsOn: 'resource',
        required: true,
        visibleIf: (obj: any) => {
          if (!obj || !obj.resource) {
            return false;
          } else {
            return true;
          }
        },
        visibleIndex: 3,
        choices: (obj: any, choicesCallback: any) => {
          if (obj.resource) {
            getResourcesById(obj.resource).subscribe((response) => {
              const serverRes = response.data.resource.fields;
              const res = [];
              res.push({value: null});
              for (const item of serverRes) {
                res.push({value: item.name});
              }
              choicesCallback(res);
            });
          }
        },
      });
      Survey.Serializer.addProperty('resources', {
        name: 'test service',
        category: 'Custom Questions',
        dependsOn: ['resource', 'displayField'],
        required: true,
        visibleIf: (obj: any) => {
          if (!obj || !obj.resource || !obj.displayField) {
            return false;
          } else {
            return true;
          }
        },
        visibleIndex: 3,
        choices: (obj: any, choicesCallback: any) => {
          if (obj.resource) {
            getResourcesById(obj.resource).subscribe((response) => {
              const serverRes = response.data.resource.records || [];
              const res = [];
              res.push({value: null});
              for (const item of serverRes) {
                res.push({value: item.id, text: item.data[obj.displayField]});
              }
              choicesCallback(res);
            });
          }
        },
      });
      Survey.Serializer.addProperty('resources', {
        name: 'displayAsGrid:boolean',
        category: 'Custom Questions',
        dependsOn: 'resource',
        visibleIf: (obj: any) => {
          if (!obj || !obj.resource) {
            return false;
          } else {
            return true;
          }
        },
        visibleIndex: 3,
      });
      Survey.Serializer.addProperty('resources', {
        name: 'canAddNew:boolean',
        category: 'Custom Questions',
        dependsOn: 'resource',
        visibleIf: (obj: any) => {
          if (!obj || !obj.resource) {
            return false;
          } else {
            return !hasUniqueRecord(obj.resource);
          }
        },
        visibleIndex: 3,
      });
      Survey.Serializer.addProperty('resources', {
        name: 'addTemplate',
        category: 'Custom Questions',
        dependsOn: ['canAddNew', 'resource'],
        visibleIf: (obj: any) => {
          if (!obj || !obj.canAddNew) {
            return false;
          } else {
            return !hasUniqueRecord(obj.resource);
          }
        },
        visibleIndex: 3,
        choices: (obj: any, choicesCallback: any) => {
          if (obj.resource && obj.canAddNew) {
            getResourcesById(obj.resource).subscribe((response) => {
              const serverRes = response.data.resource.forms || [];
              const res = [];
              res.push({value: null});
              for (const item of serverRes) {
                res.push({value: item.id, text: item.name});
              }
              choicesCallback(res);
            });
          }
        },
      });
    },
    onLoaded(question: any): void {
      getResourcesById(question.resource).subscribe((response) => {
        const serverRes = response.data.resource.records || [];
        const res = [];
        for (const item of serverRes) {
          res.push({value: item.id, text: item.data[question.displayField]});
        }
        // question.choices = res;
        question.contentQuestion.choices = res;
        // data = res;
        question.survey.render();
      });
    },
    onPropertyChanged(question: any, propertyName: string, newValue: any): void {
      if (propertyName === 'resource') {
        question.canAddNew = false;
        question.addTemplate = null;
      }
    },
    onAfterRender(question: any, el: any): void {
      if (question.displayAsGrid) {
        // hide tagbox if grid view is enable
        const element = el.getElementsByClassName('select2 select2-container')[0].parentElement;
        element.style.display = 'none';
      }
      if (question.canAddNew && question.addTemplate) {
        document.addEventListener('saveResourceFromEmbed', (e: any) => {
          const detail = e.detail;
          if (detail.template === question.addTemplate) {
            getResourcesById(question.resource).subscribe((response) => {
              const serverRes = response.data.resource.records || [];
              const res = [];
              for (const item of serverRes) {
                res.push({
                  value: item.id,
                  text: item.data[question.displayField],
                });
              }
              question.contentQuestion.choices = res;
              question.survey.render();
            });
          }
        });
      }
    },
  };
  Survey.ComponentCollection.Instance.add(component);
  const gridWidget = {
    name: 'displayAsGrid',
    isFit: (question: any) => {
      if (question.getType() === 'resources') {
        return question.displayAsGrid || question.canAddNew;
      } else {
        return false;
      }
    },
    isDefaultRender: true,
    afterRender: (question: any, el: any) => {
      if (question.resource) {
        let instance: any;
        if (question.displayAsGrid) {
          const grid = domService.appendComponentToBody(WhoSurveyGridComponent, el.parentElement);
          instance = grid.instance;
          instance.fetchData(question.resource, question.displayField);
          // subscribed grid data to add values to survey question.
          instance.gridData.subscribe((value: any[]) => {
            question.value = value.map(v => v.value);
          });
        }
        const mainDiv = document.createElement('div');
        mainDiv.id = 'addRecordDiv';
        const btnEl = document.createElement('button');
        btnEl.innerText = 'Add new record';
        btnEl.style.width = '150px';
        if (question.canAddNew && question.addTemplate) {
          btnEl.onclick = () => {
              const dialogRef = dialog.open(WhoFormModalComponent, {
                data: {
                  template: question.addTemplate,
                  locale: question.resource
                }
              });
              dialogRef.afterClosed().subscribe((response) => {
                if (response) {
                  if (question.displayAsGrid) {
                    instance.allData.push({value: response.data.id, text: response.data.data[question.displayField]});
                  } else {
                    const e = new CustomEvent('saveResourceFromEmbed', {
                      detail: {
                        resource: response.data,
                        template: response.template
                      }
                    });
                    document.dispatchEvent(e);
                  }
                }
              });
          };
        }
        mainDiv.appendChild(btnEl);
        el.parentElement.insertBefore(mainDiv, el);
        mainDiv.style.display = !question.canAddNew || !question.addTemplate ? 'none' : '';

        question.registerFunctionOnPropertyValueChanged('addTemplate',
          () => {
            mainDiv.style.display = !question.canAddNew || !question.addTemplate ? 'none' : '';
          });
        question.registerFunctionOnPropertyValueChanged('canAddNew',
          () => {
            mainDiv.style.display = !question.canAddNew || !question.addTemplate ? 'none' : '';
          });
      }
    },
  };
  Survey.CustomWidgetCollection.Instance.add(gridWidget);

  const hasUniqueRecord = ((id: string) =>
    resourcesForms.filter(r => (r.id === id && r.coreForm && r.coreForm.uniqueRecord)).length > 0);
}
