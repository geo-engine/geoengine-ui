import {Injectable} from '@angular/core';
import {Subject, Observable} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

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

    constructor(
        private snackBar: MatSnackBar
    ) {}

    getNotificationStream(): Observable<Notification> {
        return this.notification$;
    }

    info(message: string) {
        this.notification$.next({
            type: NotificationType.Info,
            message: message,
        });
        this.snackBar.open(message, undefined, {
            duration: 3000,
        });
    }

    error(message: string) {
        this.notification$.next({
            type: NotificationType.Error,
            message: message,
        });
        this.snackBar.open(message, undefined, {
            duration: 5000,
        });
    }
}
