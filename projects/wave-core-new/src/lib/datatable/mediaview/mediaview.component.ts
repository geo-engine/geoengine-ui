import {Component, Input, OnInit, ChangeDetectionStrategy} from '@angular/core';
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
 * Checks the file-type of the comma-separated urls given as input-argument and sets up links to open a dialog.
 * The dialog will show the images or play the audios or videos.
 */
export class MediaviewComponent implements OnInit {
    private urls: Array<string> = [];
    mediaType: Array<string> = [];
    mediaUrls: Array<string> = [];

    /**
     * Input: A List of comma-separated urls to images, audio-files and videos
     */
    @Input() url: any;

    /**
     * Input: Type of the urls (text, media or none)
     */
    @Input() type!: string;

    /**
     * Extracts the type (image, audio, video) of a given file-url string
     * @param value url containing the filename with file-ending
     * @returns {string} the type of the file or an empty string if there is no file-ending
     */
    public static getType(value: string): string {
        let ret: string;
        if (!value || value === '') return (ret = '');
        let fileSplits = value.split('.') ?? [];
        if (fileSplits.length <= 1) return (ret = '');
        let fileEnding = fileSplits.pop()?.toLowerCase() ?? '';
        const imageArray = ['jpg', 'jpeg', 'gif', 'png', 'svg', 'bmp'];
        const audioArray = ['wav', 'mp3', 'ogg', 'aac'];
        const videoArray = ['webm', 'mp4', 'ogv'];

        imageArray.includes(fileEnding)
            ? (ret = 'image')
            : audioArray.includes(fileEnding)
            ? (ret = 'audio')
            : videoArray.includes(fileEnding)
            ? (ret = 'video')
            : (ret = 'text');

        return ret;
    }

    constructor(private readonly mediadialog: MatDialog) {}

    /**
     * OnInit
     * Gets the urls and file-types of the comma-separated urls given as input-argument
     */
    ngOnInit() {
        if (this.type === 'media') {
            this.urls = this.url.split(',');
            this.mediaType = new Array(this.urls.length);
            this.mediaUrls = [];

            for (let i in this.urls) {
                if (this.urls.hasOwnProperty(i)) {
                    this.mediaType[i] = MediaviewComponent.getType(this.urls[i]);
                    if (this.mediaType[i] !== '') {
                        this.urls[i] = this.urls[i].trim();
                    }
                    this.mediaUrls.push(this.urls[i]);
                }
            }
        } else {
            this.urls = [this.url.toString()];
            this.mediaType = [''];
            this.mediaUrls = [this.url.toString()];
        }
    }

    get media(): string {
        return this.mediaType[0] ?? '';
    }

    /**
     * Opens the media in a new dialog window
     * @param mediaID the ID of the first media
     */
    public openMediaviewDialog(mediaID: number) {
        const mediaDialogref = this.mediadialog.open(MediaviewDialogComponent, {
            disableClose: true,
            data: {mediaURLs: this.mediaUrls, currentMedia: mediaID, mediaTypes: this.mediaType},
        });
    }
}
