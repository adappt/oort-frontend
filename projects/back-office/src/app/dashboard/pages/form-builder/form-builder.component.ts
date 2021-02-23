import {Component, OnInit} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { EditFormMutationResponse, EDIT_FORM_NAME, EDIT_FORM_PERMISSIONS, EDIT_FORM_STATUS, EDIT_FORM_STRUCTURE } from '../../../graphql/mutations';
import { GetFormByIdQueryResponse, GET_FORM_BY_ID } from '../../../graphql/queries';
import { MatDialog } from '@angular/material/dialog';
import { WhoAuthService, WhoSnackBarService, Form, WhoConfirmModalComponent } from '@who-ems/builder';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss']
})
export class FormBuilderComponent implements OnInit {

  public loading = true;
  public id: string;
  public form: Form;
  public structure: any;
  public activeVersions = false;
  public activeVersion: any;

  // === ENUM OF FORM STATUSES ===
  public statuses = [
    {
      value: 'active',
      text: 'Active',
      color: 'primary'
    },
    {
      value: 'pending',
      text: 'Pending',
      color: 'accent'
    },
    {
      value: 'archived',
      text: 'Archive',
      color: 'warn'
    }
  ];

  // === FORM EDITION ===
  public formActive: boolean;
  public nameForm: FormGroup;
  public hasChanges = false;

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: WhoSnackBarService,
    public dialog: MatDialog,
    private authService: WhoAuthService
  ) { }

  /* Shows modal confirmation before leave the page if has changes on form
  */
  canDeactivate(): Observable<boolean> | boolean{
    if (this.hasChanges) {
      const dialogRef = this.dialog.open(WhoConfirmModalComponent, {
        data: {
          title: `Exit without saving changes`,
          content: `There are unsaved changes on your form. Are you sure you want to exit?`,
          confirmText: 'Confirm',
          confirmColor: 'primary'
        }
      });
      return dialogRef.afterClosed().pipe(map(value => {
        if (value) {
          this.authService.canLogout.next(true);
          window.localStorage.removeItem('saveLoadSurveyCreator');
          return true;
        }
        return false;
      }));
    }
    return true;
  }


  ngOnInit(): void {
    this.formActive = false;

    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id !== null) {
      this.apollo.watchQuery<GetFormByIdQueryResponse>({
        query: GET_FORM_BY_ID,
        variables: {
          id: this.id
        }
      }).valueChanges.subscribe((res) => {
        if (res.data.form) {
          this.loading = res.loading;
          this.form = res.data.form;
          this.nameForm = new FormGroup({
            formName: new FormControl(this.form.name, Validators.required)
          });
          const surveyStructureStorage = window.localStorage.getItem('saveLoadSurveyCreator');
          this.structure = this.form.structure;
          if (surveyStructureStorage !== null && this.structure !== surveyStructureStorage) {
            this.hasChanges = true;
          }
        } else {
          this.snackBar.openSnackBar('No access provided to this form.', { error: true });
          // redirect to default screen if error
          this.router.navigate(['/forms']);
        }
      }, (err) => {
        this.snackBar.openSnackBar(err.message, { error: true });
        // redirect to default screen if error
        this.router.navigate(['/forms']);
      });
    } else {
      this.loading = false;
      // redirect to default screen if error
      this.router.navigate(['/forms']);
    }
  }

  toggleFormActive(): void {
    if (this.form.canUpdate) {
      this.formActive = !this.formActive;
    }
  }

  /* Save the form
  */
  public onSave(structure: any): void {
    if (!this.form.id) {
      alert('not valid');
    } else {
      this.apollo.mutate<EditFormMutationResponse>({
        mutation: EDIT_FORM_STRUCTURE,
        variables: {
          id: this.form.id,
          structure
        }
      }).subscribe(res => {
        if (res.errors) {
          this.snackBar.openSnackBar(res.errors[0].message, { error: true });
        } else {
          this.snackBar.openSnackBar('Form updated');
          this.form = res.data.editForm;
          this.structure = structure; // Update current form to
          this.hasChanges = false;
          this.authService.canLogout.next(true);
        }
      }, (err) => {
        this.snackBar.openSnackBar(err.message, { error: true });
      });
    }
  }

  /*  Update the status of the form.
  */
  public updateStatus(e: any): void {
    this.apollo.mutate<EditFormMutationResponse>({
      mutation: EDIT_FORM_STATUS,
      variables: {
        id: this.id,
        status: e.value
      }
    }).subscribe(res => {
      this.snackBar.openSnackBar(`Status updated to ${e.value}`, { duration: 1000 });
      this.form.status = res.data.editForm.status;
    });
  }

  /*  Available in previous version to change the template.
  */
  setTemplate(id: string): void {
    this.apollo.watchQuery<GetFormByIdQueryResponse>({
      query: GET_FORM_BY_ID,
      variables: {
        id
      }
    }).valueChanges.subscribe(res => {
      this.structure = res.data.form.structure;
    });
  }

  /*  Available in previous version to change the version.
*/
  public onOpenVersion(e: any): void {
    this.activeVersion = e;
    this.structure = this.activeVersion.data;
    // this.surveyCreator.makeNewViewActive('test');
    // this.surveyCreator.saveSurveyFunc = null;
  }

  /*  Available in previous version to change the version.
  */
  public resetActiveVersion(): void {
    this.activeVersion = null;
    this.structure = this.form.structure;
    // this.surveyCreator.makeNewViewActive('designer');
    // this.surveyCreator.saveSurveyFunc = this.saveMySurvey;
  }

  /*  Edit the form name.
*/
  public saveName(): void {
    const { formName } = this.nameForm.value;
    this.toggleFormActive();
    this.apollo.mutate<EditFormMutationResponse>({
      mutation: EDIT_FORM_NAME,
      variables: {
        id: this.id,
        name: formName
      }
    }).subscribe(
      res => {
        if (res.errors) {
          this.snackBar.openSnackBar('The Form was not changed. ' + res.errors[0].message);
        } else {
          this.snackBar.openSnackBar('Name updated', { duration: 1000 });
          this.form.name = res.data.editForm.name;
        }
    });
  }

  /*  Edit the permissions layer.
  */
  saveAccess(e: any): void {
    this.apollo.mutate<EditFormMutationResponse>({
      mutation: EDIT_FORM_PERMISSIONS,
      variables: {
        id: this.id,
        permissions: e
      }
    }).subscribe(res => {
      this.form = res.data.editForm;
    });
  }

  formStructureChange(event: any): void {
    this.hasChanges = event;
    this.authService.canLogout.next(!event);
  }
}
