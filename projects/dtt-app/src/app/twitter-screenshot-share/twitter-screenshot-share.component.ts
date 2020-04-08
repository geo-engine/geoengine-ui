import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, HostBinding, Inject} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';

import {BehaviorSubject, from, Observable} from 'rxjs';
import {first, flatMap} from 'rxjs/operators';

import html2canvas from 'html2canvas';

import hello from 'hellojs/dist/hello.all';

import {Config, LayoutService} from 'wave-core';

import {AppConfig} from '../app-config.service';

enum SendNotificationStatus {
    OK,
    SENDING,
    ERROR,
}

@Component({
    selector: 'wave-dtt-twitter-screenshot-share',
    templateUrl: './twitter-screenshot-share.component.html',
    styleUrls: ['./twitter-screenshot-share.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitterScreenshotShareComponent implements OnInit, AfterViewInit {
    @HostBinding('class') class = 'mat-typography';

    readonly LayoutService = LayoutService;
    readonly SendNotificationStatus = SendNotificationStatus;

    readonly imageLoading = new BehaviorSubject(false);
    private readonly placeholderImage = TwitterScreenshotShareComponent.generatePlaceholderImage();

    image: string = this.placeholderImage;

    imageBlob: Blob = undefined;
    message = new FormControl('', [Validators.required, Validators.maxLength(280)]);

    readonly sendNotificationStatus = new BehaviorSubject(SendNotificationStatus.OK);
    sendNotification = ' ';

    constructor(private readonly changeDetectorRef: ChangeDetectorRef,
                @Inject(Config) private readonly config: AppConfig) {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        setTimeout(() => this.changeDetectorRef.markForCheck());
    }

    screenshot() {
        this.imageLoading.next(true);

        from(html2canvas(
            document.body, // use whole document
            {
                ignoreElements: element => element.classList.contains('cdk-overlay-container'), // ignore overlay, i.e., this dialog
                logging: false,
            },
        )).pipe(
            first(),
            flatMap((canvas: HTMLCanvasElement) => {
                const imageType = 'image/png';
                const dataUrl = canvas.toDataURL(imageType);
                return new Observable(subscriber => {
                    canvas.toBlob(
                        blob => {
                            subscriber.next([dataUrl, blob]);
                            subscriber.complete();
                        },
                        imageType,
                    );
                });
            }),
        ).subscribe(
            ([image, imageBlob]) => {
                this.image = image;
                this.imageBlob = imageBlob;
            },
            _error => {
                this.image = this.placeholderImage;
                this.imageBlob = undefined;
            },
            () => {
                this.imageLoading.next(false);
            });
    }

    tweet() {
        this.sendNotificationStatus.next(SendNotificationStatus.SENDING);

        hello.init({
            twitter: this.config.DTT.TWITTER_APP_KEY,
        });
        const twitter = hello('twitter');

        from(twitter.login({
            display: 'popup',
            scope: 'share',
        })).pipe(
            flatMap(() => twitter.api('me/share', 'POST', {
                message: this.message.value,
                file: this.imageBlob,
            })),
            first(),
        ).subscribe(
            () => {
                this.sendNotification = `Successfully sent message via Twitter!`;
                this.sendNotificationStatus.next(SendNotificationStatus.OK);
            },
            error => {
                this.sendNotification = `Unable to send message via Twitter: »${error}«`;
                this.sendNotificationStatus.next(SendNotificationStatus.ERROR);
            },
        );
    }

    private static generatePlaceholderImage(): string {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 1;

        const context: CanvasRenderingContext2D = canvas.getContext('2d');
        context.fillStyle = '#AAAAAA';
        context.fillRect(0, 0, 2, 1);

        return canvas.toDataURL('image/png');
    }
}
