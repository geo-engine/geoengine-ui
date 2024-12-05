import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {Session} from '../session.model';
import {Clipboard} from '@angular/cdk/clipboard';
import {NotificationService, UserService} from '@geoengine/common';

@Component({
    selector: 'geoengine-user-session',
    templateUrl: './user-session.component.html',
    styleUrls: ['./user-session.component.scss'],
})
export class UserSessionComponent implements OnDestroy {
    protected session: Session | undefined;
    private sessionStreamSubscription: Subscription;

    constructor(
        protected readonly userService: UserService,
        protected clipboard: Clipboard,
        protected readonly notificationService: NotificationService,
    ) {
        const subs = this.userService.getSessionStream().subscribe((session) => {
            this.session = session;
        });

        this.sessionStreamSubscription = subs;
    }

    ngOnDestroy(): void {
        this.sessionStreamSubscription.unsubscribe();
    }

    copySessionTokenToClipboard(): void {
        if (this.session) {
            this.clipboard.copy(this.session.sessionToken);
            this.notificationService.info('Session token copied to clipboard: ' + this.session.sessionToken);
        }
    }
}
