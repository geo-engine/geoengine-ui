import {Input, Component} from '@angular/core';
import {IBasketResult} from './gfbio-basket.model';
import {Operator} from '../../operator.model';
import {ResultTypes} from '../../result-type.model';
import {VectorLayer} from '../../../layers/layer.model';
import {ComplexPointSymbology, ComplexVectorSymbology} from '../../../layers/symbology/symbology.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {LayerService} from '../../../layers/layer.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {UserService} from '../../../users/user.service';
import {ProjectService} from '../../../project/project.service';
import {UnexpectedResultType} from '../../../util/errors';

@Component({})
export abstract class BasketResultComponent<T extends IBasketResult> {
    @Input() result: T;


    constructor(protected mappingQueryService: MappingQueryService,
                protected layerService: LayerService,
                protected randomColorService: RandomColorService,
                protected userService: UserService,
                protected projectService: ProjectService) {
    }

    protected createAndAddLayer(operator: Operator, name: string) {
        let clustered = false;
        let symbology;

        switch (operator.resultType) {
            case ResultTypes.POINTS:
                symbology = ComplexPointSymbology.createClusterSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                clustered = true;
                break;
            case ResultTypes.POLYGONS:
                symbology = ComplexVectorSymbology.createSimpleSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            default:
                throw new UnexpectedResultType();
        }

        const layer = new VectorLayer({
            name: name,
            operator: operator,
            symbology: symbology,
            clustered: clustered,
        });
        this.projectService.addLayer(layer);
    }
}
