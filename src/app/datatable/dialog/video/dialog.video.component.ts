import { Component, Input } from '@angular/core';
import {MdDialogRef} from '@angular/material';

@Component({
    selector: 'wave-dialog-video',
    templateUrl: './dialog.video.component.html',
    styleUrls: ['./dialog.video.component.less']
})

/**
 * Dialog-Video-Component
 * Is shown as a dialog-popup.
 * Displays a video-player with a playlist.
 * The component receives an array of urls to video-files (videoURLS) and the id of the video to play first (currentVideo) as inputs.
 */
export class DialogVideoComponent {

    /**
     * Input: An array of video-urls to display in the dialog
     */
    @Input()
    public videoURLs: string[];

    /**
     * Input: The index of the video to play first
     */
    @Input()
    public currentVideo: number;

    public autoPlay: boolean;

    /**
     * Sets up all variables
     * @param dialogRef reference to this Dialog-Type
     */
    constructor(public dialogRef: MdDialogRef<DialogVideoComponent>) {
        this.autoPlay = false;
    }

    /**
     * Plays the video with given id, skipping the currently playing one
     * @param videoID the ID auf the video-file to play
     */
    public goToVideo(videoID: number) {
        this.currentVideo = videoID;
        this.autoPlay = true;
    }

    /**
     * Plays the next video in the list of video-urls
     * If the current file is the last one, plays the first one
     * Is called when the current video has finished playing
     */
    public playNext() {
        this.goToVideo((this.currentVideo + 1) % this.videoURLs.length);
    }

}
