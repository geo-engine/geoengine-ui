import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Observable, of, throwError} from 'rxjs';
import {Nature40CatalogEntry, UserService} from '../../../users/user.service';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {OgrSourceType} from '../../types/ogr-source-type.model';
import {MappingRequestParameters} from '../../../queries/request-parameters.model';
import {HttpClient} from '@angular/common/http';
import {Config} from '../../../config.service';
import {first, flatMap} from 'rxjs/operators';
import {Unit, UnitMappingDict} from '../../unit.model';
import {Operator} from '../../operator.model';
import {ProjectService} from '../../../project/project.service';
import {NotificationService} from '../../../notification.service';
import {RasterLayer} from '../../../layers/layer.model';
import {MappingColorizerRasterSymbology} from '../../../layers/symbology/symbology.model';
import {Map as ImmutableMap} from 'immutable';
import {DataType, DataTypes} from '../../datatype.model';
import {ResultTypes} from '../../result-type.model';
import {Projections} from '../../projection.model';
import {GdalSourceType} from '../../types/gdal-source-type.model';
import {Provenance} from '../../../provenance/provenance.model';

@Component({
    selector: 'wave-nature40-catalog',
    templateUrl: './nature40-catalog.component.html',
    styleUrls: ['./nature40-catalog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nature40CatalogComponent implements OnInit {

    readonly RASTER_ICON_URL: string = RasterSourceType.ICON_URL;
    readonly VECTOR_ICON_URL: string = OgrSourceType.ICON_URL;

    readonly catalog$: Observable<Map<string, Array<Nature40CatalogEntry>>>;

    constructor(private userService: UserService,
                private projectService: ProjectService,
                private notificationService: NotificationService,
                private http: HttpClient,
                private config: Config) {
        this.catalog$ = this.userService.getNature40Catalog();
    }

    ngOnInit() {
    }

    add(entry: Nature40CatalogEntry) {
        this.queryMetadata(entry).pipe(
            first(),
            flatMap(metadata => {
                switch (metadata.type) {
                    case 'gdal_source':
                        return of(Nature40CatalogComponent.createGdalSourceLayer(entry, metadata as GdalSourceMetadata));
                    default:
                        return throwError(`Layer type »${metadata.type}« is not yet supported`);
                }
            })
        ).subscribe(
            layer => {
                this.projectService.addLayer(layer);
            },
            error => this.notificationService.error(error),
        );
    }

    private static createGdalSourceLayer(entry: Nature40CatalogEntry,
                                         metadata: GdalSourceMetadata): RasterLayer<MappingColorizerRasterSymbology> {
        for (const channel of metadata.channels) { // TODO: smart layer for other channels
            const datatype = DataTypes.fromCode(Nature40CatalogComponent.rsdbToMappingDataType(channel.datatype));
            const unit = Unit.fromMappingDict(channel.unit);

            const operator = new Operator({
                attributes: [Operator.RASTER_ATTRIBTE_NAME],
                dataTypes: ImmutableMap<string, DataType>().set(
                    Operator.RASTER_ATTRIBTE_NAME,
                    datatype,
                ),
                operatorType: new GdalSourceType({
                    channelConfig: {
                        displayValue: channel.name,
                        channelNumber: 0,
                    },
                    sourcename: channel.file_name,
                    transform: false,
                    gdal_params: {
                        channels: [{
                            channel: channel.channel,
                            datatype: datatype.getCode(),
                            file_name: channel.file_name,
                            unit,
                        }],
                        coords: {
                            crs: channel.crs,
                        },
                        provenance: Nature40CatalogComponent.provenanceOfEntry(entry),
                    }
                }),
                operatorTypeParameterOptions: undefined,
                projection: Projections.fromCode(channel.crs),
                resultType: ResultTypes.RASTER,
                units: ImmutableMap<string, Unit>().set(
                    Operator.RASTER_ATTRIBTE_NAME,
                    unit,
                )
            });

            return new RasterLayer({
                name: entry.title,
                operator,
                symbology: new MappingColorizerRasterSymbology({unit}),
            });
        }
    }

    private static provenanceOfEntry(entry: Nature40CatalogEntry): Provenance {
        return {
            citation: `${entry.title}${entry.description ? ' - ' : ''}${entry.description}`,
            license: '',
            uri: entry.user_url,
            local_identifier: undefined,
        };
    }

    private static rsdbToMappingDataType(datatype: string): string {
        // TODO: migrate function to backend
        return datatype.charAt(0).toUpperCase() + datatype.slice(1);
    }

    private queryMetadata(entry: Nature40CatalogEntry): Observable<Nature40CatalogEntryMetadata> {
        const parameters = new MappingRequestParameters({
            service: 'nature40',
            sessionToken: this.userService.getSession().sessionToken,
            request: 'resolveCatalogEntry',
            parameters: {entry: JSON.stringify(entry)},
        });

        return this.http.post<{ result: boolean | string, metadata?: Nature40CatalogEntryMetadata }>(
            this.config.MAPPING_URL,
            parameters.toMessageBody(true),
            {headers: parameters.getHeaders()},
        ).pipe(
            flatMap(response => {
                if (typeof response.result === 'string') { // error string is in the field
                    return throwError(response.result);
                }

                return of(response.metadata);
            }),
        );
    }
}

interface Nature40CatalogEntryMetadata {
    type: string;
}

interface GdalSourceMetadata extends Nature40CatalogEntryMetadata {
    type: 'gdal_source';
    channels: Array<{
        crs: string;
        channel: number;
        datatype: string;
        file_name: string;
        name: string;
        unit: UnitMappingDict;
    }>;
}
