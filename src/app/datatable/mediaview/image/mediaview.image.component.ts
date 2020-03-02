import {Component, Input, ViewContainerRef} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {MediaviewImageDialogComponent} from '../image-dialog/mediaview.image-dialog.component';

@Component({
    selector: 'wave-mediaview-image',
    templateUrl: './mediaview.image.component.html',
    styleUrls: ['./mediaview.image.component.scss']
})

/**
 * Dialog-Image-Component
 * Is shown as a dialog-popup.
 * Displays an image-gallery. One image is shown at a time with two buttons to the previous and next images in the list.
 * The component receives an array of urls to images (imageURLS) and the id of the image to show first (currentImage) as inputs.
 */
export class MediaviewImageComponent {

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

    private dialogRef: MatDialogRef<any>;

    /**
     * Sets up all variables
     * @param dialog reference to MDDialog
     * @param viewContainerRef reference to ViewContainer
     */
    constructor(
        private dialog: MatDialog,
        private viewContainerRef: ViewContainerRef
    ) { }

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

    /**
     * Opens a dialog-popup, showing the images in full size
     */
    public openImageFullSize() {
        let config = new MatDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.dialogRef = this.dialog.open(MediaviewImageDialogComponent, config);

        this.dialogRef.componentInstance.imageURLs = this.imageURLs;
        this.dialogRef.componentInstance.currentImage = this.currentImage;

        this.dialogRef.afterClosed().subscribe(result => {
            this.dialogRef = null;
        });
    }
}
