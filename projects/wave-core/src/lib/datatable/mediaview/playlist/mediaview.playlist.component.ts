import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
    selector: 'wave-mediaview-playlist',
    templateUrl: './mediaview.playlist.component.html',
    styleUrls: ['./mediaview.playlist.component.scss'],
})

/**
 * Playlist-Component
 * Is used in the audio- and video-dialog-popups.
 * Displays a playlist showing all files in the given list and highlights the file currently playing.
 * The component receives an array of urls (tracks) and the id of the one currently playing (currentTrack) as inputs.
 * It has an Event-Emitter as Output that is fired when a playlist-item is clicked to be played
 */
export class MediaviewPlaylistComponent {
    /**
     * Input: An array of urls to show in the playlist
     */
    @Input()
    public tracks: string[];

    /**
     * Input: The index of the track currently playing
     */
    @Input()
    public currentTrack: number;

    /**
     * Output: Emitted when a link in the playlist is clicked to change the track. The track-id of the track to play is emitted
     * @type {EventEmitter}
     */
    @Output()
    public gotoTrack: EventEmitter<number> = new EventEmitter();

    /**
     * Emits an event, telling the parent component that the track with the given id should be played
     * and the currently playing one shall be skipped
     * @param trackID the ID of the track to play
     */
    public goToTrack(trackID: number) {
        this.gotoTrack.emit(trackID);
    }
}
