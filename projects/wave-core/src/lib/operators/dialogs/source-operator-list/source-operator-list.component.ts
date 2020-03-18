import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {LayoutService, SidenavConfig} from '../../../layout.service';
import {DataRepositoryComponent} from '../data-repository/data-repository.component';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {CsvSourceType} from '../../types/csv-source-type.model';
import {FeaturedbSourceListComponent} from '../featuredb-source-list/featuredb-source-list.component';
import {UserService} from '../../../users/user.service';
import {Subscription} from 'rxjs';
import {OlDrawFeaturesComponent} from '../draw-features/ol-draw-features.component';
import {CountryPolygonSelectionComponent} from '../country-polygon-selection/country-polygon-selection.component';

export interface SourceOperatorListButton {
    name: string;
    description: string;
    icon?: string;
    iconSrc?: string;
    sidenavConfig: SidenavConfig | undefined;
    onlyIfLoggedIn?: boolean;
    onlyIfLoggedOut?: boolean;
}

@Component({
    selector: 'wave-source-operator-list',
    templateUrl: './source-operator-list.component.html',
    styleUrls: ['./source-operator-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceOperatorListComponent implements OnInit, OnDestroy {

    @Input() buttons!: Array<SourceOperatorListButton>;

    public isUserLoggedIn = false;

    private guestUserStreamSubscription: Subscription;

    constructor(private changeDetectorRef: ChangeDetectorRef,
                private layoutService: LayoutService,
                private userService: UserService) {
    }

    ngOnInit() {
        this.guestUserStreamSubscription = this.userService.isGuestUserStream().subscribe(isGuest => {
            this.isUserLoggedIn = !isGuest;
            this.changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy() {
        if (this.guestUserStreamSubscription) {
            this.guestUserStreamSubscription.unsubscribe();
        }
    }

    isShowable(onlyIfLoggedIn?: boolean, onlyIfLoggedOut?: boolean): boolean {
        if (onlyIfLoggedIn && onlyIfLoggedOut) {
            return false;
        } else if (onlyIfLoggedIn) {
            return this.isUserLoggedIn;
        } else if (onlyIfLoggedOut) {
            return !this.isUserLoggedIn;
        } else {
            return true;
        }
    }

    setComponent(sidenavConfig: SidenavConfig) {
        if (!sidenavConfig) {
            return;
        }

        this.layoutService.setSidenavContentComponent(sidenavConfig);
    }

    static createDataRepositoryButton(): SourceOperatorListButton {
        return {
            name: 'Data Repository',
            description: 'Generic data repository',
            iconSrc: RasterSourceType.ICON_URL,
            sidenavConfig: {component: DataRepositoryComponent, keepParent: true},
        };
    }

    static createDrawFeaturesButton(): SourceOperatorListButton {
        return {
            name: 'Draw Features',
            description: 'Draw features on the map',
            icon: 'create',
            sidenavConfig: {component: OlDrawFeaturesComponent, keepParent: true},
        };
    }

    static createCustomFeaturesButtons(): [SourceOperatorListButton, SourceOperatorListButton] {
        return [
            {
                name: 'Custom Features',
                description: 'Add and use custom vector features like CSV',
                iconSrc: CsvSourceType.ICON_URL,
                sidenavConfig: {component: FeaturedbSourceListComponent, keepParent: true},
                onlyIfLoggedIn: true,
            },
            {
                name: 'Custom Features',
                description: 'Log in to use custom vector data from, e.g., CSV files',
                iconSrc: CsvSourceType.ICON_URL,
                sidenavConfig: undefined,
                onlyIfLoggedOut: true,
            },
        ];
    }

    static createCountryPolygonsButton(): SourceOperatorListButton {
        return {
            name: 'Country Selection',
            description: 'Select country borders',
            icon: 'location_on',
            sidenavConfig: {component: CountryPolygonSelectionComponent, keepParent: true},
        };
    }
}
