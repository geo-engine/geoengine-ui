import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {COUNTRY_LIST} from './country-selector/country-selector-data.model';
import {ProjectService, RasterLayer, VectorLayer} from 'wave-core';

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

    private rasterLayer?: RasterLayer;
    private vectorLayer?: VectorLayer;

    constructor(private readonly projectService: ProjectService) {
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
        });
    }

    public replaceRasterLayerOnMap(): void {
        // TODO: implement
        //
        // const country = this.selectedCountry$.value;
        // if (!country) {
        //     return;
        // }
        // // the gdal source for the country raster
        // const countryOperatorType = new GdalSourceType({
        //     channelConfig: {
        //         channelNumber: country.tif_channel_id, // map to gdal source logic
        //         displayValue: country.name,
        //     },
        //     sourcename: 'ne_10m_admin_0_countries_as_raster',
        //     transform: false,
        // });
        // const countrySourceOperator = new Operator({
        //     operatorType: countryOperatorType,
        //     resultType: ResultTypes.RASTER,
        //     projection: Projections.WGS_84,
        //     attributes: ['value'],
        //     dataTypes: new Map<string, DataType>().set('value', DataTypes.Byte),
        //     units: new Map<string, Unit>().set('value', Unit.defaultUnit),
        // });
        // const newLayer = new RasterLayer({
        //     name: country.name,
        //     operator: countrySourceOperator,
        //     symbology: MappingRasterSymbology.createSymbology({
        //         unit: {min: 0, max: 1, measurement: 'mask', classes: [], interpolation: 1, unit: 'none'},
        //     }),
        // });
        // if (this.rasterLayer) {
        //     try {
        //         this.projectService.removeLayer(this.rasterLayer);
        //     } catch (e) {
        //         // TODO: rule out that this can fail
        //     }
        // }
        // this.projectService.addLayer(newLayer);
        // this.rasterLayer = newLayer;
    }

    public replaceVectorLayerOnMap(): void {
        // TODO: implement
        //
        // const country = this.selectedCountry$.value;
        // if (!country) {
        //     return;
        // }
        // // the gdal source for the country raster
        // const countryOperatorType = new OgrSourceType({
        //     dataset_id: 'ne_10m_admin_0_countries_as layer_by_rasterid',
        //     layer_id: 'feature_' + country.tif_channel_id,
        //     numeric: [],
        //     textual: [],
        // });
        // const countrySourceOperator = new Operator({
        //     operatorType: countryOperatorType,
        //     resultType: ResultTypes.POLYGONS,
        //     projection: Projections.WGS_84,
        //     attributes: ['value'],
        //     dataTypes: new Map<string, DataType>().set('tif_channel_id', DataTypes.Float32).set('NAME', DataTypes.Alphanumeric),
        //     units: new Map<string, Unit>().set('tif_chn_id', Unit.defaultUnit).set('NAME', Unit.defaultUnit),
        // });
        // const newLayer = new VectorLayer({
        //     name: country.name,
        //     operator: countrySourceOperator,
        //     symbology: VectorSymbology.createSymbology({
        //         fillRGBA: {r: 0, g: 0, b: 0, a: 0},
        //         strokeRGBA: {r: 255, g: 0, b: 0, a: 1},
        //         strokeWidth: 3,
        //     }),
        // });
        // if (this.vectorLayer) {
        //     try {
        //         this.projectService.removeLayer(this.vectorLayer);
        //     } catch (e) {
        //         // TODO: rule out that this can fail
        //     }
        // }
        // this.projectService.addLayer(newLayer);
        // this.vectorLayer = newLayer;
    }

    public setSelectedCountry(country: Country): void {
        this.selectedCountry$.next(country);
        this.replaceVectorLayerOnMap();
    }

    public clearSelectedCountry(): void {
        this.selectedCountry$.next(undefined);
    }

    public getSelectedCountryStream(): Observable<Country | undefined> {
        return this.selectedCountry$;
    }
}
