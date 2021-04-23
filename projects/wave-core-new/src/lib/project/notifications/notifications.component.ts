import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {NotificationService} from '../../notification.service';
import {Notification} from '../../notification.service';

@Component({
    selector: 'wave-notifications',
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
        this.notifications = this.notifications.reverse();
    }

    removeAllNotifications(): void {
        this.notifications = [];
    }

    removeCurrentNotification(value: Notification): void {
        const index: number = this.notifications.indexOf(value);
        this.notifications.splice(index, 1);
    }
}
