import {Component, Input, ViewContainerRef, OnChanges, ChangeDetectionStrategy} from '@angular/core';
import {MdDialogRef, MdDialog, MdDialogConfig} from '@angular/material';
import {DialogImageComponent} from './image/dialog.image.component';
import {DialogAudioComponent} from './audio/dialog.audio.component';
import {DialogVideoComponent} from './video/dialog.video.component';

@Component({
    selector: 'wave-datatable-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

/**
 * Dialog-Component
 * Checks the file-type of the comma-separated urls given as input-argument and sets up links to open dialogs.
 * The dialogs will show the images or play the audios or videos
 */
export class DialogComponent implements OnChanges {

    private dialogRef: MdDialogRef<any>;
    private urls: string[];
    public dialogType: string[];

    public imageUrls: string[];
    public audioUrls: string[];
    public videoUrls: string[];
    public textNoUrls: string[];


    /**
     * Input: A List of comma-separated urls to images, audio-files and videos
     */
    @Input()
    private url: any;

    /**
     * Input: Type of the audio urls (text, media or none)
     */
    @Input()
    private type: string;


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
        // console.log(ret);
        return ret;
    }


    /**
     * Sets up all variables
     * @param dialog reference to MDDialog
     * @param viewContainerRef reference to ViewContainer
     */
    constructor(
        private dialog: MdDialog,
        private viewContainerRef: ViewContainerRef
    ) { }

    /**
     * OnChange
     * Calculates the file-type of the comma-separated urls given as input-argument
     */
    ngOnChanges() {

        if (this.type === 'media') {
            this.urls = this.url.split(',');
            this.dialogType = new Array(this.urls.length);

            this.imageUrls = [];
            this.audioUrls = [];
            this.videoUrls = [];
            this.textNoUrls = [];

            for (let i in this.urls) {
                if (this.urls.hasOwnProperty(i)) {
                    this.dialogType[i] = DialogComponent.getType(this.urls[i]);
                    // console.log(this.dialogType[i]);

                    if (this.dialogType[i] !== '') {
                        this.urls[i] = this.urls[i].trim();
                    }

                    if (this.dialogType[i] === 'image') {
                        this.imageUrls.push(this.urls[i]);
                    } else if (this.dialogType[i] === 'audio') {
                        this.audioUrls.push(this.urls[i]);
                    } else if (this.dialogType[i] === 'video') {
                        this.videoUrls.push(this.urls[i]);
                    } else {
                        this.textNoUrls.push(this.urls[i]);
                    }
                }
            }
        } else {
            this.urls = [this.url.toString()];
            this.dialogType = [''];

            this.imageUrls = [];
            this.audioUrls = [];
            this.videoUrls = [];
            this.textNoUrls = [this.url.toString()];
        }
    }

    /**
     * Opens a dialog-popup, showing images
     * @param imageID the ID of the first image to be shown
     */
    public openImageDialog(imageID: number) {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.dialogRef = this.dialog.open(DialogImageComponent, config);

        this.dialogRef.componentInstance.imageURLs = this.imageUrls;
        this.dialogRef.componentInstance.currentImage = imageID;

        this.dialogRef.afterClosed().subscribe(result => {
            this.dialogRef = null;
        });
    }

    /**
     * Opens a dialog-popup, playing audio-files
     * @param audioID the ID of the first audio-file to be played
     */
    public openAudioDialog(audioID: number) {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.dialogRef = this.dialog.open(DialogAudioComponent, config);

        this.dialogRef.componentInstance.audioURLs = this.audioUrls;
        this.dialogRef.componentInstance.currentAudio = audioID;

        this.dialogRef.afterClosed().subscribe(result => {
            this.dialogRef = null;
        });
    }

    /**
     * Opens a dialog-popup, playing videos
     * @param videoID the ID of the first video to be played
     */
    public openVideoDialog(videoID: number) {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.dialogRef = this.dialog.open(DialogVideoComponent, config);

        this.dialogRef.componentInstance.videoURLs = this.videoUrls;
        this.dialogRef.componentInstance.currentVideo = videoID;

        this.dialogRef.afterClosed().subscribe(result => {
            this.dialogRef = null;
        });
    }
}
