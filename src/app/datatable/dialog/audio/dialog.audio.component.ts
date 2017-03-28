import { Component, Input} from '@angular/core';
import {MdDialogRef} from '@angular/material';

@Component({
    selector: 'wave-dialog-audio',
    templateUrl: './dialog.audio.component.html',
    styleUrls: ['./dialog.audio.component.less']
})

/**
 * Dialog-Audio-Component
 * Is shown as a dialog-popup.
 * Displays an audio-player with a playlist.
 * The component receives an array of urls to audio-files (audioURLS) and the id of the audio to play first (currentAudio) as inputs.
 */
export class DialogAudioComponent {

    /**
     * Input: An array of audio-urls to display in the dialog
     */
    @Input()
    public audioURLs: string[];

    /**
     * Input: The index of the audio-file to play first
     */
    @Input()
    public currentAudio: number;

    // audioNames: string[];
    public autoPlay: boolean;

    /**
     * Sets up all variables
     * @param dialogRef reference to this Dialog-Type
     */
    constructor(public dialogRef: MdDialogRef<DialogAudioComponent>) {
        this.autoPlay = false;
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
    public playNext() {
        this.goToAudio((this.currentAudio + 1) % this.audioURLs.length);
    }
}
