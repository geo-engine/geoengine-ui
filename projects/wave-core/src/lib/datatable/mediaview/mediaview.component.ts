import {Component, Input, OnChanges, ChangeDetectionStrategy} from '@angular/core';
import {MediaviewImageComponent} from './image/mediaview.image.component';
import {MediaviewAudioComponent} from './audio/mediaview.audio.component';
import {MediaviewVideoComponent} from './video/mediaview.video.component';
import {LayoutService} from '../../layout.service';

@Component({
    selector: 'wave-datatable-mediaview',
    templateUrl: './mediaview.component.html',
    styleUrls: ['./mediaview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

/**
 * Dialog-Component
 * Checks the file-type of the comma-separated urls given as input-argument and sets up links to open dialogs.
 * The dialogs will show the images or play the audios or videos
 */
export class MediaviewComponent implements OnChanges {
    private urls: string[];
    public mediaType: string[];

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
     * @param layoutService reference to LayoutService
     */
    constructor(public layoutService: LayoutService) {}

    /**
     * OnChange
     * Calculates the file-type of the comma-separated urls given as input-argument
     */
    ngOnChanges() {
        if (this.type === 'media') {
            this.urls = this.url.split(',');
            this.mediaType = new Array(this.urls.length);

            this.imageUrls = [];
            this.audioUrls = [];
            this.videoUrls = [];
            this.textNoUrls = [];

            for (let i in this.urls) {
                if (this.urls.hasOwnProperty(i)) {
                    this.mediaType[i] = MediaviewComponent.getType(this.urls[i]);
                    // console.log(this.mediaType[i]);

                    if (this.mediaType[i] !== '') {
                        this.urls[i] = this.urls[i].trim();
                    }

                    if (this.mediaType[i] === 'image') {
                        this.imageUrls.push(this.urls[i]);
                    } else if (this.mediaType[i] === 'audio') {
                        this.audioUrls.push(this.urls[i]);
                    } else if (this.mediaType[i] === 'video') {
                        this.videoUrls.push(this.urls[i]);
                    } else {
                        this.textNoUrls.push(this.urls[i]);
                    }
                }
            }
        } else {
            this.urls = [this.url.toString()];
            this.mediaType = [''];

            this.imageUrls = [];
            this.audioUrls = [];
            this.videoUrls = [];
            this.textNoUrls = [this.url.toString()];
        }
    }

    /**
     * Opens the images in the sidenav
     * @param imageID the ID of the first image to be shown
     */
    public openImageMediaview(imageID: number) {
        this.layoutService.setSidenavContentComponent({
            component: MediaviewImageComponent,
            config: {imageURLs: this.imageUrls, currentImage: imageID},
        });
    }

    /**
     * Opens the audio-files in the sidenav
     * @param audioID the ID of the first audio-file to be played
     */
    public openAudioMediaview(audioID: number) {
        this.layoutService.setSidenavContentComponent({
            component: MediaviewAudioComponent,
            config: {audioURLs: this.audioUrls, currentAudio: audioID},
        });
    }

    /**
     * Opens the videos in the sidenav
     * @param videoID the ID of the first video to be played
     */
    public openVideoMediaview(videoID: number) {
        this.layoutService.setSidenavContentComponent({
            component: MediaviewVideoComponent,
            config: {videoURLs: this.videoUrls, currentVideo: videoID},
        });
    }
}
