import {Component, OnInit, ChangeDetectionStrategy, ViewChild} from '@angular/core';
import {UploadData} from '../csv-upload/csv-upload.component';
import {CsvSourceType, CSVParameters} from '../../../types/csv-source-type.model';
import {Operator} from '../../../operator.model';
import {ResultTypes} from '../../../result-type.model';
import {UserService} from '../../../../users/user.service';
import {LayerService} from '../../../../layers/layer.service';
import {
    AbstractVectorSymbology,
    ComplexPointSymbology,
    SimpleVectorSymbology
} from '../../../../layers/symbology/symbology.model';
import {VectorLayer} from '../../../../layers/layer.model';
import {MappingQueryService} from '../../../../queries/mapping-query.service';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {MatDialogRef} from '@angular/material';
import {BehaviorSubject} from 'rxjs/Rx';
import {Projections} from '../../../projection.model';
import {ProjectionType} from '../../../types/projection-type.model';
import {ProjectService} from '../../../../project/project.service';
import {IntervalFormat} from '../interval.enum';
import {CsvPropertiesComponent} from '../csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from '../csv-config/csv-table/csv-table.component';

@Component({
    selector: 'wave-csv-dialog',
    templateUrl: './csv-dialog.component.html',
    styleUrls: ['./csv-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvDialogComponent implements OnInit {

    IntervalFormat = IntervalFormat;
    @ViewChild(CsvPropertiesComponent) csvProperties;
    @ViewChild(CsvTableComponent) csvTable;
    data: UploadData;
    uploading$ = new BehaviorSubject(false);

    constructor(private userService: UserService,
                private layerService: LayerService,
                private mappingQueryService: MappingQueryService,
                private randomColorService: RandomColorService,
                private projectService: ProjectService,
                private dialogRef: MatDialogRef<CsvDialogComponent>) {
    }

    ngOnInit() {
    }

    submit() {
        const untypedCols = [this.csvProperties.spatialProperties.controls['xColumn'].value,
            this.csvProperties.spatialProperties.controls['yColumn'].value];
        if (this.csvProperties.temporalProperties.controls['isTime'].value) {
            untypedCols.push(this.csvProperties.temporalProperties.controls['startColumn'].value);
            if (this.csvProperties.temporalProperties.controls['intervalType'].value !== this.IntervalFormat.StartInf) {
                untypedCols.push(this.csvProperties.temporalProperties.controls['endColumn'].value);
            }
        }
        // TODO: refactor most of this
        const fieldSeparator = this.csvProperties.dataProperties.controls['delimiter'].value;
        const geometry = 'xy';
        const time = this.intervalString;
        const time1Format = this.csvProperties.temporalProperties.controls['startFormat'].value;
        const time2Format = this.csvProperties.temporalProperties.controls['endFormat'].value;
        const header = new Array(this.csvProperties.csvTable.header.length);
        for (let i = 0; i < this.csvProperties.csvTable.header.length; i++) {
            header[i] = this.csvProperties.csvTable.header[i].value;
        }
        const columnX = header[this.csvProperties.spatialProperties.controls['xColumn'].value];
        const columnY = header[this.csvProperties.spatialProperties.controls['yColumn'].value];
        const time1 = this.csvProperties.temporalProperties.controls['isTime'].value ?
            header[this.csvProperties.temporalProperties.controls['startColumn'].value] : '';
        const time2 = this.csvProperties.temporalProperties.controls['isTime'].value ?
            header[this.csvProperties.temporalProperties.controls['endColumn'].value] : '';
        const numericColumns = header.filter((name, index) => {
            return this.csvTable.isNumberArray[index] === 1 && untypedCols.indexOf(index) < 0;
        });
        const textualColumns = header.filter((name, index) => {
            return this.csvTable.isNumberArray[index] === 0 && untypedCols.indexOf(index) < 0;
        });
        const onError = 'skip';

        let parameters: CSVParameters = {
            fieldSeparator: fieldSeparator,
            geometry: geometry,
            time: time as ('none' | 'start+inf' | 'start+end' | 'start+duration'),
            header: header,
            columns: {
                x: columnX,
                y: columnY,
                numeric: numericColumns,
                textual: textualColumns,
            },
            onError: onError,
        };

        // filter out geo columns
        function removeIfExists(array: Array<string>, name: string) {
            const index = array.indexOf(name);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }

        removeIfExists(parameters.columns.textual, columnX);
        removeIfExists(parameters.columns.numeric, columnX);
        removeIfExists(parameters.columns.textual, columnY);
        removeIfExists(parameters.columns.numeric, columnY);

        if (time !== 'none') {
            parameters.timeFormat = {
                time1: {
                    format: 'custom',
                    customFormat: time1Format,
                }
            };
            parameters.columns.time1 = time1;

            removeIfExists(parameters.columns.textual, time1);
            removeIfExists(parameters.columns.numeric, time1);

            if (time.indexOf('end') >= 0) {
                parameters.timeFormat.time2 = {
                    format: 'custom',
                    customFormat: time2Format,
                };
                parameters.columns.time2 = time2;

                removeIfExists(parameters.columns.textual, time2);
                removeIfExists(parameters.columns.numeric, time2);
            }
            if (time.indexOf('duration') >= 0) {
                // TODO: refactor for other formats
                parameters.timeFormat.time2 = {
                    format: time2Format as 'seconds',
                };
                parameters.columns.time2 = time2;

                removeIfExists(parameters.columns.textual, time2);
                removeIfExists(parameters.columns.numeric, time2);
            }
        }

        const csvSourceType = new CsvSourceType({
            dataURI: 'data:text/plain,' + this.data.content,
            parameters: parameters,
        });

        const operator = new Operator({
            operatorType: csvSourceType,
            resultType: ResultTypes.POINTS,
            projection: this.csvProperties.spatialProperties.controls['spatialReferenceSystem'].value,
        }).getProjectedOperator(Projections.WGS_84);

        this.uploading$.next(true);

        // console.log("SAVE", config, csvSourceType);
        try {
            this.userService.addFeatureToDB(this.csvProperties.typingProperties.controls['layerName'].value, operator)
                .subscribe(data => {
                    this.uploading$.next(false);

                    this.addLayer(data);

                    this.dialogRef.close();
                });
        }catch (e) {
            console.log('Error: ' + e);
        }
    }

    private addLayer(entry: {name: string, operator: Operator}) {
        const color = this.randomColorService.getRandomColorRgba();
        let symbology: AbstractVectorSymbology;
        let clustered: boolean;

        if (entry.operator.resultType === ResultTypes.POINTS) {
            symbology = ComplexPointSymbology.createClusterSymbology({
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
            // data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
            //     operator: entry.operator,
            //     clustered: clustered,
            // }),
            // provenance: this.mappingQueryService.getProvenanceStream(entry.operator),
            clustered: clustered,
        });
        // this.layerService.addLayer(layer);
        this.projectService.addLayer(layer);
    }

    get intervalString(): string {
        if (!this.csvProperties.temporalProperties.controls['isTime'].value) {
            return 'none';
        }
        switch (this.csvProperties.temporalProperties.controls['intervalType'].value) {
            case IntervalFormat.StartInf:
                return 'start+inf';
            case IntervalFormat.StartEnd:
                return 'start+end';
            case IntervalFormat.StartDur:
                return 'start+duration';
            case IntervalFormat.StartConst:
                return 'start+constant';
            default:
                return 'none';
        }
    }
}
