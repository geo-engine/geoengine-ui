import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'wave-mediaview-audio',
    templateUrl: './mediaview.audio.component.html',
    styleUrls: ['./mediaview.audio.component.scss'],
})

/**
 * Dialog-Audio-Component
 * Is shown as a dialog-popup.
 * Displays an audio-player with a playlist.
 * The component receives an array of urls to audio-files (audioURLS) and the id of the audio to play first (currentAudio) as inputs.
 */
export class MediaviewAudioComponent {
    /**
     * Input: An array of audio-urls to display in the dialog
     */
    audioURLs: Array<string> = [];

    /**
     * Input: The index of the audio-file to play first
     */
    currentAudio!: number;

    public autoPlay!: boolean;

    constructor(@Inject(MAT_DIALOG_DATA) public data: {audioURLs: string[]; currentAudio: number}) {}

    ngOnInit(): void {
        this.audioURLs = this.data.audioURLs;
        this.currentAudio = this.data.currentAudio;
    }
    /**
     * Plays the audio with given id, skipping the currently playing one
     * @param audioID the ID auf the audio-file to play
     */
    public goToAudio(audioID: number) {
        this.currentAudio = audioID;
        this.autoPlay = true;
    }

    /**
     * Plays the next audio in the list of audio-urls
     * If the current file is the last one, plays the first one
     * Is called when the current audio has finished playing
     */
    public nextAudio() {
        this.goToAudio((this.currentAudio + 1) % this.audioURLs.length);
    }

    /**
     * Plays the next audio in the list of audio-urls
     * If the current file is the last one, plays the first one
     * Is called when the current audio has finished playing
     */
    public previousAudio() {
        this.goToAudio(this.currentAudio <= 0 ? this.audioURLs.length - 1 : this.currentAudio - 1);
    }
}
