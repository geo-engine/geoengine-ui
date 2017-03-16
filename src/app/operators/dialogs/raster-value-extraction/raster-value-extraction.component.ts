import {Component, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {ResultTypes} from '../../result-type.model';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl} from '@angular/forms';
import {LayerService} from '../../../../layers/layer.service';
import {RandomColorService} from '../../../../services/random-color.service';
import {MappingQueryService} from '../../../../queries/mapping-query.service';
import {LetterNumberConverter} from '../helpers/multi-layer-selection/multi-layer-selection.component';
import {Subscription} from 'rxjs/Rx';
import {VectorLayer} from '../../../../layers/layer.model';
import {
    AbstractVectorSymbology, ClusteredPointSymbology,
    SimplePointSymbology
} from '../../../../symbology/symbology.model';
import {Operator} from '../../operator.model';
import {RasterValueExtractionType} from '../../types/raster-value-extraction-type.model';

function valueNameCollision(pointLayerControl: FormControl, valueNames: FormArray) {
    return (control: FormControl): {[key: string]: boolean} => {
        const errors: {
            duplicateName?: boolean,
        } = {};

        const valueName = control.value;

        let duplicates = 0;

        for (const otherValueName of valueNames.value) {
            if (valueName === otherValueName) {
                duplicates++;
            }
        }

        if (duplicates < 2) {
            const pointLayer: VectorLayer<AbstractVectorSymbology> = pointLayerControl.value;
            if (pointLayer) {
                for (const otherValueName of pointLayer.operator.attributes.toArray()) {
                    if (valueName === otherValueName) {
                        duplicates++;
                    }
                }
            }
        }

        if (duplicates > 1) {
            errors.duplicateName = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
}

@Component({
    selector: 'wave-raster-value-extraction',
    templateUrl: './raster-value-extraction.component.html',
    styleUrls: ['./raster-value-extraction.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterValueExtractionOperatorComponent implements OnDestroy {
    // make accessible
    ResultTypes = ResultTypes;
    LetterNumberConverter = LetterNumberConverter;
    //

    form: FormGroup;

    private valueNameChanges: Array<boolean> = [];

    private subscriptions: Array<Subscription> = [];

    constructor(private layerService: LayerService,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                private formBuilder: FormBuilder,
                private changeDetectorRef: ChangeDetectorRef) {
        this.form = this.formBuilder.group({
            pointLayer: [undefined, Validators.required],
            rasterLayers: [undefined, Validators.required],
            valueNames: this.formBuilder.array([]),
            name: ['Points With Raster Values', Validators.required],
        });

        this.subscriptions.push(
            // update valueNames
            this.form.controls['rasterLayers'].valueChanges.subscribe(rasters => {
                const valueNames = this.form.controls['valueNames'] as FormArray;

                if (valueNames.length > rasters.length) {
                    // remove name fields
                    for (let i = rasters.length; i < valueNames.length; i++) {
                        valueNames.removeAt(i);
                        this.valueNameChanges.splice(i, 1);
                    }
                } else if (valueNames.length < rasters.length) {
                    // add name fields
                    for (let i = valueNames.length; i < rasters.length; i++) {
                        const control = this.formBuilder.control(
                            rasters[i].name, Validators.compose([
                                Validators.required,
                                valueNameCollision(
                                    this.form.controls['pointLayer'] as FormControl,
                                    this.form.controls['valueNames'] as FormArray,
                                )
                            ])
                        );
                        valueNames.push(control);
                        this.valueNameChanges.push(false);

                        this.subscriptions.push(
                            control.valueChanges.subscribe(valueName => {
                                // const rasterName = this.form.controls['rasterLayers'].value[i].name;
                                const rasterName = rasters[i].name;
                                if (valueName !== rasterName) {
                                    this.valueNameChanges[i] = true;
                                }

                                // check validity of other valueName controls
                                setTimeout(() => valueNames.controls.forEach(myControl => {
                                    myControl.updateValueAndValidity({
                                        onlySelf: false,
                                        emitEvent: false
                                    });
                                    this.changeDetectorRef.markForCheck();
                                }), 0);
                            })
                        );
                    }
                } else {
                    // update names if not changed by user
                    for (let i = 0; i < rasters.length; i++) {
                        if (!this.valueNameChanges[i]) {
                            valueNames.at(i).setValue(rasters[i].name);
                        }
                        // TODO: change name if other layer is selected
                    }
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    add() {
        const vectorOperator: Operator = this.form.controls['pointLayer'].value.operator;
        const projection = vectorOperator.projection;
        const resultType = vectorOperator.resultType;

        const rasterOperators: Array<Operator> = this.form.controls['rasterLayers'].value.map(
            layer => layer.operator.getProjectedOperator(projection)
        );

        const valueNames: Array<string> = this.form.controls['valueNames'].value;

        // ATTENTION: make the three mutable copies to loop just once over the rasters
        //            -> make them immutable to put them into the operator
        const units = vectorOperator.units.asMutable();
        const dataTypes = vectorOperator.dataTypes.asMutable();
        const attributes = vectorOperator.attributes.asMutable();

        for (let i = 0; i < rasterOperators.length; i++) {
            units.set(valueNames[i], rasterOperators[i].getUnit('value'));
            dataTypes.set(valueNames[i], rasterOperators[i].getDataType('value'));
            attributes.push(valueNames[i]);
        }

        const name: string = this.form.controls['name'].value;

        // TODO: magic numbers
        const resolutionX = 1024;
        const resolutionY = 1024;

        const operator = new Operator({
            operatorType: new RasterValueExtractionType({
                xResolution: resolutionX,
                yResolution: resolutionY,
                attributeNames: valueNames,
            }),
            resultType: resultType,
            projection: projection,
            attributes: attributes.asImmutable(),  // immutable!
            dataTypes: dataTypes.asImmutable(),  // immutable!
            units: units.asImmutable(), // immutable!
            pointSources: resultType === ResultTypes.POINTS ? [vectorOperator] : undefined,
            lineSources: resultType === ResultTypes.LINES ? [vectorOperator] : undefined,
            polygonSources: resultType === ResultTypes.POLYGONS ? [vectorOperator] : undefined,
            rasterSources: rasterOperators,
        });

        const clustered: boolean = this.form.controls['pointLayer'].value.clustered;
        this.layerService.addLayer(new VectorLayer({
            name: name,
            operator: operator,
            symbology: clustered ?
                new ClusteredPointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                }) :
                new SimplePointSymbology({
                    fillRGBA: this.randomColorService.getRandomColor(),
                }),
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator, clustered,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
            clustered: clustered,
        }));

    }

}
