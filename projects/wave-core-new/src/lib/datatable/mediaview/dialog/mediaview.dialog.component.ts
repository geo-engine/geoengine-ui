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
 * The component receives an array of urls to media files.
 */
export class MediaviewDialogComponent implements OnInit {
    /**
     * Input: An array of media-urls to display in the dialog
     */
    mediaURLs: Array<string> = [];

    /**
     * Input: The index of the media to show first
     */
    currentMedia!: number;

    /**
     * Input: The type of the media ('audio, image, video')
     */
    mediaType!: string;

    public loading = true;

    public autoPlay!: boolean;

    constructor(@Inject(MAT_DIALOG_DATA) public data: {mediaURLs: string[]; currentMedia: number; mediaType: string}) {}

    ngOnInit(): void {
        this.mediaURLs = this.data.mediaURLs;
        this.currentMedia = this.data.currentMedia;
        this.mediaType = this.data.mediaType;
    }

    /**
     * Shows the next media in the list of media-urls
     */
    public nextMedia() {
        this.currentMedia = (this.currentMedia + 1) % this.mediaURLs.length;
        this.loading = true;
    }

    /**
     * Shows the previous media in the list of media-urls
     */
    public previousMedia() {
        this.currentMedia = this.currentMedia <= 0 ? this.mediaURLs.length - 1 : this.currentMedia - 1;
        this.loading = true;
    }

    /**
     * Called when the media has finished loading
     * Updates the loading-variable (to hide the loading-spinner)
     */
    public mediaLoaded() {
        this.loading = false;
    }
}
