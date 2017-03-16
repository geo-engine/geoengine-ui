import {Component, OnInit, ChangeDetectionStrategy, Type, OnDestroy} from '@angular/core';
import {LayoutService} from '../../layout.service';
import {SourceOperatorListComponent} from '../../operators/dialogs/source-operator-list/source-operator-list.component';
import {OperatorRepositoryComponent} from '../../../components/operator-repository.component';
import {LoginComponent} from '../../users/login/login.component';
import {HelpComponent} from '../../help.component';
import {TimeConfigComponent} from '../../time-config/time-config.component';
import {PlotListComponent} from '../../plots/plot-list/plot-list.component';
import {WorkspaceSettingsComponent} from '../../project/workspace-settings/workspace-settings.component';
import {UserService} from '../../users/user.service';
import {Subscription, BehaviorSubject} from 'rxjs/Rx';
import {Config} from '../../config.service';

@Component({
    selector: 'wave-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationComponent implements OnInit, OnDestroy {

    // make available
    SourceOperatorListComponent = SourceOperatorListComponent;
    OperatorRepositoryComponent = OperatorRepositoryComponent;
    LoginComponent = LoginComponent;
    HelpComponent = HelpComponent;
    TimeConfigComponent = TimeConfigComponent;
    PlotListComponent = PlotListComponent;
    WorkspaceSettingsComponent = WorkspaceSettingsComponent;
    //

    loginColor$ = new BehaviorSubject<'default' | 'primary' | 'accent'>('default');

    private subscriptions: Array<Subscription> = [];

    constructor(public layoutService: LayoutService,
                public userService: UserService,
                private config: Config) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.userService.isGuestUserStream()
                .distinctUntilChanged()
                .filter(isGuest => isGuest)
                .filter(() => this.loginColor$.getValue() === 'default')
                .subscribe(() => {
                    this.loginColor$.next('accent');
                    setTimeout(
                        () => this.loginColor$.next(this.loginColor$.getValue() === 'accent' ? 'default' : 'primary'),
                        this.config.DELAYS.GUEST_LOGIN_HINT
                    );
                })
        );

        this.subscriptions.push(
            this.layoutService.getSidenavContentComponentStream()
                .map(([component, parent]) => component)
                .subscribe(component => {
                    if (component === LoginComponent) {
                        this.loginColor$.next('primary');
                    } else if (this.loginColor$.getValue() === 'primary') {
                        this.loginColor$.next('default');
                    }
                })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    buttonColor(componentSelection: [Type<Component>, Type<Component>], component: Type<Component>): 'default' | 'primary' | 'accent' {
        if (!componentSelection) {
            return 'default';
        }

        const [selectedComponent, backButtonComponent] = componentSelection;
        if (selectedComponent === component || backButtonComponent === component) {
            return 'primary';
        } else {
            return 'default';
        }
    }

}
