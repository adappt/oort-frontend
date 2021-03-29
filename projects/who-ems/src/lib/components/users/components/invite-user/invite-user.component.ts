import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Apollo } from 'apollo-angular';
import { Role, User } from '../../../../models/user.model';
import { GetUsersQueryResponse, GET_USERS } from '../../../../graphql/queries';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { PositionAttributeCategory } from '../../../../models/position-attribute-category.model';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER, TAB } from '@angular/cdk/keycodes';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { WhoSnackBarService } from '../../../../services/snackbar.service';

@Component({
  selector: 'who-invite-user',
  templateUrl: './invite-user.component.html',
  styleUrls: ['./invite-user.component.scss']
})
export class WhoInviteUserComponent implements OnInit {

  // === REACTIVE FORM ===
  inviteForm: FormGroup;
  emailCtrl = new FormControl();

  // === DATA ===
  readonly separatorKeysCodes: number[] = [ENTER, COMMA, TAB, ];
  private users: User[];
  public filteredUsers: Observable<User[]>;
  public emails = [];
  public formValues: any;

  @ViewChild('emailInput') emailInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  get email(): string {
    return this.inviteForm.value.email;
  }

  set email(value: string) {
    this.inviteForm.controls.email.setValue(value);
  }

  get positionAttributes(): FormArray {
    return this.inviteForm.get('positionAttributes') ? this.inviteForm.get('positionAttributes') as FormArray : null;
  }

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<WhoInviteUserComponent>,
    private apollo: Apollo,
    private snackBar: WhoSnackBarService,
    @Inject(MAT_DIALOG_DATA) public data: {
      roles: Role[];
      users: [];
      positionAttributeCategories?: PositionAttributeCategory[]
    }
  ) {
  }

  /*  Build the form.
  */
  ngOnInit(): void {
    this.inviteForm = this.formBuilder.group({
      email: [['']],
      role: ['', Validators.required],
      ...this.data.positionAttributeCategories &&
      {
        positionAttributes: this.formBuilder.array(this.data.positionAttributeCategories.map(x => {
          return this.formBuilder.group({
            value: [''],
            category: [x.id, Validators.required]
          });
        }))
      }
    });
    this.apollo.watchQuery<GetUsersQueryResponse>({
      query: GET_USERS
    }).valueChanges.subscribe(res => {
      // filter the users that are not registered in the application
      this.users = res.data.users.filter((u: any) => !this.data.users.find((usr: any) => usr.id === u.id));
      this.filteredUsers = this.emailCtrl.valueChanges.pipe(
        startWith(''),
        map((email: string | null) => email ? this.filter(email) : this.users.slice())
      );
    });

  }

  private filter(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.users ? this.users.filter(x => x.username.toLowerCase().indexOf(filterValue) === 0) : this.users;
  }

  /*  Close the modal without sending data.
  */
  onClose(): void {
    this.dialogRef.close();
  }

  add(event: MatChipInputEvent | any): void {
    // use setTimeout to prevent add input value on focusout
    setTimeout(() => {
      const input = event.type === 'focusout' ? this.emailInput.nativeElement : event.input;
      const value = event.type === 'focusout' ? this.emailInput.nativeElement.value : event.value;

      if ((value || '').trim()) {
        if (!this.data.users.find((email: any) => email.username.toLowerCase() === value.toLocaleString())) {
          this.emails.push(value.trim());
          this.inviteForm.get('email').setValue(this.emails);
        } else {
          this.snackBar.openSnackBar(`${value} already exists on this application`);
        }
      }

      // Reset the input value
      if (input) {
        input.value = '';
      }
    }, event.type === 'focusout' ? 500 : 0);
  }

  remove(email: string): void {
    const index = this.emails.indexOf(email);

    if (index >= 0) {
      this.emails.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.emails.push(event.option.viewValue);
    this.inviteForm.get('email').setValue(this.emails);
    this.emailInput.nativeElement.value = '';
    this.emailCtrl.setValue(null);
  }}
