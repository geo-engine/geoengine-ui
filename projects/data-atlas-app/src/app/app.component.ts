import {Observable, BehaviorSubject, Subject, ReplaySubject} from 'rxjs';
import {map} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostListener,
    Inject,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconRegistry} from '@angular/material/icon';
import {MatSidenav} from '@angular/material/sidenav';
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
    RasterLayer,
} from 'wave-core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {AppConfig} from './app-config.service';
import {MockLayersComponent} from './mock-layers/mock-layers.component';
import {ComponentPortal} from '@angular/cdk/portal';

@Component({
    selector: 'wave-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent: MapContainerComponent;
    @ViewChild(MatSidenav, {static: true}) sidenav: MatSidenav;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly selectedLayer$: Observable<RasterLayer>;
    readonly analysisVisible$ = new BehaviorSubject(false);
    readonly windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    datasetPortal: ComponentPortal<MockLayersComponent>;

    constructor(@Inject(Config) readonly config: AppConfig,
                readonly layoutService: LayoutService,
                readonly projectService: ProjectService,
                readonly _vcRef: ViewContainerRef, // reference used by color picker
                private userService: UserService,
                private changeDetectorRef: ChangeDetectorRef,
                private dialog: MatDialog,
                private iconRegistry: MatIconRegistry,
                private randomColorService: RandomColorService,
                private activatedRoute: ActivatedRoute,
                private notificationService: NotificationService,
                private mapService: MapService,
                private sanitizer: DomSanitizer) {
        this.registerIcons();

        this.layersReverse$ = this.projectService.getLayerStream().pipe(
            map(layers => layers.slice(0).reverse()),
        );
        this.selectedLayer$ = this.layersReverse$.pipe(
            map(layers => {
                if ((layers.length === 0) || !(layers[0] instanceof RasterLayer)) {
                    return undefined;
                }
                return layers[0] as RasterLayer;
            }),
        );
    }

    private registerIcons() {
        this.iconRegistry.addSvgIconInNamespace(
            'geoengine',
            'logo',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/geoengine-white.svg'),
        );

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));
    }

    ngOnInit() {
        this.mapService.registerMapComponent(this.mapComponent);
    }

    ngAfterViewInit() {
    }

    @HostListener('window:resize')
    private windowHeight() {
        this.windowHeight$.next(window.innerHeight);
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    openDataMenu() {
        this.datasetPortal = new ComponentPortal(MockLayersComponent);
        this.sidenav.open();
    }

    showAnalysis() {
        this.analysisVisible$.next(true);
    }
}
