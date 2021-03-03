import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'wave-mediaview-image-dialog',
    templateUrl: './mediaview.image-dialog.component.html',
    styleUrls: ['./mediaview.image-dialog.component.scss'],
})

/**
 * Dialog-Image-Component
 * Is shown as a dialog-popup.
 * Displays an image-gallery. One image is shown at a time with two buttons to the previous and next images in the list.
 * The component receives an array of urls to images (imageURLS) and the id of the image to show first (currentImage) as inputs.
 */
export class MediaviewImageDialogComponent {
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

    public loading = true;

    // private domNode;

    /**
     * Sets up all variables
     * @param dialogRef reference to this Dialog-Type
     */
    constructor(public dialogRef: MatDialogRef<MediaviewImageDialogComponent>) {
        // , @Inject(ElementRef) elementRef: ElementRef
        this.loading = true;

        // this.domNode = elementRef.nativeElement;
    }

    /**
     * Hack to set Dialog's parent's position to absolute
     */
    /*ngAfterViewInit() {
        // console.log(this.domNode.parentNode);

        //this.domNode.parentNode.parentElement.style.position = 'relative';
    }*/

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
