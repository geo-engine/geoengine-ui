import {Subscription, BehaviorSubject, Observable} from 'rxjs';
import {Component, OnInit, ChangeDetectionStrategy, Type, OnDestroy, Input, ChangeDetectorRef} from '@angular/core';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {ThemePalette} from '@angular/material/core';

export interface NavigationButton {
    sidenavConfig: SidenavConfig;
    icon: string;
    tooltip: string;
    colorObservable?: Observable<ThemePalette>;
    iconObservable?: Observable<string>;
    tooltipObservable?: Observable<string>;
}

@Component({
    selector: 'wave-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit, OnDestroy {

    @Input() buttons: Array<NavigationButton>;

    private sidenavConfig: SidenavConfig;
    private sidenavConfigSubscription: Subscription;

    constructor(private layoutService: LayoutService,
                private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.sidenavConfigSubscription = this.layoutService.getSidenavContentComponentStream().subscribe(sidenavConfig => {
            this.sidenavConfig = sidenavConfig;
            this.changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy() {
        if (this.sidenavConfigSubscription) {
            this.sidenavConfigSubscription.unsubscribe();
        }
    }

    setComponent(sidenavConfig: SidenavConfig) {
        this.layoutService.setSidenavContentComponent(sidenavConfig);
    }

    buttonColor(sidenavConfig: SidenavConfig): ThemePalette {
        if (!sidenavConfig || !this.sidenavConfig) {
            return undefined;
        }

        if (sidenavConfig.component === this.sidenavConfig.component || sidenavConfig.parent === this.sidenavConfig.component) {
            return 'primary';
        } else {
            return undefined;
        }
    }

}
