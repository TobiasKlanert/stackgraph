import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailPanel } from './detail-panel';
import { ServiceNode } from '../../../core/models/compose.model';

describe('DetailPanel', () => {
  let component: DetailPanel;
  let fixture: ComponentFixture<DetailPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailPanel);
    component = fixture.componentInstance;

    const mockService: ServiceNode = {
      name: 'test',
      ports: [],
      dependsOn: [],
      networks: [],
      volumes: [],
    };

    fixture.componentRef.setInput('service', mockService);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
