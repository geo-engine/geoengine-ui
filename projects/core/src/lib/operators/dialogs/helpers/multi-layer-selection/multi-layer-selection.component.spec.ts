import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MultiLayerSelectionComponent} from './multi-layer-selection.component';
import {ProjectService} from '../../../../project/project.service';
import {DebugElement, SimpleChange} from '@angular/core';
import {of} from 'rxjs';
import {DialogSectionHeadingComponent} from '../../../../dialogs/dialog-section-heading/dialog-section-heading.component';
import {MATERIAL_MODULES} from '../../../../core.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
// import {By} from '@angular/platform-browser';
import {WGS_84} from '../../../../spatial-references/spatial-reference.service';
import {
    GeoTransform,
    Layer,
    RasterDataTypes,
    RasterLayer,
    RasterLayerMetadata,
    RasterSymbology,
    SpatialGridDefinition,
    SpatialGridDescriptor,
    UnitlessMeasurement,
    Coordinate2D,
    GridBoundingBox2D,
    GridIdx2D,
} from '@geoengine/common';
import {RasterBandDescriptor} from '@geoengine/openapi-client';

describe('MultiLayerSelectionComponent', () => {
    let component: MultiLayerSelectionComponent;
    let fixture: ComponentFixture<MultiLayerSelectionComponent>;
    // let deb: DebugElement;
    let html: HTMLElement;

    /** Mock Layers **/
    const layer1: Layer = new RasterLayer({
        name: 'test-layer1',
        workflowId: '1',
        isLegendVisible: true,
        isVisible: true,
        symbology: RasterSymbology.fromRasterSymbologyDict({
            type: 'raster',
            opacity: 1.0,
            rasterColorizer: {
                type: 'singleBand',
                band: 0,
                bandColorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    overColor: [255, 255, 255, 127],
                    underColor: [0, 0, 0, 127],
                    noDataColor: [0, 0, 0, 0],
                },
            },
        }),
    });
    const layer2: Layer = new RasterLayer({
        name: 'test-layer2',
        workflowId: '2',
        isLegendVisible: true,
        isVisible: true,
        symbology: RasterSymbology.fromRasterSymbologyDict({
            type: 'raster',
            opacity: 1.0,
            rasterColorizer: {
                type: 'singleBand',
                band: 0,
                bandColorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    overColor: [255, 255, 255, 127],
                    underColor: [0, 0, 0, 127],
                    noDataColor: [0, 0, 0, 0],
                },
            },
        }),
    });
    const layer3: Layer = new RasterLayer({
        name: 'test-layer3',
        workflowId: '3',
        isLegendVisible: true,
        isVisible: true,
        symbology: RasterSymbology.fromRasterSymbologyDict({
            type: 'raster',
            opacity: 1.0,
            rasterColorizer: {
                type: 'singleBand',
                band: 0,
                bandColorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    overColor: [255, 255, 255, 127],
                    underColor: [0, 0, 0, 127],
                    noDataColor: [0, 0, 0, 0],
                },
            },
        }),
    });
    const mockLayers: Array<Layer> = [layer1, layer2, layer3];

    /** Mock project Service **/
    let projectServiceSpy: {getLayerStream: jasmine.Spy; getLayerMetadata: jasmine.Spy};

    beforeEach(async () => {
        projectServiceSpy = jasmine.createSpyObj('ProjectService', ['getLayerStream', 'getLayerMetadata']);

        /** ProjectService returns Mock Layers **/
        projectServiceSpy.getLayerStream.and.returnValue(of<Array<Layer>>(mockLayers));
        projectServiceSpy.getLayerMetadata.and.returnValue(
            of<RasterLayerMetadata>(
                new RasterLayerMetadata(
                    RasterDataTypes.Byte,
                    WGS_84.spatialReference,
                    [{name: 'band', measurement: new UnitlessMeasurement().toDict()} as RasterBandDescriptor],
                    new SpatialGridDescriptor(
                        new SpatialGridDefinition(
                            new GeoTransform(new Coordinate2D([0.0, 0.0]), 1.0, -1.0),
                            new GridBoundingBox2D(new GridIdx2D(0, 0), new GridIdx2D(100, 100)),
                        ),
                        'source',
                    ),
                ),
            ),
        );

        await TestBed.configureTestingModule({
            declarations: [MultiLayerSelectionComponent, DialogSectionHeadingComponent],
            providers: [{provide: ProjectService, useValue: projectServiceSpy}],
            imports: [...MATERIAL_MODULES, NoopAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(MultiLayerSelectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    /** create app **/
    it('should create the app', () => {
        expect(component).toBeTruthy();
    });

    /** initially no Layers -> 'No Input Available' should be displayed **/
    it('should display "No Input Available", if no Layer is available', () => {
        html = fixture.nativeElement.querySelector('p');
        expect(component.selectedLayers.value).toEqual([]);
        expect(html.textContent).toEqual('No Input Available');
    });

    /** Adding three layers
     * checking the number of possible layers to select from
     * checking the default layer displayed **/
    /*
    it('should display the first of selectedLayers per default, min = max = 1', async () => {
        component.ngOnChanges({layers: new SimpleChange(undefined, component.layers, true)});
        fixture.detectChanges();
        html = fixture.nativeElement.querySelector('mat-select');
        html.click();
        fixture.detectChanges();
        await fixture.whenStable().then(() => {
            const inquiryOptions = fixture.debugElement.queryAll(By.css('.mat-option-0'));
            expect(inquiryOptions.length).toEqual(mockLayers.length);
            expect(component.selectedLayers.value).not.toEqual([]);
            expect(html.textContent).toEqual(component.selectedLayers.value[0].name);
        });
    });
    */

    /** checking the layer displayed after changing the selected layer **/
    it('should update the layer displayed to equal selected layer, min = max = 1', async () => {
        component.ngOnChanges({layers: new SimpleChange(undefined, component.layers, true)});
        fixture.detectChanges();
        for (let i = mockLayers.length; i > 0; i--) {
            component.updateLayer(0, mockLayers[i - 1]);
            fixture.detectChanges();
            html = fixture.nativeElement.querySelector('mat-select');
            html.click();
            fixture.detectChanges();
            await fixture.whenStable().then(() => {
                expect(component.selectedLayers.value).not.toEqual([]);
                expect(html.textContent).toEqual(component.selectedLayers.value[0].name);
                expect(html.textContent).toEqual(mockLayers[i - 1].name);
            });
        }
    });

    /** Adding three layers
     * adding two more input fields
     * checking the default layers displayed and the number of possible layers to select **/
    /*
    it('should display the selectedLayers per default, max = 3', async () => {
        component.ngOnChanges({max: new SimpleChange(component.max, 3, true), layers: new SimpleChange(undefined, component.layers, true)});
        fixture.detectChanges();
        component.add();
        component.add();
        const amount = component.selectedLayers.value.length;
        expect(amount).toEqual(mockLayers.length);
        for (let j = 0; j < amount; j++) {
            deb = fixture.debugElement.query(By.css('.mat-select-' + j));
            html = deb.nativeElement;
            html.click();
            fixture.detectChanges();
            await fixture.whenStable().then(() => {
                expect(component.selectedLayers.value).not.toEqual([]);
                expect(html.textContent).toEqual(component.selectedLayers.value[j].name);
                const inquiryOptions = fixture.debugElement.queryAll(By.css('.mat-option-' + j));
                expect(inquiryOptions.length).toEqual(mockLayers.length);
            });
        }
    });
    */

    /** checking the layer displayed after changing the selected layer **/
    /*
    it('should update the layer displayed to equal selected layer, max = 3', async () => {
        async function testInputs(noOfInputs: number): Promise<void> {
            for (let j = 0; j < noOfInputs; j++) {
                deb = fixture.debugElement.query(By.css('.mat-select-' + j));
                html = deb.nativeElement;
                html.click();
                fixture.detectChanges();
                await fixture.whenStable().then(() => {
                    expect(component.selectedLayers.value).not.toEqual([]);
                    expect(html.textContent).toEqual(component.selectedLayers.value[j].name);
                });
            }
        }

        component.ngOnChanges({max: new SimpleChange(component.max, 3, true), layers: new SimpleChange(undefined, component.layers, true)});
        fixture.detectChanges();
        component.add();
        component.add();
        const amount = component.selectedLayers.value.length;
        expect(amount).toEqual(mockLayers.length);
        await testInputs(amount);

        for (let i = 0; i < amount; i++) {
            component.updateLayer(i, mockLayers[2]);
            await testInputs(amount);

            component.updateLayer(i, mockLayers[1]);
            await testInputs(amount);

            component.updateLayer(i, mockLayers[0]);
            await testInputs(amount);
        }
    });
    */
});
