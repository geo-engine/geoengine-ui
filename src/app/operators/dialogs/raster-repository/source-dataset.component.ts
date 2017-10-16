import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {MappingSource, MappingSourceChannel} from './mapping-source.model';
import {Unit} from '../../unit.model';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {ResultTypes} from '../../result-type.model';
import {Projections} from '../../projection.model';
import {DataType, DataTypes} from '../../datatype.model';
import {RasterLayer} from '../../../layers/layer.model';
import {MappingColorizerRasterSymbology} from '../../../layers/symbology/symbology.model';
import {Operator} from '../../operator.model';
import {ProjectService} from '../../../project/project.service';
import {DataSource} from '@angular/cdk/table';
import {Observable} from 'rxjs/Observable';

@Component({
    selector: 'wave-source-dataset',
    templateUrl: './source-dataset.component.html',
    styleUrls: ['./source-dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SourceDatasetComponent implements OnInit {

    private _dataset: MappingSource;
    private _useRawData = false;
    private _showPreview = false;
    private _showDescription = false;
    private _channelSource;

    constructor(
        private projectService: ProjectService
    ) {

    }

    ngOnInit(): void {
        this._channelSource = new ChannelDataSource(this.dataset.channels);
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
        console.log("meh" + doTransform);
        let dataType = channel.datatype;
        let unit: Unit = channel.unit;

        if (doTransform && channel.hasTransform) {
            unit = channel.transform.unit;
            dataType = channel.transform.datatype;
        }

        const operator = new Operator({
            operatorType: new RasterSourceType({
                channel: channel.id,
                sourcename: this._dataset.source,
                transform: doTransform, // TODO: user selectable transform?
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.fromCode('EPSG:' + this._dataset.coords.epsg),
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set(
                'value', DataTypes.fromCode(dataType)
            ),
            units: new Map<string, Unit>().set('value', unit),
        });

        const layer = new RasterLayer({
            name: channel.name,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology({unit: unit}),
        });
        this.projectService.addLayer(layer);
    }

    @Input('dataset')
    set dataset(dataset: MappingSource) {
        this._dataset = dataset;
    }

    get dataset(): MappingSource {
        return this._dataset;
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
