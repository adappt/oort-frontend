import { TestBed } from '@angular/core/testing';
import { SafeFormBuilderService } from './form-builder.service';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

describe('SafeFormBuilderService', () => {
  let service: SafeFormBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: 'environment', useValue: {} }],
      imports: [
        ApolloTestingModule,
        HttpClientModule,
        TranslateModule.forRoot(),
      ],
    });
    service = TestBed.inject(SafeFormBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
