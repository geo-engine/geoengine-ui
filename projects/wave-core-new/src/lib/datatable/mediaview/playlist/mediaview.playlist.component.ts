import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
    selector: 'wave-mediaview-playlist',
    templateUrl: './mediaview.playlist.component.html',
    styleUrls: ['./mediaview.playlist.component.scss'],
})

/**
 * Playlist-Component
 * Displays a playlist showing all files in the given list and highlights the file currently playing.
 * The component receives an array of track names and the id of the one currently playing (currentTrack) as inputs.
 * It has an Event-Emitter as Output that is fired when a playlist-item is clicked to be played
 */
export class MediaviewPlaylistComponent {
    @Input() tracks: Array<string> = [];
    @Input() currentTrack!: number;

    /**
     * Output: Emitted when a link in the playlist is clicked to change the track. The track-id of the track to play is emitted
     */
    @Output() gotoMediaP: EventEmitter<number> = new EventEmitter();

    public goToMedia(trackID: number): void {
        this.gotoMediaP.emit(trackID);
    }
}
