import {Component, Input, OnChanges, ChangeDetectionStrategy} from '@angular/core';
import {MediaviewDialogComponent} from './dialog/mediaview.dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'wave-datatable-mediaview',
    templateUrl: './mediaview.component.html',
    styleUrls: ['./mediaview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

/**
 * Dialog-Component
 * Checks the file-type of the comma-separated urls given as input-argument and sets up links to open dialogs.
 * The dialogs will show the images or play the audios or videos
 */
export class MediaviewComponent implements OnChanges {
    private urls: Array<string> = [];
    public mediaType: Array<string> = [];
    public imageUrls: Array<string> = [];
    public audioUrls: Array<string> = [];
    public videoUrls: Array<string> = [];
    public textNoUrls: Array<string> = [];

    /**
     * Input: A List of comma-separated urls to images, audio-files and videos
     */
    @Input() url: any;

    /**
     * Input: Type of the audio urls (text, media or none)
     */
    @Input() type!: string;

    /**
     * Extracts the type (image, audio, video) of a given file-url
     * @param value url containing the filename with file-ending
     * @returns {string} the type of the file or an empty string if there is no file-ending
     */
    public static getType(value: string): string {
        let ret: string;

        if (value !== '') {
            let dotSplits = value.split('.');

            if (dotSplits.length > 1) {
                let fileEnding = dotSplits[dotSplits.length - 1].toLowerCase();

                switch (fileEnding) {
                    // Image
                    case 'jpg':
                    case 'jpeg':
                    case 'gif':
                    case 'png':
                    case 'svg':
                    case 'bmp':
                        ret = 'image';
                        break;

                    // Audio
                    case 'wav':
                    case 'mp3':
                    case 'ogg':
                    case 'aac':
                        ret = 'audio';
                        break;

                    // Video
                    case 'mp4':
                    case 'webm':
                    case 'ogv':
                        ret = 'video';
                        break;

                    // None
                    default:
                        ret = 'text';
                }
            } else {
                ret = 'text';
            }
        } else {
            ret = '';
        }
        return ret;
    }

    constructor(private readonly mediadialog: MatDialog) {}

    /**
     * OnChange
     * Calculates the file-type of the comma-separated urls given as input-argument
     */
    ngOnChanges() {
        if (this.type === 'media') {
            // console.log('onchanges', this.url);
            this.urls = this.url.split(',');
            this.mediaType = new Array(this.urls.length);

            this.imageUrls = [];
            this.audioUrls = [];
            this.videoUrls = [];
            this.textNoUrls = [];

            for (let i in this.urls) {
                if (this.urls.hasOwnProperty(i)) {
                    this.mediaType[i] = MediaviewComponent.getType(this.urls[i]);
                    // console.log(this.mediaType[i]);

                    if (this.mediaType[i] !== '') {
                        this.urls[i] = this.urls[i].trim();
                    }

                    if (this.mediaType[i] === 'image') {
                        this.imageUrls.push(this.urls[i]);
                    } else if (this.mediaType[i] === 'audio') {
                        this.audioUrls.push(this.urls[i]);
                    } else if (this.mediaType[i] === 'video') {
                        this.videoUrls.push(this.urls[i]);
                    } else {
                        this.textNoUrls.push(this.urls[i]);
                    }
                }
            }
        } else {
            this.urls = [this.url.toString()];
            this.mediaType = [''];

            this.imageUrls = [];
            this.audioUrls = [];
            this.videoUrls = [];
            this.textNoUrls = [this.url.toString()];
        }
    }

    /**
     * Opens the images in the sidenav
     * @param imageID the ID of the first image to be shown
     */
    public openImageMediaview(imageID: number) {
        const mediaDialogref = this.mediadialog.open(MediaviewDialogComponent, {
            disableClose: true,
            data: {mediaURLs: this.imageUrls, currentMedia: imageID, mediaType: 'image'},
        });
        // this.mediadialog.afterAllClosed.subscribe((result) => {
        //     console.log('dialog closed', mediaDialogref);
        // });
    }

    /**
     * Opens the audio-files in the sidenav
     * @param audioID the ID of the first audio-file to be played
     */
    public openAudioMediaview(audioID: number) {
        const mediaDialogref = this.mediadialog.open(MediaviewDialogComponent, {
            disableClose: true,
            data: {mediaURLs: this.audioUrls, currentMedia: audioID, mediaType: 'audio'},
        });
        // this.mediadialog.afterAllClosed.subscribe((result) => {
        //     console.log('dialog closed', mediaDialogref);
        // });
    }

    /**
     * Opens the videos in the sidenav
     * @param videoID the ID of the first video to be played
     */
    public openVideoMediaview(videoID: number) {
        const mediaDialogref = this.mediadialog.open(MediaviewDialogComponent, {
            disableClose: true,
            data: {mediaURLs: this.videoUrls, currentMedia: videoID, mediaType: 'video'},
        });
        // this.mediadialog.afterAllClosed.subscribe((result) => {
        //     console.log('dialog closed', mediaDialogref);
        // });
    }
}
