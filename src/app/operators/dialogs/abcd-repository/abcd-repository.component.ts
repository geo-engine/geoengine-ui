import {Component, ChangeDetectionStrategy} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs/Rx';
import {LayerService} from '../../../layers/layer.service';
import {VectorLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {ResultTypes} from '../../result-type.model';
import {DataType, DataTypes} from '../../datatype.model';
import {AbcdArchive} from './abcd.model';
import {ABCDSourceType, ABCDSourceTypeConfig} from '../../types/abcd-source-type.model';
import {Projections} from '../../projection.model';
import {Unit} from '../../unit.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {UserService} from '../../../users/user.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {BasicColumns} from '../baskets/csv.model';
import {ComplexPointSymbology} from '../../../layers/symbology/symbology.model';
import {ProjectService} from '../../../project/project.service';

type Grouped<T> = Iterable<Group<T>>;
interface Group<T> {
    group: Array<T>;
    name: string;
}

@Component({
    selector: 'wave-abcd-repository',
    templateUrl: './abcd-repository.component.html',
    styleUrls: ['./abcd-repository.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbcdRepositoryComponent {

    searchString$ = new BehaviorSubject<string>('');
    groups: Observable<Grouped<AbcdArchive>>;

    constructor(
        // private mappingQueryService: MappingQueryService,
        // private layerService: LayerService,
        private userService: UserService,
        private randomColorService: RandomColorService,
        private projectService: ProjectService,
    ) {
        this.groups = this.userService.getAbcdArchivesStream().map(archives => {
            let groups: {[groupname: string]: Group<AbcdArchive>} = {};

            for (let a of archives) {
                if ( !groups[a.provider] ) {
                    groups[a.provider] = {
                        group: [],
                        name: a.provider,
                    };
                }
                groups[a.provider].group.push(a);
            }

            const iterableGroups: Array<Group<AbcdArchive>> = [];
            const keys = Object.keys(groups).sort();
            for (let key of keys) {
                const value = groups[key];
                value.group = value.group.sort((x, y) => (x.dataset < y.dataset) ? 0 : 1);
                iterableGroups.push(value);
            }

            return iterableGroups;
        });
    }

    add(archive: AbcdArchive) {

        const basicColumns: BasicColumns = {
            numeric: [],
            textual: [],
        };

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        this.userService.getSourceSchemaAbcd().first().subscribe(sourceSchema => {

            for (let attribute of sourceSchema) {

                if (attribute.numeric) {
                    basicColumns.numeric.push(attribute.name);
                    attributes.push(attribute.name);
                    dataTypes.set(attribute.name, DataTypes.Float64); // TODO: get more accurate type
                    units.set(attribute.name, Unit.defaultUnit);
                } else {
                    basicColumns.textual.push(attribute.name);
                    attributes.push(attribute.name);
                    dataTypes.set(attribute.name, DataTypes.Alphanumeric); // TODO: get more accurate type
                    units.set(attribute.name, Unit.defaultUnit);
                }
            }

            const sourceTypeConfig: ABCDSourceTypeConfig = {
                provider: archive.provider,
                id: archive.file,
                columns: basicColumns,
            };

            const operator = new Operator({
                operatorType: new ABCDSourceType(sourceTypeConfig),
                resultType: ResultTypes.POINTS,
                projection: Projections.WGS_84,
                attributes: attributes,
                dataTypes: dataTypes,
                units: units,
            });

            const clustered = true;
            const layer = new VectorLayer<ComplexPointSymbology>({
                name: archive.dataset,
                operator: operator,
                symbology: ComplexPointSymbology.createClusterSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                }),
                // data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                //    operator,
                //    clustered,
                // }),
                // provenance: this.mappingQueryService.getProvenanceStream(operator),
                clustered: clustered,
            });
            // this.layerService.addLayer(layer);
            this.projectService.addLayer(layer);
        });

    }
}
