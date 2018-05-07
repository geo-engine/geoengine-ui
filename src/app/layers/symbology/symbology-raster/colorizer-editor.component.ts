import {Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, OnChanges, SimpleChanges} from '@angular/core';

import {MappingRasterColorizer, MappingRasterColorizerBreakpoint} from '../symbology.model';
import {FormBuilder, FormGroup, Validators, FormArray} from '@angular/forms';
import { FormControl } from '@angular/forms/src/model';


@Component({
    selector: 'wave-colorizer-editor',
    templateUrl: 'colorizer-editor.component.html',
    styleUrls: ['colorizer-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorizerEditorComponent implements OnInit, OnChanges {

    // the colorizer form
    colorizerForm: FormGroup;
    _colorizer: MappingRasterColorizer;

    @Input()
    set colorizer(colorizer: MappingRasterColorizer) {
        this._colorizer = colorizer;
    }
    get colorizer(): MappingRasterColorizer {
        return this._colorizer;
    }

    @Output('colorizerChanged') colorizerChanged: EventEmitter<MappingRasterColorizer> =
        new EventEmitter<MappingRasterColorizer>();

    // TODO: move color code to util class
    static rgbaLikeToString(rgba: { r: number, g: number, b: number, a?: number }) {
        const a = (rgba.a === undefined || rgba.a === null) ? 1.0 : (rgba.a / 255) ;
        const clrString = 'rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + a + ')';
        return clrString;
    }

    static rgbaStringToDict(rgbaString: string): {r: number, g: number, b: number, a: number} {
        let rgba =
            rgbaString.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i)
            || rgbaString.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
            || rgbaString.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (rgba) {
            const a = (rgba[4] === undefined || rgba[4] === null) ? 255 : parseFloat(rgba[4]) * 255;
            return {
                r: parseInt(rgba[1], 10),
                g: parseInt(rgba[2], 10),
                b: parseInt(rgba[3], 10),
                a: a
            };
        } else {
            return {r: 0, g: 0, b: 0, a: 1.0}
        }
    }

    constructor(private formBuilder: FormBuilder) {
    }

    ngOnInit() {
        this.rebuildForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.rebuildForm();
    }

    rebuildForm() {
        this.colorizerForm = this.formBuilder.group({
            colorizerEntries: this.formBuilder.array(
                this.colorizer.breakpoints.map(brk => this.createColorizerEntry(brk))
            ),
            colorizerType: [this.colorizer.type , Validators.required],
        });
        /*
        this.colorizerForm.valueChanges.subscribe(stat => {
            console.log('colorizerForm.statusChanges', stat);
            this.colorFormToColorizer();
        })
        */
    }

    updateColorizer(_event) {
        const colorizer = this.colorFormToColorizer();
        this._colorizer = colorizer;
        this.colorizerChanged.next(colorizer);
    }

    colorFormToColorizer(): MappingRasterColorizer {
        const brks = (<Array<{color: string, value: number, name: string}>>(
            <FormArray>this.colorizerForm.controls['colorizerEntries']).value
        ).map(ctrl => {
            const rgba = ColorizerEditorComponent.rgbaStringToDict(ctrl.color);
            return {
                r: rgba.r,
                g: rgba.g,
                b: rgba.b,
                a: rgba.a,
                value: ctrl.value,
                name: ctrl.name
            };
        });

        const type = this.colorizerForm.controls['colorizerType'].value;
        return new MappingRasterColorizer({
            breakpoints: brks,
            type: type,
        });
    }


    createColorizerEntry(brk: MappingRasterColorizerBreakpoint) {
        const clrString = ColorizerEditorComponent.rgbaLikeToString(brk);

        const grp = this.formBuilder.group({
            color: [clrString, Validators.required],
            value: [brk.value, Validators.required],
            name: [brk.name]
        });
        return grp;
    }

    createNewColorizerEntry() {
        return this.formBuilder.group({
            color: ['rgba(0,0,0,1)', Validators.required],
            value: [0, Validators.required],
            name: ['']
        });
    }

    addNewRow() {
        const control = <FormArray>this.colorizerForm.controls['colorizerEntries'];
        control.push(this.createNewColorizerEntry());
    }

    addRow(index: number) {
        const control = <FormArray>this.colorizerForm.controls['colorizerEntries'];
        control.insert(index + 1, this.createColorizerEntry(this._colorizer.breakpoints[index]));
    }

    deleteRow(index: number) {
        const control = <FormArray>this.colorizerForm.controls['colorizerEntries'];
        control.removeAt(index);
    }
}
