import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    OnInit,
    ViewChild
} from '@angular/core';
import {MatDialog, MatIconRegistry, MatSidenav, MatTabGroup} from '@angular/material';
import {BehaviorSubject, Observable} from 'rxjs/Rx';

import {
    AbstractVectorSymbology,
    ClusteredPointSymbology,
    SimpleVectorSymbology,
    Symbology
} from './layers/symbology/symbology.model';
import {ResultTypes} from './operators/result-type.model';

import {LayoutService} from './layout.service';
import {SidenavContainerComponent} from './sidenav/sidenav-container/sidenav-container.component';

import {ProjectService} from './project/project.service';
import {UserService} from './users/user.service';
import {StorageService, StorageStatus} from './storage/storage.service';

import {MapComponent} from './map/map.component';

import {Layer, VectorLayer} from './layers/layer.model';
import {LayerService} from './layers/layer.service';
import {SplashDialogComponent} from './dialogs/splash-dialog/splash-dialog.component';
import {PlotListComponent} from './plots/plot-list/plot-list.component';
import {DomSanitizer} from '@angular/platform-browser';
import {RandomColorService} from './util/services/random-color.service';
import {ActivatedRoute} from '@angular/router';
import {NotificationService} from './notification.service';
import {
    WorkflowParameterChoiceDialogComponent
} from './project/workflow-parameter-choice-dialog/workflow-parameter-choice-dialog.component';
import {MappingQueryService} from './queries/mapping-query.service';
import {
    GroupedAbcdBasketResultComponent
} from './operators/dialogs/baskets/grouped-abcd-basket-result/grouped-abcd-basket-result.component';
import {
    BasketResult,
    IBasketGroupedAbcdResult,
    IBasketPangaeaResult
} from './operators/dialogs/baskets/gfbio-basket.model';
import {PangaeaBasketResultComponent} from './operators/dialogs/baskets/pangaea-basket-result/pangaea-basket-result.component';
import {UnexpectedResultType} from './util/errors';
import {Operator} from './operators/operator.model';
import {Config} from './config.service';
import {OverlayContainer} from '@angular/cdk/overlay';
import {MapService} from './map/map.service';

@Component({
    selector: 'wave-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapComponent) mapComponent: MapComponent;
    @ViewChild(MatTabGroup) bottomTabs: MatTabGroup;

    @ViewChild(MatSidenav) rightSidenav: MatSidenav;
    @ViewChild(SidenavContainerComponent) rightSidenavContainer: SidenavContainerComponent;

    layerListVisible$: Observable<boolean>;
    layerDetailViewVisible$: Observable<boolean>;
    middleContainerHeight$: Observable<number>;
    bottomContainerHeight$: Observable<number>;
    layersReverse$: Observable<Array<Layer<Symbology>>>;
    // for ng-switch
    ResultTypes = ResultTypes; // tslint:disable-line:no-unused-variable variable-name
    LayoutService = LayoutService;

    private windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    constructor(public layerService: LayerService,
                public layoutService: LayoutService,
                public projectService: ProjectService,
                private userService: UserService,
                private storageService: StorageService,
                private changeDetectorRef: ChangeDetectorRef,
                private dialog: MatDialog,
                private iconRegistry: MatIconRegistry,
                private sanitizer: DomSanitizer,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                private activatedRoute: ActivatedRoute,
                private notificationService: NotificationService,
                private mapService: MapService,
                public config: Config,
                private elementRef: ElementRef,
                private overlayContainer: OverlayContainer) {
        iconRegistry.addSvgIconInNamespace(
            'vat',
            'logo',
            sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg')
        );

        iconRegistry.addSvgIconInNamespace(
            'geobon',
            'logo',
            sanitizer.bypassSecurityTrustResourceUrl('assets/geobon-logo.svg')
        );

        this.storageService.toString(); // just register

        this.layersReverse$ = this.projectService.getLayerStream()
            .map(layers => layers.slice(0).reverse());

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();

        this.setTheme(this.config.PROJECT);
    }

    ngOnInit() {
        this.mapService.registerMapComponent(this.mapComponent);
        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(this.windowHeight$)
            .do(() => this.mapComponent.resize());
        this.bottomContainerHeight$ = this.layoutService.getLayerDetailViewStream(this.windowHeight$);
    }

    ngAfterViewInit() {
        this.layoutService.getSidenavContentComponentStream().subscribe(sidenavConfig => {
            this.rightSidenavContainer.load(sidenavConfig);
            if (sidenavConfig) {
                this.rightSidenav.open();
            } else {
                this.rightSidenav.close();
            }
        });
        this.projectService.getNewPlotStream()
            .subscribe(() => this.layoutService.setSidenavContentComponent({component: PlotListComponent}));

        // set the stored tab index
        this.layoutService.getLayerDetailViewTabIndexStream().subscribe(tabIndex => {
            if (this.bottomTabs.selectedIndex !== tabIndex) {
                this.bottomTabs.selectedIndex = tabIndex;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            }
        });

        // show splash screen
        if (this.userService.shouldShowIntroductoryPopup()) {
            setTimeout(() => {
                this.dialog.open(SplashDialogComponent, {});
            });
        }

        // notify window parent that this component is ready
        if (parent !== window) {
            parent.postMessage({
                type: 'STATUS',
                status: 'READY',
            }, '*');
        } else {

            // handle query parameters directly if it is not embedded and using an auto login
            this.handleWorkflowParameters();

        }
    }

    setTabIndex(index: number) {
        this.layoutService.setLayerDetailViewTabIndex(index);
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    @HostListener('window:message', ['$event.data'])
    public handleMessage(message: { type: string }) {
        switch (message.type) {
            case 'TOKEN_LOGIN':
                const tokenMessage = message as { type: string, token: string };
                this.userService.gfbioTokenLogin(tokenMessage.token).subscribe(() => {
                    this.storageService.getStatus()
                        .filter(status => status === StorageStatus.OK)
                        .first()
                        .subscribe(() => {
                            this.handleWorkflowParameters();
                        });
                });
                break;
            default:
            // unhandled message
        }
    }

    @HostListener('window:resize')
    private windowHeight() {
        this.windowHeight$.next(window.innerHeight);
    }

    private handleWorkflowParameters() {
        this.activatedRoute.queryParams.subscribe(p => {
            for (const parameter of Object.keys(p)) {
                const value = p[parameter];
                switch (parameter) {
                    case 'workflow':
                        try {
                            const newLayer = Layer.fromDict(JSON.parse(value));
                            this.projectService.getProjectStream().first().subscribe(project => {
                                if (project.layers.length > 0) {
                                    // show popup
                                    this.dialog.open(WorkflowParameterChoiceDialogComponent, {data: {layers: [newLayer]}});
                                } else {
                                    // just add the layer if the layer array is empty
                                    this.projectService.addLayer(newLayer);
                                }
                            });
                        } catch (error) {
                            this.notificationService.error(`Invalid Workflow: »${error}«`);
                        }
                        break;
                    case 'gfbioBasketId':
                        try {
                            const gfbioBasketId: number = JSON.parse(value);
                            this.projectService.getProjectStream().first().subscribe(project => {
                                this.gfbioBasketIdToLayers(gfbioBasketId)
                                    .subscribe((layers: Array<VectorLayer<AbstractVectorSymbology>>) => {
                                            if (project.layers.length > 0) {
                                                // show popup
                                                this.dialog.open(WorkflowParameterChoiceDialogComponent, {data: {layers: layers}});
                                            } else {
                                                // just add the layer if the layer array is empty
                                                layers.forEach(layer => this.projectService.addLayer(layer));
                                            }
                                        },
                                        error => {
                                            this.notificationService.error(`GFBio Basket Loading Error: »${error}«`);
                                        },
                                    );
                            });
                        } catch (error) {
                            this.notificationService.error(`Invalid Workflow: »${error}«`);
                        }
                        break;
                    default:
                        this.notificationService.error(`Unknown URL Parameter »${parameter}«`);
                }
            }
        });
    }

    private gfbioBasketIdToLayers(basketId: number): Observable<Array<VectorLayer<AbstractVectorSymbology>>> {
        return this.mappingQueryService
            .getGFBioBasket(basketId)
            .flatMap(basket => Observable
                .from(basket.results)
                .flatMap(result => this.gfbioBasketResultToLayer(result))
                .toArray());
    }

    private gfbioBasketResultToLayer(result: BasketResult): Observable<VectorLayer<AbstractVectorSymbology>> {
        let operator$: Observable<Operator>;
        if (result.type === 'abcd_grouped') {
            operator$ = this.userService
                .getSourceSchemaAbcd()
                .map(sourceSchema => GroupedAbcdBasketResultComponent.createOperatorFromGroupedABCDData(
                    result as IBasketGroupedAbcdResult,
                    sourceSchema,
                    true
                ));
        } else if (result.type === 'pangaea') {
            operator$ = Observable.of(
                PangaeaBasketResultComponent.createOperatorFromPangaeaData(result as IBasketPangaeaResult)
            );
        }

        return operator$.map(operator => {
            let clustered = false;
            let symbology;

            switch (operator.resultType) {
                case ResultTypes.POINTS:
                    symbology = new ClusteredPointSymbology({
                        fillRGBA: this.randomColorService.getRandomColor(),
                    });
                    clustered = true;
                    break;
                case ResultTypes.POLYGONS:
                    symbology = new SimpleVectorSymbology({
                        fillRGBA: this.randomColorService.getRandomColor(),
                    });
                    break;
                default:
                    throw new UnexpectedResultType();
            }

            return new VectorLayer({
                name: result.title,
                operator: operator,
                symbology: symbology,
                clustered: clustered,
            });
        });
    }

    private setTheme(project: 'GFBio' | 'IDESSA' | 'GeoBon') {
        const defaultTheme = 'default-theme';
        const geoBonTheme = 'geobon-theme';
        const allThemes = [defaultTheme, geoBonTheme];

        for (const theme of allThemes) {
            this.elementRef.nativeElement.classList.remove(theme);
            this.overlayContainer.getContainerElement().classList.remove(theme);
        }

        switch (project) {
            case 'GeoBon':
                this.elementRef.nativeElement.classList.add(geoBonTheme);
                this.overlayContainer.getContainerElement().classList.add(geoBonTheme);
                break;
            case 'GFBio':
            case 'IDESSA':
            default:
                this.elementRef.nativeElement.classList.add(defaultTheme);
                this.overlayContainer.getContainerElement().classList.add(defaultTheme);
        }
    }
}
