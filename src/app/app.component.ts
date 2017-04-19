import {
    Component, ViewChild, OnInit, AfterViewInit, ChangeDetectionStrategy, HostListener, ChangeDetectorRef
} from '@angular/core';
import {MdTabGroup, MdSidenav, MdDialog, MdIconRegistry} from '@angular/material';
import {Observable, BehaviorSubject} from 'rxjs/Rx';

import {Symbology} from './layers/symbology/symbology.model';
import {ResultTypes} from './operators/result-type.model';

import {LayoutService} from './layout.service';
import {SidenavContainerComponent} from './sidenav/sidenav-container/sidenav-container.component';

import {ProjectService} from './project/project.service';
import {UserService} from './users/user.service';
import {StorageService} from './storage/storage.service';

import {MapComponent} from './map/map.component';

import {Layer} from './layers/layer.model';
import {LayerService} from './layers/layer.service';
import {SplashDialogComponent} from './dialogs/splash-dialog/splash-dialog.component';
import {PlotListComponent} from './plots/plot-list/plot-list.component';
import {DomSanitizer} from '@angular/platform-browser';
import {RandomColorService} from './util/services/random-color.service';

@Component({
    selector: 'wave-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapComponent) mapComponent: MapComponent;
    @ViewChild(MdTabGroup) bottomTabs: MdTabGroup;

    @ViewChild(MdSidenav) rightSidenav: MdSidenav;
    @ViewChild(SidenavContainerComponent) rightSidenavContainer: SidenavContainerComponent;

    layerListVisible$: Observable<boolean>;
    layerDetailViewVisible$: Observable<boolean>;

    private windowHeight$ = new BehaviorSubject<number>(window.innerHeight);
    middleContainerHeight$: Observable<number>;
    bottomContainerHeight$: Observable<number>;

    layersReverse$: Observable<Array<Layer<Symbology>>>;

    // for ng-switch
    ResultTypes = ResultTypes; // tslint:disable-line:no-unused-variable variable-name
    LayoutService = LayoutService;

    constructor(public layerService: LayerService,
                public layoutService: LayoutService,
                public projectService: ProjectService,
                private userService: UserService,
                private storageService: StorageService,
                private changeDetectorRef: ChangeDetectorRef,
                private dialog: MdDialog,
                private iconRegistry: MdIconRegistry,
                private sanitizer: DomSanitizer,
                private randomColorService: RandomColorService) {
        iconRegistry.addSvgIconInNamespace(
            'vat',
            'logo',
            sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg')
        );

        this.storageService.toString(); // just register

        this.layersReverse$ = this.projectService.getLayerStream()
            .map(layers => layers.slice(0).reverse());

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();
    }

    ngOnInit() {
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
        }
    }

    setTabIndex(index: number) {
        this.layoutService.setLayerDetailViewTabIndex(index);
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    @HostListener('window:resize')
    private windowHeight() {
        this.windowHeight$.next(window.innerHeight);
    }

    @HostListener('window:message', ['$event.data'])
    public handleMessage(message: {type: string}) {
        switch (message.type) {
            case 'TOKEN_LOGIN':
                const tokenMessage = message as {type: string, token: string};
                this.userService.gfbioTokenLogin(tokenMessage.token);
                break;
            default:
            // unhandled message
        }
    }

}
