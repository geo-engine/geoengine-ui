import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'wave-mediaview-image',
    templateUrl: './mediaview.image.component.html',
    styleUrls: ['./mediaview.image.component.scss'],
})

/**
 * Dialog-Image-Component
 * Is shown as a dialog-popup.
 * Displays an image-gallery. One image is shown at a time with two buttons to the previous and next images in the list.
 * The component receives an array of urls to images (imageURLS) and the id of the image to show first (currentImage) as inputs.
 */
export class MediaviewImageComponent implements OnInit {
    /**
     * Input: An array of image-urls to display in the dialog
     */
    imageURLs: Array<string> = [];

    /**
     * Input: The index of the image to show first
     */
    currentImage!: number;

    public loading = true;

    constructor(@Inject(MAT_DIALOG_DATA) public data: {imageURLs: string[]; currentImage: number}) {}

    ngOnInit(): void {
        this.imageURLs = this.data.imageURLs;
        this.currentImage = this.data.currentImage;
    }

    /**
     * Shows the next image in the list of image-urls
     */
    public nextImage() {
        this.currentImage = (this.currentImage + 1) % this.imageURLs.length;
        this.loading = true;
    }

    /**
     * Shows the previous image in the list of image-urls
     */
    public previousImage() {
        this.currentImage = this.currentImage <= 0 ? this.imageURLs.length - 1 : this.currentImage - 1;
        this.loading = true;
    }

    /**
     * Called when the image has finished loading
     * Updates the loading-variable (to hide the loading-spinner)
     */
    public imageLoaded() {
        this.loading = false;
    }
}
