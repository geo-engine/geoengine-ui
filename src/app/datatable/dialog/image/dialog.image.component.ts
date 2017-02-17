import { Component, Input } from '@angular/core';
import {MdDialogRef} from "@angular/material";

@Component({
  selector: 'dialog-image',
  templateUrl: 'dialog.image.component.html',
  styleUrls: ['dialog.image.component.less']
})

/**
 * Dialog-Image-Component
 * Is shown as a dialog-popup.
 * Displays an image-gallery. One image is shown at a time with two buttons to the previous and next images in the list.
 * The component receives an array of urls to images (imageURLS) and the id of the image to show first (currentImage) as inputs.
 */
export class DialogImageComponent {

  /**
   * Input: An array of image-urls to display in the dialog
   */
  @Input()
  private imageURLs: string[];

  /**
   * Input: The index of the image to show first
   */
  @Input()
  private currentImage: number;

  private loading = false;

  private imageFullSize: boolean;

  /**
   * Sets up all variables
   * @param dialogRef reference to this Dialog-Type
   */
  constructor(public dialogRef: MdDialogRef<DialogImageComponent>) {
    this.loading = true;
  }

  /**
   * Shows the next image in the list of image-urls
   */
  private nextImage(){
    this.currentImage = (this.currentImage + 1) % this.imageURLs.length;
    this.loading = true;
    //console.log(this.currentImage);
  }

  /**
   * Shows the previous image in the list of image-urls
   */
  private previousImage(){
    this.currentImage = this.currentImage <= 0 ? this.imageURLs.length - 1 : this.currentImage - 1;
    this.loading = true;
    //console.log(this.currentImage);
  }

  /**
   * Toggles between fullsize-mode (image is shown in original size, no matter if it fits the screen size) and normal mode (image is shown only as big as it fits the screen
   */
  private toggleImageSize(){
    this.imageFullSize = !this.imageFullSize;
  }

  /**
   * Called when the image has finished loading
   * Updates the loading-variable (to hide the loading-spinner)
   */
  private imageLoaded(){
    this.loading = false;
  }
}
