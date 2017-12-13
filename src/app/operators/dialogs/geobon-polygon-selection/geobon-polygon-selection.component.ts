import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {UserService} from '../../../users/user.service';
import {Operator} from '../../operator.model';
import {VectorData, VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {
    AbstractVectorSymbology,
    SimpleVectorSymbology
} from '../../../layers/symbology/symbology.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs/Rx';
import {MdDialog} from '@angular/material';
import {ProjectService} from '../../../project/project.service';
import {DataSource} from '@angular/cdk/table';
import {Projection, Projections} from '../../projection.model';
import {CSVParameters, CsvSourceType} from '../../types/csv-source-type.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {WFSOutputFormats} from '../../../queries/output-formats/wfs-output-format.model';

function nameComparator(a: string, b: string): number {
    const stripped = (s: string): string => s.replace(' ', '');
    return stripped(a).localeCompare(stripped(b));
}

@Component({
    selector: 'wave-geobon-polygon-selection',
    templateUrl: './geobon-polygon-selection.component.html',
    styleUrls: ['./geobon-polygon-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeobonPolygonSelectionComponent implements OnInit {

    searchString$ = new BehaviorSubject<string>('');

    filteredEntries$: Observable<Array<Element>>;

    // define table data
    tableEntries$: CountryDataSource;
    displayedColumns: Array<String> = ['name', 'area'];

    filteredEntries$: Observable<Array<{ [k: string]: any }>>;

    /*
    {
 		"filename": "file:///home/gfbio/data/dev/csv_source/country_borders.csv",
 		"on_error": "keep",
 		"separator": ",",
 		"geometry": "wkt",
 		"time": "none",
 		"columns": {
 			"x": "WKT",
 			"textual": ["FIPS", "ISO2", "ISO3", "UN", "NAME"],
 			"numeric": ["AREA", "POP2005", "REGION", "SUBREGION", "LON", "LAT"]
 		}
 	}
     */

    private sourceFile: string = 'file:///home/gfbio/data/dev/csv_source/country_borders.csv';
    private sourceParameters: CSVParameters = {
        header: 0,
        onError: 'keep',
        fieldSeparator: ',',
        geometry: 'wkt',
        time: 'none',
        columns: {
            x: 'WKT',
            textual: ['FIPS', 'ISO2', 'ISO3', 'UN', 'NAME'],
            numeric: ['AREA', 'POP2005', 'REGION', 'SUBREGION', 'LON', 'LAT'],
        }
    };
    private sourceProjection: Projection = Projections.WGS_84;
    private sourceIdColumn: string = 'NAME';
    private sourceOperator: Operator;



    constructor(private userService: UserService,
                private projectService: ProjectService,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                public dialog: MdDialog) {
    }

    ngOnInit() {
        this.sourceOperator = this.createCsvSourceOperator();

        this.filteredEntries$ = Observable
            .combineLatest(
                this.getOperatorDataStream().map(
                    vectorData => {
                        console.log('vectorData', vectorData);
                        const data = vectorData.data.map(olFeature => olFeature.getProperties() as { [k: string]: any });
                        console.log('mapped', data);
                        return data;
                    }
                ),
                this.searchString$,
                (entries, searchString) => entries
                    .filter(entry => entry[this.sourceIdColumn].toString().indexOf(searchString) >= 0)
                    .sort((a, b) => nameComparator(a[this.sourceIdColumn].toString(), b[this.sourceIdColumn].toString()))
            );
        this.tableEntries$ = new CountryDataSource(this.filteredEntries$);
    }

    /*
    refresh() {
        this.userService.getFeatureDBList()
            .map(entries => entries.sort())
            .subscribe(entries => this.entries$.next(entries));
    }

    openCSVDialog() {
        this.dialog.open(CsvDialogComponent)
            .afterClosed()
            .first()
            .subscribe(() => this.refresh());
    }
    */

    createCsvSourceOperator(): Operator {
        const csvSourceType = new CsvSourceType({
            dataURI: this.sourceFile,
            parameters: this.sourceParameters,
        });

        const operator = new Operator({
            operatorType: csvSourceType,
            resultType: ResultTypes.POLYGONS,
            projection: this.sourceProjection,
        });

        return this.sourceOperator = operator;
    }

    getOperatorDataStream(): Observable<VectorData> {
        return this.projectService.getTimeStream().flatMap(t => {
            return this.mappingQueryService.getWFSData({
                operator: this.sourceOperator,
                projection: this.sourceProjection,
                clustered: false,
                outputFormat: WFSOutputFormats.JSON,
                viewportSize: {
                    extent: this.sourceProjection.getExtent(),
                    resolution: 1,
                },
                time: t
            }).map(d => VectorData.olParse(t, this.sourceProjection, this.sourceProjection.getExtent(), d));
        });
    }

    createFilterOperator(key: string): Operator {
        return undefined;
    }

    addLayer(layerName: string, operator: Operator) {
        const color = this.randomColorService.getRandomColor();
        let symbology: AbstractVectorSymbology;
        symbology = new SimpleVectorSymbology({
            fillRGBA: color,
        });

        const layer = new VectorLayer({
            name: layerName,
            operator: operator,
            symbology: symbology,
        });
        this.projectService.addLayer(layer);
    }

}




// Define class CountryDataSource
class CountryDataSource extends DataSource<Element> {
    private countries: Observable<Array<Element>>;

    constructor(countries: Observable<Array<Element>>) {
        super();
        this.countries = countries;
    }

    connect(): Observable<Array<Element>> {
        return (this.countries);
    }

    disconnect() {
    }
}


// dummy Country data
export interface Element {
    name: string;
    area: number;
}

