import {Component, ElementRef, Inject, Input, AfterViewInit} from '@angular/core';
import {MdDialogRef} from '@angular/material';

@Component({
    selector: 'wave-dialog-image',
    templateUrl: './dialog.image.component.html',
    styleUrls: ['./dialog.image.component.less']
})

/**
 * Dialog-Image-Component
 * Is shown as a dialog-popup.
 * Displays an image-gallery. One image is shown at a time with two buttons to the previous and next images in the list.
 * The component receives an array of urls to images (imageURLS) and the id of the image to show first (currentImage) as inputs.
 */
export class DialogImageComponent implements AfterViewInit {

    /**
     * Input: An array of image-urls to display in the dialog
     */
    @Input()
    public imageURLs: string[];

    /**
     * Input: The index of the image to show first
     */
    @Input()
    public currentImage: number;

    public loading = false;

    public imageFullSize: boolean;

    private domNode;

    /**
     * Sets up all variables
     * @param dialogRef reference to this Dialog-Type
     */
    constructor(public dialogRef: MdDialogRef<DialogImageComponent>, @Inject(ElementRef) elementRef: ElementRef) {
        this.loading = true;

        this.domNode = elementRef.nativeElement;
    }

    /**
     * Hack to set Dialog's parent's position to absolute
     */
    ngAfterViewInit() {
        // console.log(this.domNode.parentNode.parentNode.parentNode.parentNode);
        this.domNode.parentNode.parentNode.parentNode.parentElement.style.position = 'absolute';
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
     * Toggles between fullsize-mode (image is shown in original size, no matter if it fits the screen size)
     * and normal mode (image is shown only as big as it fits the screen
     */
    public toggleImageSize() {
        this.imageFullSize = !this.imageFullSize;
    }

    /**
     * Called when the image has finished loading
     * Updates the loading-variable (to hide the loading-spinner)
     */
    public imageLoaded() {
        this.loading = false;
    }
}
