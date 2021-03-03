import {Input, Directive, Inject} from '@angular/core';

import {
    Operator,
    ResultTypes,
    VectorLayer,
    PointSymbology,
    VectorSymbology,
    MappingQueryService,
    LayerService,
    RandomColorService,
    UserService,
    ProjectService,
    UnexpectedResultType,
} from 'wave-core';

import {GFBioMappingQueryService} from '../../../queries/mapping-query.service';
import {IBasketResult} from './gfbio-basket.model';
import {GFBioUserService} from '../../../users/user.service';

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class BasketResultComponent<T extends IBasketResult> {
    @Input() result: T;

    protected constructor(
        @Inject(MappingQueryService) protected readonly mappingQueryService: GFBioMappingQueryService,
        protected readonly layerService: LayerService,
        protected readonly randomColorService: RandomColorService,
        @Inject(UserService) protected readonly userService: GFBioUserService,
        protected readonly projectService: ProjectService,
    ) {}

    protected createAndAddLayer(operator: Operator, name: string) {
        let clustered = false;
        let symbology;

        switch (operator.resultType) {
            case ResultTypes.POINTS:
                symbology = PointSymbology.createClusterSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                clustered = true;
                break;
            case ResultTypes.POLYGONS:
                symbology = VectorSymbology.createSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                });
                break;
            default:
                throw new UnexpectedResultType();
        }

        const layer = new VectorLayer({
            name,
            operator,
            symbology,
            clustered,
        });
        this.projectService.addLayer(layer);
    }
}
