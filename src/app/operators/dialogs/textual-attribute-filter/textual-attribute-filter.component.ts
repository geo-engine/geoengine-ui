import {AfterViewInit, ChangeDetectionStrategy, Component} from '@angular/core';

import {VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {DataTypes} from '../../datatype.model';
import {AbstractVectorSymbology} from '../../../layers/symbology/symbology.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs/Rx';
import {Operator} from '../../operator.model';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {
    TextualAttributeFilterEngineType,
    TextualAttributeFilterType,
} from '../../types/textual-attribute-filter-type.model';
import {RandomColorService} from '../../../util/services/random-color.service';

/**
 * This component allows creating the textual attribute filter operator.
 */
@Component({
    selector: 'wave-textual-attribute-filter',
    templateUrl: './textual-attribute-filter.component.html',
    styleUrls: ['./textual-attribute-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextualAttributeFilterOperatorComponent implements AfterViewInit {
    // for the template
    ResultTypes = ResultTypes;
    TextualAttributeFilterEngineType = TextualAttributeFilterEngineType;

    form: FormGroup;
    attributes$: Observable<Array<string>>;

    constructor(private projectService: ProjectService,
                private formBuilder: FormBuilder,
                private randomColorService: RandomColorService) {
        this.form = formBuilder.group({
            name: ['Filtered Values', [Validators.required, WaveValidators.notOnlyWhitespace]],
            vectorLayer: [undefined, Validators.required],
            attribute: [undefined, Validators.required],
            engine: [TextualAttributeFilterEngineType.EXACT, Validators.required],
            searchString: ['', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });

        this.attributes$ = this.form.controls['vectorLayer'].valueChanges
            .do(layer => {
                // side effects!!!
                this.form.controls['attribute'].setValue(undefined);
                if (layer) {
                    this.form.controls['attribute'].enable({onlySelf: true});
                } else {
                    this.form.controls['attribute'].disable({onlySelf: true});
                }
            })
            .map(layer => {
                if (layer) {
                    return layer.operator.attributes.filter((attribute: string) => {
                        return DataTypes.Alphanumeric === layer.operator.dataTypes.get(attribute);
                    }).toArray().sort();
                } else {
                    return [];
                }
            });
    }

    ngAfterViewInit() {
        // initially get attributes
        setTimeout(() => this.form.controls['vectorLayer'].enable({emitEvent: true}));
    }

    add(event: any) {
        const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['vectorLayer'].value;
        const sourceOperator: Operator = vectorLayer.operator;

        const attributeName: string = this.form.controls['attribute'].value;
        const engine: TextualAttributeFilterEngineType = this.form.controls['engine'].value;
        const searchString: string = this.form.controls['searchString'].value;

        const name: string = this.form.controls['name'].value;

        const dict = {
            operatorType: new TextualAttributeFilterType({
                attributeName: attributeName,
                engine: engine,
                searchString: searchString,
            }),
            resultType: sourceOperator.resultType,
            projection: sourceOperator.projection,
            attributes: sourceOperator.attributes,
            dataTypes: sourceOperator.dataTypes,
            units: sourceOperator.units,
            pointSources: [],
            lineSources: [],
            polygonSources: [],
        };

        switch (sourceOperator.resultType) {
            case ResultTypes.POINTS:
                dict.pointSources.push(sourceOperator);
                break;
            case ResultTypes.LINES:
                dict.lineSources.push(sourceOperator);
                break;
            case ResultTypes.POLYGONS:
                dict.polygonSources.push(sourceOperator);
                break;
            default:
                throw Error('Incompatible Input Type');
        }

        const operator = new Operator(dict);

        const symbology = vectorLayer.symbology.clone() as any as AbstractVectorSymbology;
        symbology.fillRGBA = this.randomColorService.getRandomColorRgba();
        const layer = new VectorLayer({
            name: name,
            operator: operator,
            symbology: symbology,
            clustered: vectorLayer.clustered,
        });

        this.projectService.addLayer(layer);
    }

}
