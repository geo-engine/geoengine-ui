import {Component, OnInit, ChangeDetectionStrategy, Inject, ViewChild, ElementRef} from '@angular/core';
import {Layer} from '../../layer.model';
import {AbstractSymbology} from '../../symbology/symbology.model';
import {MAT_DIALOG_DATA} from '@angular/material';

interface LayerShareComponentConfig {
    layer: Layer<AbstractSymbology>;
}

@Component({
    selector: 'wave-layer-share-dialog',
    templateUrl: './layer-share.component.html',
    styleUrls: ['./layer-share.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerShareComponent implements OnInit {

    layer: Layer<AbstractSymbology>;
    link: string;

    @ViewChild('linkInput', { static: true })
    private linkInput: ElementRef;

    constructor(@Inject(MAT_DIALOG_DATA) private config: LayerShareComponentConfig) {
    }

    ngOnInit() {
        this.layer = this.config.layer;

        const layerJSON = JSON.stringify(this.layer.toDict());

        this.link = `${window.location.origin}${window.location.pathname}#/?workflow=${encodeURI(layerJSON)}`;
    }

    copyLink() {
        const disabled = this.linkInput.nativeElement.disabled;
        this.linkInput.nativeElement.disabled = false;

        this.linkInput.nativeElement.focus();
        this.linkInput.nativeElement.select();
        document.execCommand('copy');

        this.linkInput.nativeElement.disabled = disabled;
    }

}
