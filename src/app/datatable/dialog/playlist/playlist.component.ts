import {
  Component, ViewChild, ViewChildren, ElementRef, QueryList, AfterViewChecked, Input,
  ChangeDetectorRef, Output, EventEmitter, AfterViewInit, ChangeDetectionStrategy
} from '@angular/core';

@Component({
  selector: 'dialog-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.less']
})

/**
 * Playlist-Component
 * Is used in the audio- and video-dialog-popups.
 * Displays a playlist showing all files in the given list and highlights the file currently playing.
 * The component receives an array of urls (tracks) and the id of the one currently playing (currentTrack) as inputs.
 * It has an Event-Emitter as Output that is fired when a playlist-item is clicked to be played
 */
export class PlaylistComponent implements AfterViewChecked {

  /**
   * Input: An array of urls to show in the playlist
   */
  @Input()
  private tracks: string[];

  /**
   * Input: The index of the track currently playing
   */
  @Input()
  private currentTrack: number;

  /**
   * Output: Emitted when a link in the playlist is clicked to change the track. The track-id of the track to play is emitted
   * @type {EventEmitter}
   */
  @Output()
  private gotoTrack:EventEmitter<number> = new EventEmitter();


  @ViewChild('list') private ul:ElementRef;
  @ViewChildren('links') private lis:QueryList<ElementRef>;

  private playlistOpen: boolean;
  private playlistHeight: number;
  private trackOffset: number;

  private cdr;

  /**
   * Sets up all variables
   * @param cdr reference to ChangeDetector
   */
  constructor(cdr: ChangeDetectorRef) {
    this.playlistOpen = false;
    this.cdr = cdr;
  }

  /**
   * Is run when the View-References to the playlist change
   * Recalculates the offset and height of the playlist
   */
  ngAfterViewChecked() {
    this.resizePlaylist();
    this.cdr.detectChanges();
  }

  /**
   * Emits an event, telling the parent component that the track with the given id should be played and the currently playing one shall be skipped
   * @param trackID the ID of the track to play
   */
  private goToTrack(trackID:number){
    this.gotoTrack.emit(trackID);
  }

  /**
   * Unfolds/Folds the playlist, toggling between displaying only the track currently playing and all tracks
   */
  private showHide(){
    this.playlistOpen = !this.playlistOpen;
  }

  /**
   * Recalculates height and offset of the playlist, depending on whether it is unfolded or folded and which track is currently selected
   */
  private resizePlaylist() {
    if(this.playlistOpen){
      this.trackOffset = 0;

      this.playlistHeight = this.ul.nativeElement.offsetHeight;
    }
    else{
      let list = this.lis.toArray();

      this.trackOffset = list[this.currentTrack].nativeElement.offsetTop - this.ul.nativeElement.offsetTop;

      this.playlistHeight = list[this.currentTrack].nativeElement.offsetHeight;
    }
  }

}
