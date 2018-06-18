import {
    DataPropertiesDict, FormStatus,
    SpatialPropertiesDict, TemporalPropertiesDict
} from '../csv-config/csv-properties/csv-properties.component';
import {Subject, BehaviorSubject} from 'rxjs';
import {Injectable} from '@angular/core';
import {IntervalFormat} from '../interval.enum';
import {Projections} from '../../../projection.model';

@Injectable()
export class CsvPropertiesService {
    private dataProperties = new BehaviorSubject<DataPropertiesDict>({
        delimiter: ',',
        decimalSeparator: '.',
        isTextQualifier: true,
        textQualifier: '"',
        isHeaderRow: true,
        headerRow: 0,
    });
    private spatialProperties = new BehaviorSubject<SpatialPropertiesDict>({
        xColumn: -1,
        yColumn: -1,
        spatialReferenceSystem: null,
        coordinateFormat: '',
        isWkt: false,
        wktResultType: null,
    });
    private temporalProperties = new BehaviorSubject<TemporalPropertiesDict>({
        intervalType: null,
        isTime: false,
        startColumn: -1,
        startFormat: '',
        endColumn: -1,
        endFormat: '',
        constantDuration: 0,
    });
    private header = new BehaviorSubject<{value: string}[]>([]);
    private formStatus = new BehaviorSubject<FormStatus>(null);

    xyColumn$: BehaviorSubject<{x: number, y?: number}> = new BehaviorSubject<{x: number, y?: number}>({x: 0, y: 0});

    dataProperties$ = this.dataProperties.asObservable();
    spatialProperties$ = this.spatialProperties.asObservable();
    temporalProperties$ = this.temporalProperties.asObservable();
    header$ = this.header.asObservable();
    formStatus$ = this.formStatus.asObservable();

    public changeDataProperties(p: DataPropertiesDict) {
        this.dataProperties.next(p);
    }

    public changeSpatialProperties(s: SpatialPropertiesDict) {
        this.spatialProperties.next(s);
    }

    public changeTemporalProperties(t: TemporalPropertiesDict) {
        this.temporalProperties.next(t);
    }

    public changeHeader(h: {value: string}[]) {
        this.header.next(h);
    }

    public changeFormStatus(fs: FormStatus) {
        this.formStatus.next(fs);
    }
}
