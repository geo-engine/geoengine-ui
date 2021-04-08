import {Subscription, Observable, combineLatest, of as observableOf} from 'rxjs';
import {Component, OnInit, ChangeDetectionStrategy, OnDestroy, Input, ChangeDetectorRef} from '@angular/core';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {ThemePalette} from '@angular/material/core';
import {distinctUntilChanged, map, mergeScan} from 'rxjs/operators';
import {UserService} from '../../users/user.service';
import {LoginComponent} from '../../users/login/login.component';
import {Config} from '../../config.service';
import {SidenavRef} from '../sidenav-ref.service';

/**
 * Button config for the sidenav navigation
 *
 * The icon can be a name or an svg image.
 * Furthermore, there is the option to define observables that specify icon as well as color
 * upon user-defined events.
 */
export interface NavigationButton {
    sidenavConfig: SidenavConfig;
    icon: string;
    svgIcon?: string;
    tooltip: string;
    colorObservable?: Observable<ThemePalette>;
    iconObservable?: Observable<string>;
    tooltipObservable?: Observable<string>;
}

/**
 * This component lists all buttons for the sidenav navigation.
 */
@Component({
    selector: 'wave-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit, OnDestroy {
    /**
     * The navigation shows this array of buttons.
     */
    @Input() buttons!: Array<NavigationButton>;

    private sidenavConfig?: SidenavConfig;
    private sidenavConfigSubscription?: Subscription;

    /**
     * DI for services
     */
    constructor(private layoutService: LayoutService, private sidenavRef: SidenavRef, private changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.sidenavConfigSubscription = this.layoutService.getSidenavContentComponentStream().subscribe((sidenavConfig) => {
            this.sidenavConfig = sidenavConfig;
            this.changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        if (this.sidenavConfigSubscription) {
            this.sidenavConfigSubscription.unsubscribe();
        }
    }

    /**
     * Load a component into the sidenav
     */
    setComponent(sidenavConfig: SidenavConfig): void {
        this.layoutService.setSidenavContentComponent(sidenavConfig);
    }

    /**
     * Map the sidenavConfig to a theme palette color for the button
     */
    buttonColor(sidenavConfig: SidenavConfig): ThemePalette {
        if (!sidenavConfig || !this.sidenavConfig) {
            return undefined;
        }

        const currentComponent = this.sidenavConfig.component;
        const parentComponent = this.sidenavRef.getBackButtonComponent()?.component;
        if (currentComponent === sidenavConfig.component || parentComponent === sidenavConfig.component) {
            return 'primary';
        } else {
            return undefined;
        }
    }

    /**
     * Default constructor for a login button in the navigation.
     */
    static createLoginButton(
        userService: UserService,
        layoutService: LayoutService,
        config: Config,
        loginSidenavConfig?: SidenavConfig,
    ): NavigationButton {
        loginSidenavConfig = loginSidenavConfig ? loginSidenavConfig : {component: LoginComponent};
        return {
            sidenavConfig: loginSidenavConfig,
            icon: '',
            iconObservable: userService.isGuestUserStream().pipe(map((isGuest) => (isGuest ? 'person_outline' : 'person'))),
            tooltip: '',
            tooltipObservable: userService.isGuestUserStream().pipe(map((isGuest) => (isGuest ? 'Login' : 'User Account'))),
            colorObservable: combineLatest([userService.isGuestUserStream(), layoutService.getSidenavContentComponentStream()]).pipe(
                distinctUntilChanged(),
                mergeScan<[boolean, SidenavConfig], [boolean, string | undefined]>(
                    // abort inner observable when new source event arises
                    ([wasGuest, _state], [isGuest, sidenavConfig], _index) => {
                        if (sidenavConfig && loginSidenavConfig && sidenavConfig.component === loginSidenavConfig.component) {
                            return observableOf([isGuest, 'primary']);
                        } else if (!wasGuest && isGuest) {
                            // show 'accent' color for some time
                            return new Observable((observer) => {
                                observer.next([isGuest, 'accent']);
                                setTimeout(() => {
                                    observer.next([isGuest, undefined]);
                                    observer.complete();
                                }, config.DELAYS.GUEST_LOGIN_HINT);
                            });
                        } else {
                            return observableOf([isGuest, undefined]);
                        }
                    },
                    [true, 'accent' as ThemePalette],
                ),
                map(([_wasGuest, state]) => state as ThemePalette),
            ),
        };
    }
}
