import {Component, OnInit, ChangeDetectionStrategy, Inject, ViewChild, ElementRef} from '@angular/core';
import {Layer} from '../../layer.model';
import {Symbology} from '../../symbology/symbology.model';
import {MD_DIALOG_DATA} from '@angular/material';

interface LayerShareComponentConfig {
    layer: Layer<Symbology>;
}

@Component({
    selector: 'wave-layer-share-dialog',
    templateUrl: './layer-share.component.html',
    styleUrls: ['./layer-share.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerShareComponent implements OnInit {

    layer: Layer<Symbology>;
    link: string;

    @ViewChild('linkInput')
    private linkInput: ElementRef;

    constructor(@Inject(MD_DIALOG_DATA) private config: LayerShareComponentConfig) {
    }

    ngOnInit() {
        this.layer = this.config.layer;

        const layerJSON = JSON.stringify(this.layer.toDict());
        this.link = `${window.location.origin}/#/?workflow=${encodeURI(layerJSON)}`;
    }

    copyLink() {
        // this.linkInput.nativeElement.select();
        // document.execCommand('copy');

        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNode(this.linkInput.nativeElement);
        selection.removeAllRanges();
        selection.addRange(range);
        // add to clipboard.
        document.execCommand('copy');
    }

}
