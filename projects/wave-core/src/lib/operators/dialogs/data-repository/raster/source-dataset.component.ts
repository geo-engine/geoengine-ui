import {Observable, of as observableOf} from 'rxjs';
import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {MappingSource, SourceRasterLayerDescription, MappingTransform} from '../mapping-source.model';
import {Unit} from '../../../unit.model';
import {RasterSourceType} from '../../../types/raster-source-type.model';
import {ResultTypes} from '../../../result-type.model';
import {Projection, Projections} from '../../../projection.model';
import {DataType, DataTypes} from '../../../datatype.model';
import {RasterLayer} from '../../../../layers/layer.model';
import {MappingRasterSymbology} from '../../../../layers/symbology/symbology.model';
import {Operator} from '../../../operator.model';
import {ProjectService} from '../../../../project/project.service';
import {DataSource} from '@angular/cdk/table';
import {GdalSourceType} from '../../../types/gdal-source-type.model';
import {ExpressionType} from '../../../types/expression-type.model';
import {ColorBreakpointDict} from '../../../../colors/color-breakpoint.model';
import {ColorizerData, IColorizerData} from '../../../../colors/colorizer-data.model';
import {GdalSourceParameterOptions} from '../../../parameter-options/gdal-source-parameter-options.model';
import {ParameterOptionType} from '../../../operator-type-parameter-options.model';
import {Colormap} from '../../../../colors/colormaps/colormap.model';

@Component({
    selector: 'wave-source-dataset',
    templateUrl: './source-dataset.component.html',
    styleUrls: ['./source-dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SourceDatasetComponent implements OnInit, OnChanges {

    @Input() dataset: MappingSource;
    @Input() searchTerm: string;
    _useRawData = false;
    _showPreview = false;
    _showDescription = false;
    _channelSource: ChannelDataSource;
    _displayedColumns = ['name', 'measurement'];

    /**
     * Transform the values of a colorizer to match the transformation of the raster transformation.
     */
    static createAndTransformColorizer(colorizerConfig: IColorizerData, transform: MappingTransform): IColorizerData {
        if (transform) {
            const transformedColorizerConfig: IColorizerData = {
                type: colorizerConfig.type,
                breakpoints: colorizerConfig.breakpoints.map((bp: ColorBreakpointDict) => {
                    return {
                        value: (bp.value as number - transform.offset) * transform.scale,
                        rgba: bp.rgba
                    };
                })
            };
            return transformedColorizerConfig;
        } else {
            return colorizerConfig;
        }
    }

    constructor(
        private projectService: ProjectService,
    ) {

    }

    ngOnInit(): void {
        this._channelSource = new ChannelDataSource(this.dataset.rasterLayer);
    }
    ngOnChanges(changes: SimpleChanges) {
        for (const key in changes) {
            if (changes.hasOwnProperty(key)) {
                switch (key) {
                    // check if there is any time-validity start/end data. If there is start/end data show the column of this data.
                    case 'dataset': {
                        this.dataset.rasterLayer.forEach((element) => {
                            if (element.time_start) {
                                if (!this._displayedColumns.includes('start')) {
                                    this._displayedColumns.push('start');
                                }
                            }
                            if (element.time_end) {
                                if (!this._displayedColumns.includes('end')) {
                                    this._displayedColumns.push('end');
                                }
                            }
                        });
                    }
                }
            }
        }
    }
    valid_colorizer(channel: SourceRasterLayerDescription): IColorizerData {
        if (channel.colorizer) {
            return channel.colorizer;
        } else {
            return ColorizerData.grayScaleColorizer(this.valid_unit(channel));
        }
    }

    valid_unit(channel: SourceRasterLayerDescription): Unit {
        if (channel.hasTransform && !this.useRawData) {
            return channel.transform.unit;
        } else {
            return channel.unit;
        }
    }

    simple_add(channel: SourceRasterLayerDescription) {
        this.add(channel, channel.hasTransform && !this.useRawData);
    }

    add(channel: SourceRasterLayerDescription, doTransform: boolean) {
        const unit: Unit = channel.unit;
        const mappingTransformation = channel.transform;

        let operator;
        if (this.dataset.operator === GdalSourceType.TYPE) {
            operator = this.createGdalSourceOperator(channel, doTransform);
        } else {
            operator = this.createMappingRasterDbSourceOperator(channel, doTransform);
        }

        // if there is no colorizer data defined for the channel, create a 'viridis' coloring with min, max bounds
        let colorizerConfig = (channel.colorizer && ColorizerData.is_valid(channel.colorizer)) ? channel.colorizer
            : Colormap.createColorizerDataWithName(
                'VIRIDIS', unit.min, unit.max
            );

        // if the dataset / channel has a transform specification, the colorizer defined for the raw data also requires transformation
        if (doTransform) {
            colorizerConfig = SourceDatasetComponent.createAndTransformColorizer(colorizerConfig, mappingTransformation);
        }

        const layer = new RasterLayer({
            name: channel.name,
            operator,
            symbology: MappingRasterSymbology.createSymbology({
                unit: (doTransform) ? channel.transform.unit : unit,
                colorizer: colorizerConfig,
            }),
        });
        this.projectService.addLayer(layer);
    }

    @Input('useRawData')
    set useRawData(useRawData: boolean) {
        this._useRawData = useRawData;
    }

    get useRawData(): boolean {
        return this._useRawData;
    }

    get channels(): Array<SourceRasterLayerDescription> {
        return this.dataset.rasterLayer;
    }

    get channelDataSource(): ChannelDataSource {
        return this._channelSource;
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

    toggleTransform() {
        this._useRawData = !this._useRawData;
    }

    /**
     * Creates a gdal_source operator and a wrapping expression operator to transform values if needed.
     */
    createGdalSourceOperator(channel: SourceRasterLayerDescription, doTransform: boolean): Operator {
        const sourceDataType = channel.datatype;
        const sourceUnit: Unit = channel.unit;
        let sourceProjection: Projection;
        if (channel.coords.crs) {
            sourceProjection = Projections.fromCode(channel.coords.crs);
        } else {
            throw new Error('No projection or EPSG code defined in [' + this.dataset.name + ']. channel.id: ' + channel.id);
        }

        const operatorType = new GdalSourceType({
            channelConfig: {
                channelNumber: channel.id,
                displayValue: channel.name,
                methodology: channel.methodology,
            },
            sourcename: this.dataset.source,
            transform: doTransform, // TODO: user selectable transform?
        });

        const operatorParameterOptions = new GdalSourceParameterOptions({
            operatorType: operatorType.toString(),
            channelConfig: {
                kind: ParameterOptionType.DICT_ARRAY,
                options: this.channels.map((c, i) => {
                    return {
                        channelNumber: i,
                        displayValue: c.name,
                        methodology: c.methodology,
                    };
                }),
            }
        });

        const sourceOperator = new Operator({
            operatorType,
            operatorTypeParameterOptions: operatorParameterOptions,
            resultType: ResultTypes.RASTER,
            projection: sourceProjection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.fromCode(sourceDataType)),
            units: new Map<string, Unit>().set('value', sourceUnit),
        });

        if (doTransform && channel.hasTransform) {
            const transformUnit = channel.transform.unit;
            const transformDatatype = DataTypes.fromCode(channel.transform.datatype);

            const transformOperatorType = new ExpressionType({
                unit: transformUnit,
                expression: '(A -' + channel.transform.offset.toString() + ') *' + channel.transform.scale.toString(),
                datatype: transformDatatype,
            });

            const transformOperator = new Operator({
                operatorType: transformOperatorType,
                resultType: ResultTypes.RASTER,
                projection: sourceProjection,
                attributes: ['value'],
                dataTypes: new Map<string, DataType>().set('value', transformDatatype),
                units: new Map<string, Unit>().set('value', transformUnit),
                rasterSources: [sourceOperator],
            });
            return transformOperator;
        }

        return sourceOperator;
    }

    createMappingRasterDbSourceOperator(channel: SourceRasterLayerDescription, doTransform: boolean) {
        let dataType = channel.datatype;
        let unit: Unit = channel.unit;

        if (doTransform && channel.hasTransform) {
            unit = channel.transform.unit;
            dataType = channel.transform.datatype;
        }

        let sourceProjection: Projection;
        if (channel.coords.crs) {
            sourceProjection = Projections.fromCode(channel.coords.crs);
        } else {
            throw new Error('No projection or EPSG code defined in [' + this.dataset.name + ']. channel.id: ' + channel.id);
        }

        const operatorType = new RasterSourceType({
            channel: channel.id,
            sourcename: this.dataset.source,
            transform: doTransform, // TODO: user selectable transform?
        });

        const operator = new Operator({
            operatorType,
            resultType: ResultTypes.RASTER,
            projection: sourceProjection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.fromCode(dataType)),
            units: new Map<string, Unit>().set('value', unit),
        });

        return operator;
    }

}

class ChannelDataSource extends DataSource<SourceRasterLayerDescription> {
    private channels: Array<SourceRasterLayerDescription>;

    constructor(channels: Array<SourceRasterLayerDescription>) {
        super();
        this.channels = channels;
    }

    connect(): Observable<Array<SourceRasterLayerDescription>> {
        return observableOf(this.channels);
    }

    disconnect() {
    }
}
