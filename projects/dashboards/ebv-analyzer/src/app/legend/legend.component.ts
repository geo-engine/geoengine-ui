import {
    Component,
    ChangeDetectionStrategy,
    Input,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef,
    ViewChild,
    AfterViewInit,
    OnDestroy,
} from '@angular/core';
import {RasterLayer} from '@geoengine/common';
import {RasterLegendComponent} from '@geoengine/core';
import {Subscription} from 'rxjs';

@Component({
    selector: 'geoengine-legend', // eslint-disable-line @angular-eslint/component-selector
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() layer?: RasterLayer = undefined;

    @ViewChild(RasterLegendComponent) rasterLegendComponent!: RasterLegendComponent;

    private subscription?: Subscription;

    constructor(readonly changeDetectorRef: ChangeDetectorRef) {}

    ngAfterViewInit(): void {
        this.subscription = this.rasterLegendComponent.selectedBand$.subscribe((_) => {
            console.log('ebv legend changes');
            this.changeDetectorRef.detectChanges();
        });
    }

    ngOnChanges(_changes: SimpleChanges): void {
        this.changeDetectorRef.markForCheck();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
