import {Subscription, Observable, combineLatest, of as observableOf} from 'rxjs';
import {Component, OnInit, ChangeDetectionStrategy, OnDestroy, Input, ChangeDetectorRef} from '@angular/core';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {ThemePalette} from '@angular/material/core';
import {distinctUntilChanged, map, mergeScan} from 'rxjs/operators';
import {UserService} from '../../users/user.service';
import {LoginComponent} from '../../users/login/login.component';
import {Config} from '../../config.service';

export interface NavigationButton {
    sidenavConfig: SidenavConfig;
    icon: string;
    svgIcon?: string;
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

        if (this.sidenavConfig.component === sidenavConfig.component || this.sidenavConfig.parent === sidenavConfig.component) {
            return 'primary';
        } else {
            return undefined;
        }
    }

    static createLoginButton(userService: UserService,
                             layoutService: LayoutService,
                             config: Config,
                             loginSidenavConfig?: SidenavConfig): NavigationButton {
        loginSidenavConfig = loginSidenavConfig ? loginSidenavConfig : {component: LoginComponent};
        return {
            sidenavConfig: loginSidenavConfig,
            icon: '',
            iconObservable: userService.isGuestUserStream().pipe(map(isGuest => isGuest ? 'person_outline' : 'person')),
            tooltip: '',
            tooltipObservable: userService.isGuestUserStream().pipe(map(isGuest => isGuest ? 'Login' : 'User Account')),
            colorObservable: combineLatest([
                userService.isGuestUserStream(),
                layoutService.getSidenavContentComponentStream(),
            ]).pipe(
                distinctUntilChanged(),
                mergeScan( // abort inner observable when new source event arises
                    ([wasGuest, state], [isGuest, sidenavConfig], _index) => {
                        if (sidenavConfig && sidenavConfig.component === loginSidenavConfig.component) {
                            return observableOf([isGuest, 'primary']);
                        } else if (!wasGuest && isGuest) { // show 'accent' color for some time
                            return new Observable(observer => {
                                observer.next([isGuest, 'accent']);
                                setTimeout(
                                    () => {
                                        observer.next([isGuest, undefined]);
                                        observer.complete();
                                    },
                                    config.DELAYS.GUEST_LOGIN_HINT,
                                );
                            });
                        } else {
                            return observableOf([isGuest, undefined]);
                        }
                    },
                    [true, 'accent' as ThemePalette]
                ),
                map(([_wasGuest, state]) => state as ThemePalette),
            ),
        };
    }

}
