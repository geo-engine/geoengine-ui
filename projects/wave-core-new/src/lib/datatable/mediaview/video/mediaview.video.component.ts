import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'wave-mediaview-video',
    templateUrl: './mediaview.video.component.html',
    styleUrls: ['./mediaview.video.component.scss'],
})

/**
 * Dialog-Video-Component
 * Is shown as a dialog-popup.
 * Displays a video-player with a playlist.
 * The component receives an array of urls to video-files (videoURLS) and the id of the video to play first (currentVideo) as inputs.
 */
export class MediaviewVideoComponent implements OnInit {
    /**
     * Input: An array of video-urls to display in the dialog
     */
    videoURLs: Array<string> = [];

    /**
     * Input: The index of the video to play first
     */
    currentVideo!: number;

    public autoPlay: boolean = false;

    constructor(@Inject(MAT_DIALOG_DATA) public data: {videoURLs: string[]; currentVideo: number}) {}

    ngOnInit(): void {
        this.videoURLs = this.data.videoURLs;
        this.currentVideo = this.data.currentVideo;
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
     * Plays the previous video in the list of video-urls
     * If the current file is the last one, plays the first one
     * Is also called when the current video has finished playing
     */
    public previousVideo() {
        this.goToVideo(this.currentVideo <= 0 ? this.videoURLs.length - 1 : this.currentVideo - 1);
    }

    /**
     * Plays the next video in the list of video-urls
     * If the current file is the last one, plays the first one
     * Is called when the current video has finished playing
     */
    public nextVideo() {
        this.goToVideo((this.currentVideo + 1) % this.videoURLs.length);
    }
}
