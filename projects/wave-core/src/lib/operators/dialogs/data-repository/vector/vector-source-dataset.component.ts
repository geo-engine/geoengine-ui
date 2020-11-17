import {of as observableOf, Observable} from 'rxjs';
import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {MappingSource, SourceVectorLayerDescription} from '../mapping-source.model';
import {Projection, Projections} from '../../../projection.model';
import {DataType, DataTypes} from '../../../datatype.model';
import { VectorLayer} from '../../../../layers/layer.model';
import {
    PointSymbology,
    VectorSymbology, LineSymbology,
} from '../../../../layers/symbology/symbology.model';
import {Operator} from '../../../operator.model';
import {ProjectService} from '../../../../project/project.service';
import {DataSource} from '@angular/cdk/table';

import {RandomColorService} from '../../../../util/services/random-color.service';
import {OgrSourceType} from '../../../types/ogr-source-type.model';
import {ResultTypes} from '../../../result-type.model';
import {WHITE} from '../../../../colors/color';
import {NotificationService} from '../../../../notification.service';

@Component({
    selector: 'wave-vector-source-dataset',
    templateUrl: './vector-source-dataset.component.html',
    styleUrls: ['./vector-source-dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class VectorSourceDatasetComponent implements OnInit {

    @Input() dataset: MappingSource;
    @Input() searchTerm: string;
    // searchTerm: string; // TODO: this was needed to get prod build working...
    _useRawData = false;
    _showPreview = false;
    _showDescription = false;
    _tableSource: LayerTableDataSource;
    _displayedColumns  = ['title'];


    constructor(
        private projectService: ProjectService,
        private randomColorService: RandomColorService,
        private notificationService: NotificationService,
    ) {

    }

    ngOnInit(): void {
        this._tableSource = new LayerTableDataSource(this.dataset.vectorLayer);
    }

    add(layer: SourceVectorLayerDescription) {

        let operator;
        if (this.dataset.operator === OgrSourceType.TYPE) {
            operator = this.createOgrSourceOperator(layer);
        } else {
            throw new Error('Unsupported operator: ' + this.dataset.operator);
        }

        let clustered = false;
        let symbology;
        switch (operator.resultType) {
            case ResultTypes.POINTS: {
                symbology = PointSymbology.createClusterSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                    fillColorizer: layer.colorizer
                });
                clustered = true;
                break;
            }
            case ResultTypes.POLYGONS: {
                symbology = VectorSymbology.createSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                    fillColorizer: layer.colorizer
                });
                break;
            }
            case ResultTypes.LINES: {
                symbology = LineSymbology.createSymbology({
                    fillRGBA: WHITE,
                    strokeRGBA: this.randomColorService.getRandomColorRgba(),
                    strokeWidth: 2,
                });
                break;
            }
            default: {
                throw new Error('unhandled result type: ' + operator.resultType.name);
            }
        }

        const l = new VectorLayer({
            name: layer.name,
            operator,
            symbology,
            clustered,
        });
        this.projectService.addLayer(l);
    }

    get layers(): Array<SourceVectorLayerDescription> {
        return this.dataset.vectorLayer;
    }

    get layerTableDataSource(): LayerTableDataSource {
        return this._tableSource;
    }

    get displayedColumns(): Array<string> {
        return this._displayedColumns;
    }

    isSingleLayerDataset(): boolean {
        return this.dataset.rasterLayer.length <= 1;
    }

    toggleImages() {
        this._showPreview = !this._showPreview;
    }

    toggleDescriptions() {
        this._showDescription = !this._showDescription;
    }

    /**
     * Creates a gdal_source operator and a wrapping expression operator to transform values if needed.
     */
    createOgrSourceOperator(layer: SourceVectorLayerDescription): Operator {

        if (!layer.geometryType) {
            this.notificationService.error(
                'No geometry type defined in [' + this.dataset.name + '] assuming "POINTS". (channel.id: ' + layer.id + ')'
            );
            layer.geometryType = 'POINTS';
        }

        const sourceDataType = ResultTypes.fromCode(layer.geometryType);

        if (!layer.coords || !layer.coords.crs) {
            this.notificationService.error(
                'No projection or EPSG code defined in [' + this.dataset.name + '] assuming EPSG:4326. (channel.id: ' + layer.id + ')'
            );
            layer.coords = {crs: 'EPSG:4326'};
        }

        const sourceProjection = Projections.fromCode(layer.coords.crs);
        const dataTypes = new Map<string, DataType>();
        layer.numeric.forEach((x) => dataTypes.set(x, DataTypes.Float32));
        layer.textual.forEach((x) => dataTypes.set(x, DataTypes.Alphanumeric));

        const operatorType = new OgrSourceType({
            dataset_id: this.dataset.name,
            layer_id: layer.id,
            textual: layer.textual,
            numeric: layer.numeric

        });

        const sourceOperator = new Operator({
            operatorType,
            resultType: sourceDataType,
            projection: sourceProjection,
            attributes: [].concat(layer.numeric, layer.textual),
            dataTypes,
        });

        return sourceOperator;
    }
}

class LayerTableDataSource extends DataSource<SourceVectorLayerDescription> {
    private layers: Array<SourceVectorLayerDescription>;

    constructor(layers: Array<SourceVectorLayerDescription>) {
        super();
        this.layers = layers;
    }

    connect(): Observable<Array<SourceVectorLayerDescription>> {
        return observableOf(this.layers);
    }

    disconnect() {
    }
}
