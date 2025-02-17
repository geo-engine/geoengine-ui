import {Observable, BehaviorSubject, first} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Inject, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {LayoutService, ProjectService, MapService, MapContainerComponent, SpatialReferenceService, WEB_MERCATOR} from '@geoengine/core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppConfig} from '../app-config.service';
import {ComponentPortal} from '@angular/cdk/portal';
import {DataSelectionService} from '../data-selection.service';
import {SpeciesSelectorComponent} from '../species-selector/species-selector.component';
import {Layer, RandomColorService, UserService} from '@geoengine/common';

@Component({
    selector: 'geoengine-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class MainComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    datasetPortal = new ComponentPortal(SpeciesSelectorComponent);

    constructor(
        @Inject(AppConfig) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        readonly _vcRef: ViewContainerRef, // reference used by color picker
        readonly userService: UserService,
        private iconRegistry: MatIconRegistry,
        private _randomColorService: RandomColorService,
        private mapService: MapService,
        private _spatialReferenceService: SpatialReferenceService,
        private sanitizer: DomSanitizer,
    ) {
        this.layersReverse$ = this.dataSelectionService.layers;
    }

    ngOnInit(): void {
        this.mapService.registerMapComponent(this.mapComponent);
        this.reset();
    }

    ngAfterViewInit(): void {
        // this.reset();
        this.mapComponent.resize();

        // change projection to web mercator if for whatever reasons it is a different one
        this.projectService
            .getSpatialReferenceStream()
            .pipe(first())
            .subscribe({
                next: (spatialReference) => {
                    if (spatialReference.equals(WEB_MERCATOR.spatialReference)) {
                        return;
                    }

                    this.projectService.setSpatialReference(WEB_MERCATOR.spatialReference);
                },
            });
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    private reset(): void {
        this.projectService.clearLayers();
        this.projectService.clearPlots();
        // this.projectService.setTime(new Time(moment.utc()));
    }

    @HostListener('window:resize')
    private windowHeight(): void {
        this.windowHeight$.next(window.innerHeight);
    }
}
