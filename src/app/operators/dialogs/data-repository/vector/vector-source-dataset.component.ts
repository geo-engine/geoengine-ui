
import {of as observableOf, Observable} from 'rxjs';
import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {MappingSource, MappingSourceRasterLayer, MappingSourceVectorLayer} from '../mapping-source.model';
import {Projection, Projections} from '../../../projection.model';
import {DataType, DataTypes} from '../../../datatype.model';
import { VectorLayer} from '../../../../layers/layer.model';
import {
    ComplexPointSymbology,
    ComplexVectorSymbology,
} from '../../../../layers/symbology/symbology.model';
import {Operator} from '../../../operator.model';
import {ProjectService} from '../../../../project/project.service';
import {DataSource} from '@angular/cdk/table';

import {RandomColorService} from '../../../../util/services/random-color.service';
import {OgrSourceType} from '../../../types/ogr-source-type.model';
import {ResultTypes} from '../../../result-type.model';

@Component({
    selector: 'wave-vector-source-dataset',
    templateUrl: './vector-source-dataset.component.html',
    styleUrls: ['./vector-source-dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class VectorSourceDatasetComponent implements OnInit {

    @Input() dataset: MappingSource;

    searchTerm: string; // TODO: this was needed to get prod build working...
    _useRawData = false;
    _showPreview = false;
    _showDescription = false;
    _tableSource: LayerTableDataSource;
    _displayedColumns  = ['title'];


    constructor(
        private projectService: ProjectService,
        private randomColorService: RandomColorService,
    ) {

    }

    ngOnInit(): void {
        this._tableSource = new LayerTableDataSource(this.dataset.vectorLayer);
    }

    add(layer: MappingSourceVectorLayer) {

        let operator;
        if (this.dataset.operator === OgrSourceType.TYPE) {
            operator = this.createOgrSourceOperator(layer);
        } else {
            throw new Error('Unsupported operator: ' + this.dataset.operator)
        }

        const l = new VectorLayer({
            name: layer.name,
            operator: operator,
            symbology: ComplexPointSymbology.createClusterSymbology({
                fillRGBA: this.randomColorService.getRandomColorRgba(),
                colorizer: layer.colorizer
            }),
            clustered: true
        });
        this.projectService.addLayer(l);
    }

    get layers(): Array<MappingSourceVectorLayer> {
        return this.dataset.vectorLayer
    }

    get layerTableDataSource(): LayerTableDataSource {
        return this._tableSource;
    }

    get displayedColumns(): Array<String> {
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
     * @param {MappingSourceRasterLayer} channel
     * @param {boolean} doTransform
     * @returns {Operator}
     */
    createOgrSourceOperator(layer: MappingSourceVectorLayer): Operator {
        const sourceDataType = ResultTypes.fromCode(layer.geometryType); // TODO: move this to the user service?
        let sourceProjection: Projection;
        if (layer.coords.crs) {
            sourceProjection = Projections.fromCode(layer.coords.crs);
        } else {
            throw new Error('No projection or EPSG code defined in [' + this.dataset.name + ']. channel.id: ' + layer.id);
        }

        const dataTypes = new Map<string, DataType>();
        layer.numeric.forEach((x) => dataTypes.set(x, DataTypes.Float32));
        layer.textual.forEach((x) => dataTypes.set(x, DataTypes.Alphanumeric));

        const operatorType = new OgrSourceType({
            name: this.dataset.name,
            layer_name: layer.name,
            textual: layer.textual,
            numeric: layer.numeric
        });

        const sourceOperator = new Operator({
            operatorType: operatorType,
            resultType: sourceDataType,
            projection: sourceProjection,
            attributes: [].concat(layer.numeric, layer.textual),
            dataTypes: dataTypes,
        });

        return sourceOperator;
    }
}

class LayerTableDataSource extends DataSource<MappingSourceVectorLayer> {
    private layers: Array<MappingSourceVectorLayer>;

    constructor(layers: Array<MappingSourceVectorLayer>) {
        super();
        this.layers = layers;
    }

    connect(): Observable<Array<MappingSourceVectorLayer>> {
        return observableOf(this.layers);
    }

    disconnect() {
    }
}
