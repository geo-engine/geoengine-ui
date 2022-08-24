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

    autoPlay!: boolean;

    constructor(@Inject(MAT_DIALOG_DATA) public data: {mediaURLs: string[]; currentMedia: number; mediaTypes: string[]}) {}

    ngOnInit(): void {
        this.mediaURLs = this.data.mediaURLs;
        this.currentMedia = this.data.currentMedia;
        this.mediaTypes = this.data.mediaTypes;
    }

    get mediaNames() {
        let mediaNames = new Array<string>();
        for (let media of this.mediaURLs) {
            mediaNames.push(media?.split('/').pop() ?? '');
        }
        return mediaNames;
    }

    get mediaDialogHeader() {
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
     * Plays the media with the given id
     * @param mediaID the ID auf the media-file
     */
    goToMedia(mediaID: number) {
        this.currentMedia = mediaID;
        this.autoPlay = true;
    }

    nextMedia() {
        this.currentMedia = (this.currentMedia + 1) % this.mediaURLs.length;
    }

    previousMedia() {
        this.currentMedia = this.currentMedia <= 0 ? this.mediaURLs.length - 1 : this.currentMedia - 1;
    }
}
