import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {MappingSource, MappingSourceChannel, MappingTransform} from './mapping-source.model';
import {Unit} from '../../unit.model';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {ResultTypes} from '../../result-type.model';
import {Projection, Projections} from '../../projection.model';
import {DataType, DataTypes} from '../../datatype.model';
import {RasterLayer} from '../../../layers/layer.model';
import {
    MappingColorizerRasterSymbology} from '../../../layers/symbology/symbology.model';
import {Operator} from '../../operator.model';
import {ProjectService} from '../../../project/project.service';
import {DataSource} from '@angular/cdk/table';
import {Observable} from 'rxjs/Observable';
import {GdalSourceType} from '../../types/gdal-source-type.model';
import {ExpressionType} from '../../types/expression-type.model';
import {ColorBreakpointDict} from '../../../colors/color-breakpoint.model';
import {ColorizerData, IColorizerData} from '../../../colors/colorizer-data.model';

@Component({
    selector: 'wave-source-dataset',
    templateUrl: './source-dataset.component.html',
    styleUrls: ['./source-dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SourceDatasetComponent implements OnInit {

    @Input() dataset: MappingSource;

    private _useRawData = false;
    private _showPreview = false;
    private _showDescription = false;
    private _channelSource;
    private _displayedColumns  = ['name', 'measurement'];

    /**
     * Transform the values of a colorizer to match the transformation of the raster transformation.
     * @param {IColorizerData} colorizerConfig
     * @param {MappingTransform} transform
     * @returns {IColorizerData}
     */
    static createAndTransformColorizer(colorizerConfig: IColorizerData, transform: MappingTransform): IColorizerData {
        if ( transform ) {
            const transformedColorizerConfig: IColorizerData = {
                type: colorizerConfig.type,
                breakpoints: colorizerConfig.breakpoints.map( (bp: ColorBreakpointDict) => {
                    return  {
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
        this._channelSource = new ChannelDataSource(this.dataset.channels);
    }

    valid_colorizer(channel: MappingSourceChannel): IColorizerData {
        if (channel.colorizer) {
            return channel.colorizer;
        } else if (this.dataset.colorizer) {
            return this.dataset.colorizer;
        } else {
            return ColorizerData.grayScaleColorizer(this.valid_unit(channel));
        }
    }

    valid_unit(channel: MappingSourceChannel): Unit {
        if (channel.hasTransform && !this.useRawData) {
            return channel.transform.unit;
        } else {
            return channel.unit;
        }
    }

    simple_add(channel: MappingSourceChannel) {
        this.add(channel, channel.hasTransform && !this.useRawData )
    }

    add(channel: MappingSourceChannel, doTransform: boolean) {
        const unit: Unit = channel.unit;
        const mappingTransformation = channel.transform;


        let operator;
        if (this.dataset.operator === GdalSourceType.TYPE) {
            operator = this.createGdalSourceOperator(channel, doTransform);
        } else {
            operator = this.createMappingRasterDbSourceOperator(channel, doTransform);
        }

        let colorizerConfig = (channel.colorizer) ? channel.colorizer : this.dataset.colorizer;
        if (doTransform) {
            colorizerConfig = SourceDatasetComponent.createAndTransformColorizer(colorizerConfig, mappingTransformation);
        }

        const layer = new RasterLayer({
            name: channel.name,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology({
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

    get channels(): Array<MappingSourceChannel> {
        return this.dataset.channels
    }

    get channelDataSource(): ChannelDataSource {
        return this._channelSource;
    }

    get displayedColumns(): Array<String> {
        return this._displayedColumns;
    }

    isSingleLayerDataset(): boolean {
        return this.dataset.channels.length <= 1;
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
     * @param {MappingSourceChannel} channel
     * @param {boolean} doTransform
     * @returns {Operator}
     */
    createGdalSourceOperator(channel: MappingSourceChannel,  doTransform: boolean): Operator {
        const sourceDataType = channel.datatype;
        const sourceUnit: Unit = channel.unit;
        let sourceProjection: Projection;
        if (this.dataset.coords.crs) {
            sourceProjection = Projections.fromCode(this.dataset.coords.crs);
        } else if (this.dataset.coords.epsg) {
            sourceProjection = Projections.fromCode('EPSG:' + this.dataset.coords.epsg);
        } else {
            throw new Error('No projection or EPSG code defined in [' + this.dataset.name + ']. channel.id: ' + channel.id);
        }

        const operatorType = new GdalSourceType({
            channel: channel.id,
            sourcename: this.dataset.source,
            transform: doTransform, // TODO: user selectable transform?
        });

        const sourceOperator = new Operator({
            operatorType: operatorType,
            resultType: ResultTypes.RASTER,
            projection: sourceProjection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.fromCode(sourceDataType)),
            units: new Map<string, Unit>().set('value', sourceUnit),
        });

        // console.log('doTransform', doTransform, 'unit', sourceUnit, 'expression', 'A', 'datatype', sourceDataType, 'channel', channel);
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

    createMappingRasterDbSourceOperator(channel: MappingSourceChannel, doTransform: boolean) {
        let dataType = channel.datatype;
        let unit: Unit = channel.unit;

        if (doTransform && channel.hasTransform) {
            unit = channel.transform.unit;
            dataType = channel.transform.datatype;
        }

        let sourceProjection: Projection;
        if (this.dataset.coords.crs) {
            sourceProjection = Projections.fromCode(this.dataset.coords.crs);
        } else if (this.dataset.coords.epsg) {
            sourceProjection = Projections.fromCode('EPSG:' + this.dataset.coords.epsg);
        } else {
            throw new Error('No projection or EPSG code defined in [' + this.dataset.name + ']. channel.id: ' + channel.id);
        }

        const operatorType = new RasterSourceType({
            channel: channel.id,
            sourcename: this.dataset.source,
            transform: doTransform, // TODO: user selectable transform?
        });

        const operator = new Operator({
            operatorType: operatorType,
            resultType: ResultTypes.RASTER,
            projection: sourceProjection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', DataTypes.fromCode(dataType)),
            units: new Map<string, Unit>().set('value', unit),
        });

        return operator;
    }

}

class ChannelDataSource extends DataSource<MappingSourceChannel> {
    private channels: Array<MappingSourceChannel>;

    constructor(channels: Array<MappingSourceChannel>) {
        super();
        this.channels = channels;
    }

    connect(): Observable<Array<MappingSourceChannel>> {
        return Observable.of(this.channels);
    }

    disconnect() {
    }
}
