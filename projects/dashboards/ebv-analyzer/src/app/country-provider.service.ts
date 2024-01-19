import {Injectable} from '@angular/core';
import {BehaviorSubject, mergeMap, Observable} from 'rxjs';
import {COUNTRY_LIST} from './country-selector/country-selector-data.model';
import {PolygonSymbology, ProjectService, VectorLayer, WorkflowDict} from '@geoengine/core';
import {DataSelectionService} from './data-selection.service';
import {countryDatasetName} from './country-selector/country-data.model';

export interface Country {
    name: string;
    minx: number;
    maxx: number;
    miny: number;
    maxy: number;
    tifChannelId: number;
}

@Injectable({
    providedIn: 'root',
})
export class CountryProviderService {
    public readonly selectedCountry$ = new BehaviorSubject<Country | undefined>(undefined);
    public readonly availabeCountries: Array<Country>;

    constructor(
        private readonly projectService: ProjectService,
        private readonly dataSelectionService: DataSelectionService,
    ) {
        this.availabeCountries = COUNTRY_LIST.map((r) => {
            const [name, maxx, maxy, minx, miny, tifChannelId] = r;
            return {
                name,
                minx,
                maxx,
                miny,
                maxy,
                tifChannelId,
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }

    public setSelectedCountry(country: Country): void {
        this.selectedCountry$.next(country);

        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'OgrSource',
                params: {
                    data: 'polygon_country_' + countryDatasetName(country.name),
                },
            },
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setPolygonLayer(
                        new VectorLayer({
                            workflowId,
                            name: country.name,
                            symbology: PolygonSymbology.fromPolygonSymbologyDict({
                                type: 'polygon',
                                stroke: {
                                    width: {
                                        type: 'static',
                                        value: 2,
                                    },
                                    color: {
                                        type: 'static',
                                        color: [255, 0, 0, 255],
                                    },
                                },
                                fillColor: {
                                    type: 'static',
                                    color: [0, 0, 0, 0],
                                },
                                autoSimplified: true,
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe(() => {
                // success
            });
    }

    public clearSelectedCountry(): void {
        this.selectedCountry$.next(undefined);
    }

    public getSelectedCountryStream(): Observable<Country | undefined> {
        return this.selectedCountry$;
    }
}
