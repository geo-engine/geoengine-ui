import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {NotificationService} from '../../notification.service';
import {Notification} from '../../notification.service';

@Component({
    selector: 'ge-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
    notifications: Array<Notification>;

    constructor(private notificationService: NotificationService) {
        this.notifications = [];
    }

    ngOnInit(): void {
        this.notifications = this.notificationService.notifications;
    }

    removeAllNotifications(): void {
        this.notifications.splice(0, this.notifications.length);
    }

    removeCurrentNotification(value: Notification): void {
        const index: number = this.notifications.indexOf(value);
        this.notifications.splice(index, 1);
    }
}
