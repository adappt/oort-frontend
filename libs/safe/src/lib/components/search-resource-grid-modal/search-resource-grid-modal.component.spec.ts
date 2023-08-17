import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DialogModule as DialogCdkModule,
  DialogRef,
  DIALOG_DATA,
} from '@angular/cdk/dialog';
import { SafeResourceGridModalComponent } from './search-resource-grid-modal.component';
import { TranslateModule } from '@ngx-translate/core';

describe('ResourceTableModalComponent', () => {
  let component: SafeResourceGridModalComponent;
  let fixture: ComponentFixture<SafeResourceGridModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: DialogRef, useValue: {} },
        {
          provide: DIALOG_DATA,
          useValue: { gridSettings: { sort: { field: [] } } },
        },
        { provide: 'environment', useValue: {} },
      ],
      imports: [
        SafeResourceGridModalComponent,
        DialogCdkModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SafeResourceGridModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
