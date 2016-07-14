import {
    Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import {HTTP_PROVIDERS} from '@angular/http';
import {
    COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup,
} from '@angular/common';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';
import {MdCheckbox} from '@angular2-material/checkbox';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import {
    LayerMultiSelectComponent, OperatorBaseComponent, OperatorOutputNameComponent,
} from './operator.component';
import {HistogramComponent} from '../../plots/histogram.component';

import {LayerService} from '../../layers/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../queries/mapping-query.service';
import {ProjectService} from '../../project/project.service';

import {Layer, RasterLayer} from '../../layers/layer.model';
import {Operator} from '../operator.model';
import {ResultTypes} from '../result-type.model';
import {DataType} from '../datatype.model';
import {Projections} from '../projection.model';
import {Unit} from '../unit.model';
import {
    Symbology, MappingColorizerRasterSymbology, RasterSymbology,
} from '../../symbology/symbology.model';
import {MsgRadianceType, MsgReflectanceType, MsgSolarangleType,
    MsgTemperatureType, MsgPansharpenType,
    MsgCo2CorrectionType, SolarangleName} from '../types/msg-types.model';

/**
 * This component allows creating the MSG radiance operator.
 */
@Component({
    selector: 'wave-msg-radiance-operator',
    template: `
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="rasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Description</span>
                        <p> This operator transforms raw SEVIRI data into radiances. </p>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>

                </md-card-content>
            </md-card>
            <wave-operator-output-name ngControl="name"></wave-operator-output-name>
        </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
        LayerMultiSelectComponent, HistogramComponent, OperatorOutputNameComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgRadianceOperatorComponent extends OperatorBaseComponent implements OnInit {

    private configForm: ControlGroup;
    private rasterSources: Array<Layer<Symbology>>;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(layerService);

        this.configForm = formBuilder.group({
            // 'resultType': [ResultTypes.RASTER, Validators.required],
            'name': ['Radiance (MSG)', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('MSG SEVIR Radiance');
    }

    add() {
        const outputName: string = this.configForm.controls['name'].value;
        const rasterSource: Operator = this.rasterSources[0].operator;
        const unit: Unit = Unit.defaultUnit;

        const operator = new Operator({
            operatorType: new MsgRadianceType({}),
            resultType: ResultTypes.RASTER,
            projection: rasterSource.projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: [rasterSource],
        });

        let layer = new RasterLayer({
            name: outputName,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology({unit: unit},
                 this.mappingQueryService.getColorizerStream(operator)
            ),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });
        this.layerService.addLayer(layer);
        this.dialog.close();
    }

}

/**
 * This component allows creating the MSG reflectance operator.
 */
@Component({
    selector: 'wave-msg-reflectance-operator',
    template: `

        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="rasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Configuration</span>
                        <span class="md-subheader">Specify the operator</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>
                    <div>
                      <md-checkbox aria-label="isHrv checkbox" [(checked)]="isHrv">
                        channel is HRV
                      </md-checkbox>
                  </div>
                  <div>
                      <md-checkbox aria-label="solarCorrection checkbox"
                                   [(checked)]="solarCorrection">
                        apply solar correction
                    </md-checkbox>
                </div>
                </md-card-content>
            </md-card>
            <wave-operator-output-name ngControl="name"></wave-operator-output-name>

        </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
        MdCheckbox, LayerMultiSelectComponent, HistogramComponent, OperatorOutputNameComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgReflectanceOperatorComponent extends OperatorBaseComponent implements OnInit {

    private configForm: ControlGroup;
    private rasterSources: Array<Layer<Symbology>>;

    // private forceSatellite: boolean = false;
    // private forceSatellteName: MeteosatSatelliteName;
    private isHrv: boolean = false;
    private solarCorrection: boolean = true;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(layerService);

        this.configForm = formBuilder.group({
            // 'resultType': [ResultTypes.RASTER, Validators.required],
            'name': ['Reflectance (MSG)', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('MSG SEVIRI Reflectance');
    }

    add() {
        const outputName: string = this.configForm.controls['name'].value;
        const rasterSource: Operator = this.rasterSources[0].operator;
        const unit: Unit = Unit.defaultUnit;

        const operator = new Operator({
            operatorType: new MsgReflectanceType({
                isHrv: this.isHrv,
                solarCorrection: this.solarCorrection,
                // forceSatelliteName: this.forceSatellteName,
            }),
            resultType: ResultTypes.RASTER,
            projection: rasterSource.projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: [rasterSource],
        });

        let layer = new RasterLayer({
            name: outputName,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology({unit: unit},
                this.mappingQueryService.getColorizerStream(operator)
            ),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });

        this.layerService.addLayer(layer);

        this.dialog.close();
    }

}

/**
 * This component allows creating the MSG solarangle operator.
 */
@Component({
    selector: 'wave-msg-solarangle-operator',
    template: `
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="rasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Configuration</span>
                        <span class="md-subheader">Specify the operator</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>
                      <label>Solarangle</label>
                      <select ngControl="solarangleName">
                        <option *ngFor="let name of solarangleNames" [ngValue]="name">
                          {{name}}
                        </option>
                      </select>
                </md-card-content>
            </md-card>
            <wave-operator-output-name ngControl="name"></wave-operator-output-name>
        </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
        LayerMultiSelectComponent, HistogramComponent, OperatorOutputNameComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgSolarangleOperatorComponent extends OperatorBaseComponent implements OnInit {
    private configForm: ControlGroup;
    private rasterSources: Array<RasterLayer<RasterSymbology>>;
    private solarangleNames = ['zenith', 'azimuth'];

    // private forceSatellite: boolean = false;
    // private forceSatellteName: MeteosatSatelliteName;
    // private solarangle: SolarangleName;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(layerService);
        this.configForm = formBuilder.group({
            'solarangleName': [this.solarangleNames[0], Validators.required],
            'name': ['Solarangle (MSG)', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('MSG SEVIRI solar angle');
    }

    add() {
        const outputName: string = this.configForm.controls['name'].value;
        const solarangle: SolarangleName = this.configForm.controls['solarangleName'].value;

        const rasterSource: Operator = this.rasterSources[0].operator;
        const unit: Unit = Unit.defaultUnit;
        const operator = new Operator({
            operatorType: new MsgSolarangleType({
                solarangle: solarangle,
            }),
            resultType: ResultTypes.RASTER,
            projection: rasterSource.projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: [rasterSource],
        });

        let layer = new RasterLayer({
            name: outputName,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology(
                {unit: unit},
                this.mappingQueryService.getColorizerStream(operator)
            ),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });
        this.layerService.addLayer(layer);

        this.dialog.close();
    }

}

/**
 * This component allows creating the MSG temperature operator.
 */
@Component({
    selector: 'wave-msg-temperature-operator',
    template: `
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="1" [max]="1" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="rasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Description</span>
                        <span class="md-subheader">
                            This operator transforms raw MSG SEVIRI data into blackbody temperatures
                        </span>
                    </md-card-header-text>
                </md-card-header>
            </md-card>
            <wave-operator-output-name ngControl="name"></wave-operator-output-name>
        </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
        LayerMultiSelectComponent, HistogramComponent, OperatorOutputNameComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgTemperatureOperatorComponent extends OperatorBaseComponent implements OnInit {
    private configForm: ControlGroup;
    private rasterSources: Array<RasterLayer<RasterSymbology>>;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(layerService);
        this.configForm = formBuilder.group({
            'name': ['Temperature (MSG)', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('MSG SEVIRI temperature');
    }

    add() {
        const outputName: string = this.configForm.controls['name'].value;
        const rasterSource: Operator = this.rasterSources[0].operator;
        const unit: Unit = Unit.defaultUnit;
        const operator = new Operator({
            operatorType: new MsgTemperatureType({}),
            resultType: ResultTypes.RASTER,
            projection: rasterSource.projection,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: [rasterSource],
        });

        let layer = new RasterLayer({
            name: outputName,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology(
                {unit: unit},
                this.mappingQueryService.getColorizerStream(operator)
            ),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });

        this.layerService.addLayer(layer);

        this.dialog.close();
    }
}

/**
 * This component allows creating the MSG pansharpening operator.
 */
@Component({
    selector: 'wave-msg-pansharpen-operator',
    template: `
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="2" [max]="2" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="selectedRasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Configuration</span>
                        <span class="md-subheader">Specify the operator</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>

                </md-card-content>
            </md-card>
            <wave-operator-output-name ngControl="name"></wave-operator-output-name>
        </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
        LayerMultiSelectComponent, HistogramComponent, OperatorOutputNameComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgPansharpenOperatorComponent extends OperatorBaseComponent implements OnInit {
    private configForm: ControlGroup;
    private selectedRasterSources: Array<RasterLayer<RasterSymbology>>;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(layerService);
        this.configForm = formBuilder.group({
            'name': ['Pansharpen (MSG)', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('MSG SEVIRI pansharpening');
    }

    add() {
        const outputName: string = this.configForm.controls['name'].value;
        const rasterSources = this.selectedRasterSources.map(layer => layer.operator);
        const unit: Unit = Unit.defaultUnit;

        const operator = new Operator({
            operatorType: new MsgPansharpenType({}),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: rasterSources,
        });

        let layer = new RasterLayer({
            name: outputName,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology(
                {unit: unit},
                this.mappingQueryService.getColorizerStream(operator)
            ),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });

        this.layerService.addLayer(layer);

        this.dialog.close();
    }
}

/**
 * This component allows creating the MSG pansharpening operator.
 */
@Component({
    selector: 'wave-msg-co2correction-operator',
    template: `
        <form [ngFormModel]="configForm">
            <wave-multi-layer-selection [layers]="layers" [min]="3" [max]="3" initialAmount="1"
                                        [types]="[ResultTypes.RASTER]"
                                        (selectedLayers)="selectedRasterSources = $event">
            </wave-multi-layer-selection>
            <md-card>
                <md-card-header>
                    <md-card-header-text>
                        <span class="md-title">Description</span>
                    </md-card-header-text>
                </md-card-header>
                <md-card-content>

                </md-card-content>
            </md-card>
            <wave-operator-output-name ngControl="name"></wave-operator-output-name>
        </form>
    `,
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES, MD_PROGRESS_CIRCLE_DIRECTIVES,
        LayerMultiSelectComponent, HistogramComponent, OperatorOutputNameComponent,
    ],
    providers: [HTTP_PROVIDERS],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class MsgCo2CorrectionOperatorComponent extends OperatorBaseComponent implements OnInit {
    private configForm: ControlGroup;
    private selectedRasterSources: Array<RasterLayer<RasterSymbology>>;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private projectService: ProjectService,
        private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super(layerService);
        this.configForm = formBuilder.group({
            'name': ['CO2 correction (MSG)', Validators.required],
        });
    }

    ngOnInit() {
        super.ngOnInit();
        this.dialog.setTitle('MSG SEVIRI CO2 correction');
    }

    add() {
        const outputName: string = this.configForm.controls['name'].value;
        const rasterSources = this.selectedRasterSources.map(layer => layer.operator);
        const unit: Unit = Unit.defaultUnit;

        const operator = new Operator({
            operatorType: new MsgCo2CorrectionType({}),
            resultType: ResultTypes.RASTER,
            projection: Projections.GEOS,
            attributes: [], // TODO: user input?
            dataTypes: new Map<string, DataType>(), // TODO: user input?
            units: new Map<string, Unit>(), // TODO: user input?
            rasterSources: rasterSources,
        });

        let layer = new RasterLayer({
            name: outputName,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology(
                {unit: unit},
                this.mappingQueryService.getColorizerStream(operator)
            ),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });

        this.layerService.addLayer(layer);

        this.dialog.close();
    }
}
