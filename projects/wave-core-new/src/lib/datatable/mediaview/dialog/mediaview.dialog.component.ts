import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'wave-mediaview-dialog',
    templateUrl: './mediaview.dialog.component.html',
    styleUrls: ['./mediaview.dialog.component.scss'],
})

/**
 * Dialog-Media-Component
 * Is shown as a dialog-popup.
 * Displays a media-gallery. One media(image, audio, video) is shown at a time.
 * The component receives an array of urls to media files, the first media and an array specifying the types of the media files.
 */
export class MediaviewDialogComponent implements OnInit {
    mediaURLs: Array<string> = [];

    currentMedia!: number;

    mediaTypes: Array<string> = [];

    constructor(@Inject(MAT_DIALOG_DATA) public data: {mediaURLs: string[]; currentMedia: number; mediaTypes: string[]}) {}

    ngOnInit(): void {
        this.mediaURLs = this.data.mediaURLs;
        this.currentMedia = this.data.currentMedia;
        this.mediaTypes = this.data.mediaTypes;
    }

    get mediaNames(): Array<string> {
        const mediaNames = new Array<string>();
        for (const media of this.mediaURLs) {
            mediaNames.push(media?.split('/').pop() ?? '');
        }
        return mediaNames;
    }

    get mediaDialogHeader(): string {
        return (
            this.mediaTypes[this.currentMedia]?.charAt(0).toUpperCase() +
            this.mediaTypes[this.currentMedia]?.slice(1) +
            ' ' +
            (this.currentMedia + 1) +
            ' of ' +
            this.mediaURLs.length
        );
    }

    /**
     * Plays the media with the given id.
     */
    goToMedia(mediaID: number): void {
        this.currentMedia = mediaID;
    }

    nextMedia(): void {
        this.currentMedia = (this.currentMedia + 1) % this.mediaURLs.length;
    }

    previousMedia(): void {
        this.currentMedia = this.currentMedia <= 0 ? this.mediaURLs.length - 1 : this.currentMedia - 1;
    }

    openInNewTab(): void {
        window.open(this.mediaURLs[this.currentMedia], '_blank', 'noopener');
    }
}
