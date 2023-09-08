import {
  ChoicesRestful,
  JsonMetadata,
  QuestionFileModel,
  SurveyModel,
  Serializer,
  ItemValue,
} from 'survey-angular';
import { Question } from '../types';
import * as Survey from 'survey-angular';

/**
 * Add support for custom properties to the survey
 *
 * @param Survey Survey library
 * @param environment Current environment
 */
export const init = (Survey: any, environment: any): void => {
  const serializer: JsonMetadata = Survey.Serializer;
  // change the prefix for comments
  Survey.settings.commentPrefix = '_comment';
  // override default expression properties
  serializer.removeProperty('expression', 'readOnly');
  serializer.removeProperty('survey', 'focusFirstQuestionAutomatic');
  serializer.addProperty('expression', {
    name: 'readOnly:boolean',
    type: 'boolean',
    visibleIndex: 6,
    default: false,
    category: 'general',
    required: true,
  });
  // Pass token before the request to fetch choices by URL if it's targeting SAFE API
  // Survey.ChoicesRestful.onBeforeSendRequest = (
  //   sender: ChoicesRestful,
  //   options: { request: { headers: Headers } }
  // ) => {
  //   if (sender.url.includes(environment.apiUrl)) {
  //     const token = localStorage.getItem('idtoken');
  //     options.request.headers.append('Authorization', `Bearer ${token}`);
  //   }
  // };
  Survey.ChoicesRestful.onBeforeSendRequest = (
    sender: ChoicesRestful,
    options: { request: XMLHttpRequest }
  ) => {
    if (sender.url.includes(environment.apiUrl)) {
      const token = localStorage.getItem('idtoken');
      options.request.setRequestHeader('Authorization', `Bearer ${token}`);
    }
  };

  // Add file option for file columns on matrix questions
  Survey.matrixDropdownColumnTypes.file = {
    properties: ['showPreview', 'imageHeight', 'imageWidth'],
    tabs: [
      { name: 'visibleIf', index: 12 },
      { name: 'enableIf', index: 20 },
    ],
  };

  // Adds property that clears the value when condition is met
  serializer.addProperty('question', {
    name: 'clearIf:condition',
    category: 'logic',
    visibleIndex: 4,
    default: '',
    isLocalizable: true,
    onExecuteExpression: (obj: Question, res: boolean) => {
      if (res) {
        obj.value = null;
      }
    },
  });

  // Adds a property that makes it so the question is validated on every value change
  serializer.addProperty('question', {
    name: 'validateOnValueChange:boolean',
    category: 'validation',
    visibleIndex: 4,
    default: false,
  });

  // Adds a dropdowm to the martrices sections with all the questions in the form
  serializer.addProperty('matrix', {
    name: 'test:dropdown',
    category: 'rows',
    choices: (form: Survey.Model, choicesCallback: any) => {
      const forma = form?.survey as SurveyModel;
      const questions = forma.getAllQuestions();
      const questionNames = questions.map((question: Question) => {
        return question.name;
      });
      choicesCallback(questionNames);
    },
  });

  // // Add a button to the matrix dropdowns to copy the rows into in the selected question
  // serializer.addProperty('matrix', {
  //   name: 'copyRowsTo:button',
  //   category: 'rows',
  //   onClick: (matrix: Survey.MatrixDropdownModel) => {
  //     const selectedQuestion = matrix.test;
  //     const rows = matrix.rows;
  //     const newRows = rows.map((row: ItemValue) => {
  //       return {
  //         value: row.value,
  //         text: row.text,
  //       };
  //     });
  //     selectedQuestion.choices = newRows;
  //   },
  // });


  // Adds a property to the survey settings to open the form on a specific page using the question value
  // of the selected question (the value must be a page name)
  serializer.addProperty('survey', {
    name: 'openOnQuestionValuesPage',
    category: 'pages',
    choices: (survey: Survey.Model, choicesCallback: any) => {
      let questions: string[] = [''];
      survey.pages.forEach((page: Survey.PageModel) => {
        questions = questions.concat(
          page.questions.map((question: Survey.Question) => question.name)
        );
      });
      choicesCallback(questions);
    },
  });
  // Adds a property to the survey settings to open the form on a specific page, displaying a dropdown with all the page names
  serializer.addProperty('survey', {
    name: 'openOnPage',
    category: 'pages',
    choices: (survey: Survey.Model, choicesCallback: any) => {
      const pages: string[] = [''].concat(
        survey.pages.map((page: Survey.PageModel) => page.name)
      );
      choicesCallback(pages);
    },
  });
};

/**
 * Render the other global properties
 *
 * @param question The question object
 */
export const render = (question: Question): void => {
  // define the max size for files
  if (question.getType() === 'file') {
    (question as QuestionFileModel).maxSize = 7340032;
  }
};
