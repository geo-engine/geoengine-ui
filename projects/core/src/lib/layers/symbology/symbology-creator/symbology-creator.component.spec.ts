import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SymbologyCreatorComponent} from './symbology-creator.component';

describe('SymbologyCreatorComponent', () => {
    let component: SymbologyCreatorComponent;
    let fixture: ComponentFixture<SymbologyCreatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SymbologyCreatorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SymbologyCreatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
