import {Observable, BehaviorSubject, mergeMap} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Inject, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {
    LayoutService,
    NotificationService,
    ProjectService,
    MapService,
    MapContainerComponent,
    SpatialReferenceService,
    SidenavContainerComponent,
} from '@geoengine/core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppConfig} from './app-config.service';
import {ComponentPortal} from '@angular/cdk/portal';
import moment from 'moment';
import {DataSelectionService} from './data-selection.service';
import {EbvSelectorComponent} from './ebv-selector/ebv-selector.component';
import {MatDrawerToggleResult, MatSidenav} from '@angular/material/sidenav';
import {Layer, RandomColorService, Time, UserService} from '@geoengine/common';

@Component({
    selector: 'geoengine-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;

    @ViewChild(MatSidenav, {static: true}) rightSidenav!: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) rightSidenavContainer!: SidenavContainerComponent;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly analysisVisible$ = new BehaviorSubject(false);
    readonly windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    datasetPortal = new ComponentPortal(EbvSelectorComponent);

    constructor(
        @Inject(AppConfig) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        readonly vcRef: ViewContainerRef, // reference used by color picker, MUST BE EXACTLY THIS NAME
        readonly userService: UserService,
        private iconRegistry: MatIconRegistry,
        private _randomColorService: RandomColorService,
        private _notificationService: NotificationService,
        private mapService: MapService,
        private _spatialReferenceService: SpatialReferenceService,
        private sanitizer: DomSanitizer,
    ) {
        this.registerIcons();

        this.layersReverse$ = this.dataSelectionService.layers;
    }

    ngOnInit(): void {
        this.mapService.registerMapComponent(this.mapComponent);

        this.layoutService.getSidenavContentComponentStream().subscribe((sidenavConfig) => {
            this.rightSidenavContainer.load(sidenavConfig);

            let openClosePromise: Promise<MatDrawerToggleResult>;
            if (sidenavConfig) {
                openClosePromise = this.rightSidenav.open();
            } else {
                openClosePromise = this.rightSidenav.close();
            }

            openClosePromise.then(() => this.mapComponent.resize());
        });
    }

    ngAfterViewInit(): void {
        this.reset();
        this.mapComponent.resize();
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    showAnalysis(): void {
        this.analysisVisible$.next(true);
    }

    private reset(): void {
        this.projectService
            .clearLayers()
            .pipe(
                mergeMap(() => this.projectService.clearPlots()),
                mergeMap(() => this.projectService.setTime(new Time(moment.utc()))),
            )
            .subscribe();
    }

    private registerIcons(): void {
        this.iconRegistry.addSvgIconInNamespace(
            'geoengine',
            'logo',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/geoengine-white.svg'),
        );

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));
    }

    @HostListener('window:resize')
    private windowHeight(): void {
        this.windowHeight$.next(window.innerHeight);
    }
}
