import {first, map} from 'rxjs/operators';
import {Observable, BehaviorSubject} from 'rxjs';

import {Component, ChangeDetectionStrategy, Inject} from '@angular/core';

import {
    UserService,
    RandomColorService,
    ProjectService,
    DataTypes,
    DataType,
    Unit,
    ResultTypes,
    Projections,
    ComplexPointSymbology,
    VectorLayer,
    Operator,
} from 'wave-core';

import {AbcdArchive} from './abcd.model';
import {ABCDSourceType, ABCDSourceTypeConfig} from '../../types/abcd-source-type.model';
import {BasicColumns} from '../baskets/csv.model';
import {GFBioUserService} from '../../../users/user.service';

type Grouped<T> = Iterable<Group<T>>;

interface Group<T> {
    group: Array<T>;
    name: string;
}

@Component({
    selector: 'wave-gfbio-abcd-repository',
    templateUrl: './abcd-repository.component.html',
    styleUrls: ['./abcd-repository.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbcdRepositoryComponent {

    searchString$ = new BehaviorSubject<string>('');
    groups: Observable<Grouped<AbcdArchive>>;

    constructor(
        @Inject(UserService) private readonly userService: GFBioUserService,
        private randomColorService: RandomColorService,
        private projectService: ProjectService,
    ) {
        this.groups = this.userService.getAbcdArchivesStream().pipe(map(archives => {
            const groups: { [groupname: string]: Group<AbcdArchive> } = {};

            for (const a of archives) {
                if (!groups[a.provider]) {
                    groups[a.provider] = {
                        group: [],
                        name: a.provider,
                    };
                }
                groups[a.provider].group.push(a);
            }

            const iterableGroups: Array<Group<AbcdArchive>> = [];
            const keys = Object.keys(groups).sort();
            for (const key of keys) {
                const value = groups[key];
                value.group = value.group.sort((x, y) => (x.dataset < y.dataset) ? 0 : 1);
                iterableGroups.push(value);
            }

            return iterableGroups;
        }));
    }

    add(archive: AbcdArchive) {

        const basicColumns: BasicColumns = {
            numeric: [],
            textual: [],
        };

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        this.userService.getSourceSchemaAbcd().pipe(first()).subscribe(sourceSchema => {

            for (const attribute of sourceSchema) {

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
                attributes,
                dataTypes,
                units,
            });

            const clustered = true;
            const layer = new VectorLayer<ComplexPointSymbology>({
                name: archive.dataset,
                operator,
                symbology: ComplexPointSymbology.createClusterSymbology({
                    fillRGBA: this.randomColorService.getRandomColorRgba(),
                }),
                // data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                //    operator,
                //    clustered,
                // }),
                // provenance: this.mappingQueryService.getProvenanceStream(operator),
                clustered,
            });
            // this.layerService.addLayer(layer);
            this.projectService.addLayer(layer);
        });

    }
}
