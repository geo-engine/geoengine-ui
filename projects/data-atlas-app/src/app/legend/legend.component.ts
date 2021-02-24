import {Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import {RasterLayer} from 'wave-core';

@Component({
    selector: 'wave-legend', // tslint:disable-line:component-selector
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent implements OnInit, OnChanges {
    @Input() layer: RasterLayer = undefined;

    constructor(readonly changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.changeDetectorRef.markForCheck();
    }

    ngOnInit(): void {
    }

}
