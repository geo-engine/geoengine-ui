import {Injectable} from '@angular/core';
import {Subject, Observable} from 'rxjs/Rx';

export enum NotificationType {
    Info, Error,
}

interface Notification {
    type: NotificationType;
    message: string;
}

@Injectable()
export class NotificationService {
    private notification$ = new Subject<Notification>();

    getNotificationStream(): Observable<Notification> {
        return this.notification$;
    }

    info(message: string) {
        this.notification$.next({
            type: NotificationType.Info,
            message: message,
        });
    }

    error(message: string) {
        this.notification$.next({
            type: NotificationType.Error,
            message: message,
        });
    }
}
