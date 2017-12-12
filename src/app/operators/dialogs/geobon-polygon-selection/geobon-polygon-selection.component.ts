import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {UserService} from '../../../users/user.service';
import {Operator} from '../../operator.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {BehaviorSubject, Observable} from 'rxjs/Rx';
import {MdDialog} from '@angular/material';
import {ProjectService} from '../../../project/project.service';
import {DataSource} from '@angular/cdk/table';

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
    entries$ = Observable.of(ELEMENT_DATA);
    // new ReplaySubject<Array<{name: string, operator: Operator}>>(1);
    filteredEntries$: Observable<Array<Element>>;

    // define table data
    tableEntries$: CountryDataSource;
    displayedColumns: Array<String> = ['name', 'area'];


    constructor(private userService: UserService,
                private projectService: ProjectService,
                private randomColorService: RandomColorService,
                public dialog: MdDialog) {
    }

    ngOnInit() {
        // this.refresh();

        this.filteredEntries$ = Observable
            .combineLatest(
                this.entries$,
                this.searchString$,
                (entries, searchString) => entries
                    .filter(entry => entry.name.indexOf(searchString) >= 0)
                    .sort((a, b) => nameComparator(a.name, b.name))
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

    add(entry: {name: string, operator: Operator}) {
        /*
        const color = this.randomColorService.getRandomColor();
        let symbology: AbstractVectorSymbology;
        let clustered: boolean;

        if (entry.operator.resultType === ResultTypes.POINTS) {
            symbology = new ClusteredPointSymbology({
                fillRGBA: color,
            });
            clustered = true;
        } else {
            symbology = new SimpleVectorSymbology({
                fillRGBA: color,
            });
            clustered = false;
        }

        const layer = new VectorLayer({
            name: entry.name,
            operator: entry.operator,
            symbology: symbology,
            clustered: clustered,
        });
        this.projectService.addLayer(layer)
        */
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
const ELEMENT_DATA: Element[] = [
    {name: 'Germany', area: 1.0079},
    {name: 'Italy', area: 4.0026},
    {name: 'Spain', area: 6.941},
];
