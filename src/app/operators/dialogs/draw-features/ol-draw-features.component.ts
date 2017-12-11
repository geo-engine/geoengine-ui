import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {MapService} from '../../../map/map.service';
import * as ol from 'openlayers';
import {Projections} from '../../projection.model';
import {Operator} from '../../operator.model';
import {
    AbstractVectorSymbology, ClusteredPointSymbology,
    SimpleVectorSymbology
} from '../../../layers/symbology/symbology.model';
import {UnexpectedResultType} from '../../../util/errors';
import {VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {ProjectService} from '../../../project/project.service';
import {WKTSourceType} from '../../types/wkt-source-type.model';
import {RandomColorService} from '../../../util/services/random-color.service';

@Component({
    selector: 'wave-ol-draw-features',
    templateUrl: './ol-draw-features.component.html',
    styleUrls: ['./ol-draw-features.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OlDrawFeaturesComponent implements OnInit {

    featureTypes = ['Polygon', 'Point'];
    selectedFeatureType: ol.geom.GeometryType;
    isDrawingActive = false;
    olFeatureWriter = new ol.format.WKT();
    featureLayerName = 'new feature layer';

    constructor(
        private mapService: MapService,
        private projectService: ProjectService,
        private randomColorService: RandomColorService,
    ) {

    }

    startDrawing() {
        this.isDrawingActive = true;
        this.mapService.startDrawInteraction(this.selectedFeatureType);
    }

    endDrawing() {
        this.isDrawingActive = false;
        const olSource = this.mapService.endDrawInteraction();
        console.log("endDrawing", this.olFeatureWriter.writeFeatures(olSource.getFeatures()));
        const wkt = this.olFeatureWriter.writeFeatures(olSource.getFeatures());
        this.createAndAddOperator(wkt);
    }

    private createAndAddOperator(wkt: string) {

        const resultType = ResultTypes.POINTS;

        const sourceType = new WKTSourceType({
            wkt: wkt,
            type: resultType,
        });

        const operator = new Operator({
            operatorType: sourceType,
            resultType: resultType,
            projection: Projections.WGS_84
        });

        let symbology: AbstractVectorSymbology;
        switch (resultType) {
            case ResultTypes.POINTS:
                symbology = new ClusteredPointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                });
                break;
            case ResultTypes.POLYGONS:
                symbology = new SimpleVectorSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                });
                break;
            default:
                throw new UnexpectedResultType();
        }

        const layer = new VectorLayer({
            name: this.featureLayerName,
            operator: operator,
            symbology: symbology,
            clustered: false,
        });

        // this.layerService.addLayer(layer);
        this.projectService.addLayer(layer);
    }

    cancelDrawing() {
        this.isDrawingActive = false;
        this.mapService.endDrawInteraction();
    }

    ngOnInit(): void {}

}
