import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {RasterSymbology} from './symbology.model';

@Component({
    selector: 'wave-symbology-raster',
    template: `
     <div class='md-block' flex-gt-sm>
         <label>Opacity</label>
         <md-input [(ngModel)]='symbology.opacity' (ngModelChange)='update()'></md-input>
      </div>
      <div class='md-block' flex-gt-sm>
          <label>Hue</label>
          <md-input disabled
            type='number'
            [(ngModel)]='symbology.hue'
            (ngModelChange)='update()'></md-input>
       </div>
       <div class='md-block' flex-gt-sm>
           <label>Saturation</label>
           <md-input disabled
            type='number'
            [(ngModel)]='symbology.saturation'
            (ngModelChange)='update()'></md-input>
        </div>
      `,
    styles: [``],
    directives: [MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbologyRasterComponent implements OnInit {
    @Input() symbology: RasterSymbology;

    @Output('symbologyChanged') symbologyChanged: EventEmitter<RasterSymbology> =
        new EventEmitter<RasterSymbology>();

    update() {
        // console.log('wave-symbology-raster', 'update', this.symbology);
        this.symbologyChanged.emit(this.symbology.clone());
    }

    ngOnInit() {
        // console.log('wave-symbology-raster', this.symbology);
    }
}
