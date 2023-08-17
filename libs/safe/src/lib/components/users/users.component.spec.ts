import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogModule as DialogCdkModule } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { SafeUsersComponent } from './users.component';
import { ButtonModule, IconModule, MenuModule } from '@oort-front/ui';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SafeSkeletonTableModule } from '../skeleton/skeleton-table/skeleton-table.module';
import { FormsModule } from '@angular/forms';

describe('SafeUsersComponent', () => {
  let component: SafeUsersComponent;
  let fixture: ComponentFixture<SafeUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: 'environment', useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
          },
        },
      ],
      declarations: [SafeUsersComponent],
      imports: [
        HttpClientModule,
        ApolloTestingModule,
        DialogCdkModule,
        FormsModule,
        IconModule,
        ButtonModule,
        SafeSkeletonTableModule,
        TranslateModule.forRoot(),
        MenuModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SafeUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
