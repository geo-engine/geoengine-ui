import {Injectable} from '@angular/core';
import moment from 'moment';
import {mergeMap, Observable} from 'rxjs';
import {
    DatasetService,
    Dataset,
    RasterSymbology,
    RasterLayer,
    BackendService,
    UserService,
    ProjectService,
    RandomColorService,
    Time,
} from 'wave-core';
import {DataSelectionService} from './data-selection.service';

@Injectable()
export class AppDatasetService extends DatasetService {
    constructor(
        protected readonly backend: BackendService,
        protected readonly userService: UserService,
        protected readonly projectService: ProjectService,
        protected readonly randomColorService: RandomColorService,
        protected readonly dataSelectionService: DataSelectionService,
    ) {
        super(backend, userService, projectService, randomColorService);
    }

    addDatasetToMap(dataset: Dataset): Observable<void> {
        const workflow = dataset.createSourceWorkflow();

        return this.projectService.registerWorkflow(workflow).pipe(
            mergeMap((workflowId) => {
                if (dataset.resultDescriptor.getTypeString() === 'Raster') {
                    const symbology = dataset.symbology as RasterSymbology;

                    const rasterLayer = new RasterLayer({
                        workflowId,
                        name: dataset.name,
                        symbology: symbology
                            ? symbology
                            : RasterSymbology.fromRasterSymbologyDict({
                                  type: 'raster',
                                  opacity: 1.0,
                                  colorizer: {
                                      type: 'linearGradient',
                                      breakpoints: [
                                          {value: 1, color: [0, 0, 0, 255]},
                                          {value: 255, color: [255, 255, 255, 255]},
                                      ],
                                      defaultColor: [0, 0, 0, 0],
                                      noDataColor: [0, 0, 0, 0],
                                  },
                              }),
                        isLegendVisible: false,
                        isVisible: true,
                    });

                    return this.dataSelectionService.setRasterLayer(
                        rasterLayer,
                        // TODO: get from metadata
                        [new Time(moment.utc('2000-01-01 00:00:00')), new Time(moment.utc('2001-01-01 00:00:00'))],
                        // TODO: get from metadata
                        {
                            min: 0,
                            max: 255,
                        },
                    );
                } else {
                    // TODO: other vector layers?
                    return new Observable<void>(function subscribe(subscriber) {
                        subscriber.error('Vector data is currently unsupported');
                        subscriber.complete();
                    });
                }
            }),
        );
    }
}
