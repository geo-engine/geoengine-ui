import {ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {first, flatMap, map} from 'rxjs/operators';

import {Map as ImmutableMap} from 'immutable';

import {
    RasterSourceType,
    OgrSourceType,
    MappingRequestParameters,
    Config,
    Unit,
    UnitMappingDict,
    Operator,
    ProjectService,
    NotificationService,
    RasterLayer,
    MappingRasterSymbology,
    DataType,
    DataTypes,
    ResultTypes,
    Projections,
    GdalSourceType,
    Provenance, UserService,
} from 'wave-core';

import {Nature40CatalogEntry, Nature40UserService} from '../../../users/nature40-user.service';
import {AppConfig} from '../../../app-config.service';

@Component({
    selector: 'wave-nature40-catalog',
    templateUrl: './nature40-catalog.component.html',
    styleUrls: ['./nature40-catalog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nature40CatalogComponent implements OnInit, OnDestroy {
    readonly RASTER_ICON_URL: string = RasterSourceType.ICON_URL;
    readonly VECTOR_ICON_URL: string = OgrSourceType.ICON_URL;

    readonly catalog$: Observable<Map<string, Array<Nature40CatalogEntry>>>;
    isResolving = new Map<Nature40CatalogEntry, BehaviorSubject<boolean>>();

    constructor(@Inject(Config) private readonly config: AppConfig,
                @Inject(UserService) private readonly userService: Nature40UserService,
                private readonly projectService: ProjectService,
                private readonly notificationService: NotificationService,
                private readonly http: HttpClient) {
        this.catalog$ = this.userService.getNature40Catalog();
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.isResolving.forEach((subject, _entry) => subject.complete());
    }

    isNotResolving$(entry: Nature40CatalogEntry): Observable<boolean> {
        if (!this.isResolving.has(entry)) {
            this.isResolving.set(entry, new BehaviorSubject(false));
        }

        return this.isResolving.get(entry).pipe(map(value => !value));
    }

    add(entry: Nature40CatalogEntry) {
        if (this.isResolving.has(entry)) {
            this.isResolving.get(entry).next(true);
        } else {
            this.isResolving.set(entry, new BehaviorSubject<boolean>(true));
        }

        this.queryMetadata(entry).pipe(
            first(),
            flatMap(metadata => {
                if (!metadata) {
                    return throwError(`Datatype of »${entry.title}« is not yet supported`);
                }

                switch (metadata.type) {
                    case 'gdal_source':
                        return of(Nature40CatalogComponent.createGdalSourceLayer(entry, metadata as GdalSourceMetadata));
                    default:
                        return throwError(`Layer type »${metadata.type}« is not yet supported`);
                }
            }),
        ).subscribe(
            layer => {
                this.isResolving.get(entry).next(false);
                this.projectService.addLayer(layer);
            },
            error => {
                this.isResolving.get(entry).next(false);
                this.notificationService.error(error);
            },
        );
    }

    private static createGdalSourceLayer(entry: Nature40CatalogEntry,
                                         metadata: GdalSourceMetadata): RasterLayer<MappingRasterSymbology> {
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
                symbology: MappingRasterSymbology.createSymbology({unit}),
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
