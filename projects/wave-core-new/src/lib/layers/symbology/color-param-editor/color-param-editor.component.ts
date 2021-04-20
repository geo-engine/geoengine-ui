import {Component, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, OnInit} from '@angular/core';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'wave-color-param-editor',
    templateUrl: 'color-param-editor.component.html',
    styleUrls: ['color-param-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorParamEditorComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {
    // TODO: ControlValueAccessor

    constructor() {}

    ngOnChanges(_changes: SimpleChanges): void {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {}

    ngOnDestroy(): void {}
}
