import {Component, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import {RasterLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {ResultTypes} from '../../result-type.model';
import {DataType, DataTypes} from '../../datatype.model';
import {MappingSource, MappingSourceChannel} from './mapping-source.model';
import {Projections} from '../../projection.model';
import {Unit} from '../../unit.model';
import {MappingColorizerRasterSymbology} from '../../../layers/symbology/symbology.model';
import {UserService} from '../../../users/user.service';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {ProjectService} from '../../../project/project.service';

@Component({
    selector: 'wave-raster-repository',
    templateUrl: './raster-repository.component.html',
    styleUrls: ['./raster-repository.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class RasterRepositoryComponent {

    searchTerm: String = '';

    private sources: Observable<Array<MappingSource>>;

    constructor(
        private projectService: ProjectService,
        private userService: UserService
    ) {
        this.sources = this.userService.getRasterSourcesStream();
    }

    add(source: MappingSource, channel: MappingSourceChannel, doTransform: boolean) {
        let dataType = channel.datatype;
        let unit: Unit = channel.unit;

        if (doTransform && channel.hasTransform) {
            unit = channel.transform.unit;
            dataType = channel.transform.datatype;
        }

        const operator = new Operator({
            operatorType: new RasterSourceType({
                channel: channel.id,
                sourcename: source.source,
                transform: doTransform, // TODO: user selectable transform?
            }),
            resultType: ResultTypes.RASTER,
            projection: Projections.fromCode('EPSG:' + source.coords.epsg),
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

    reload() {
        this.userService.reloadRasterSources();
    }
}
