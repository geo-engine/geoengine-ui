import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ColorPaletteEditorComponent} from './color-palette-editor.component';

describe('ColorPaletteEditorComponent', () => {
    let component: ColorPaletteEditorComponent;
    let fixture: ComponentFixture<ColorPaletteEditorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ColorPaletteEditorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ColorPaletteEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
