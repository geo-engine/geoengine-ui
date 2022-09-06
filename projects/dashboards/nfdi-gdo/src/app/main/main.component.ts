import {Observable, BehaviorSubject} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Inject, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {
    Layer,
    LayoutService,
    UserService,
    RandomColorService,
    NotificationService,
    Config,
    ProjectService,
    MapService,
    MapContainerComponent,
    SpatialReferenceService,
} from '@geoengine/core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppConfig} from '../app-config.service';
import {ComponentPortal} from '@angular/cdk/portal';
import {DataSelectionService} from '../data-selection.service';
import {SpeciesSelectorComponent} from '../species-selector/species-selector.component';

@Component({
    selector: 'geoengine-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    datasetPortal = new ComponentPortal(SpeciesSelectorComponent);

    constructor(
        @Inject(Config) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        readonly _vcRef: ViewContainerRef, // reference used by color picker
        readonly userService: UserService,
        private iconRegistry: MatIconRegistry,
        private _randomColorService: RandomColorService,
        private _notificationService: NotificationService,
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

        // zoom to Germany
        setTimeout(() => this.mapComponent.zoomTo([5.98865807458, 47.3024876979, 15.0169958839, 54.983104153]), 1000);
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
