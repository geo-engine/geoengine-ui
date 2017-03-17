import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {UploadData} from '../file-upload/file-upload.component';
import {CsvSourceType, CSVParameters} from '../../../types/csv-source-type.model';
import {Operator} from '../../../operator.model';
import {CSV} from '../csv-config/csv-config.component';
import {ResultTypes} from '../../../result-type.model';
import {UserService} from '../../../../users/user.service';
import {LayerService} from '../../../../layers/layer.service';
import {AbstractVectorSymbology, ClusteredPointSymbology, SimpleVectorSymbology} from '../../../../layers/symbology/symbology.model';
import {VectorLayer} from '../../../../layers/layer.model';
import {MappingQueryService} from '../../../../queries/mapping-query.service';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {MdDialogRef} from '@angular/material';

@Component({
    selector: 'wave-csv-dialog',
    templateUrl: './csv-dialog.component.html',
    styleUrls: ['./csv-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvDialogComponent implements OnInit {

    data: UploadData = undefined;

    constructor(private userService: UserService,
                private layerService: LayerService,
                private mappingQueryService: MappingQueryService,
                private randomColorService: RandomColorService,
                private dialogRef: MdDialogRef<CsvDialogComponent>) {
    }

    ngOnInit() {
    }

    submit(config: CSV) {
        // TODO: refactor most of this
        const fieldSeparator = config.delimitter;
        const geometry = 'xy';
        const time = config.intervalType;
        const time1Format = config.startFormat;
        const time2Format = config.startFormat;
        const header = config.isHeaderRow ? 0 : config.header;
        const columnX = config.header[config.xCol];
        const columnY = config.header[config.yCol];
        const time1 = config.header[config.startCol];
        const time2 = config.header[config.endCol];
        const numericColumns = config.header.filter((name, index) => config.isNumberArr[index]);
        const textualColumns = config.header.filter((name, index) => !config.isNumberArr[index]);
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

            if (time.indexOf('end') >= 0 || time.indexOf('duration') >= 0) {
                parameters.timeFormat.time2 = {
                    format: 'custom',
                    customFormat: time2Format,
                };
                parameters.columns.time2 = time2;

                removeIfExists(parameters.columns.textual, time2);
                removeIfExists(parameters.columns.numeric, time2);
            }
        }

        const csvSourceType = new CsvSourceType({
            dataURI: 'data:text/plain,' + config.content,
            parameters: parameters,
        });

        const operator = new Operator({
            operatorType: csvSourceType,
            resultType: ResultTypes.POINTS,
            projection: config.spatialRefSys,
        });

        // console.log("SAVE", config, csvSourceType);
        this.userService.addFeatureToDB(config.layerName, operator)
            .subscribe(data => {
                this.addLayer(data);

                this.dialogRef.close();
            });
    }

    private addLayer(entry: {name: string, operator: Operator}) {
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
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator: entry.operator,
                clustered: clustered,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(entry.operator),
            clustered: clustered,
        });
        this.layerService.addLayer(layer);
    }
}
