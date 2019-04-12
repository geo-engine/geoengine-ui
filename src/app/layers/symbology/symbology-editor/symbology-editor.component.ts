import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AbstractSymbology, SymbologyType} from '../symbology.model';
import {Layer} from '../../layer.model';
import {ProjectService} from '../../../project/project.service';

@Component({
    selector: 'wave-symbology-editor',
    templateUrl: 'symbology-editor.component.html',
    styleUrls: ['symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SymbologyEditorComponent implements OnChanges {

    // make visible in template
    // tslint:disable:variable-name
    ST = SymbologyType;
    // tslint:enable

    @Input()
    showLayerSelect = false;

    @Input()
    layer = undefined;

    constructor(
        public projectService: ProjectService
    ) {}


    ngOnChanges(changes: SimpleChanges): void {
        // console.log('SymbologyEditorComponent', 'ngOnChanges', changes);
    }

    get validLayer(): boolean {
        return !!this.layer
    }

    update_symbology(layer: Layer<AbstractSymbology>, symbology: AbstractSymbology) {
        // console.log('update_symbology', symbology);
        this.projectService.changeLayer(layer, {symbology: symbology});
    }

}
