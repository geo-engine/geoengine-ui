import {Injectable} from '@angular/core';
import {BoundingBox2D, PlotsApi, SpatialPartition2D, SpatialResolution, WrappedPlotOutput} from '@geoengine/openapi-client';
import {ReplaySubject, firstValueFrom} from 'rxjs';
import {UserService, apiConfigurationWithAccessKey} from '../user/user.service';
import {Time} from '../time/time.model';
import {UUID} from '../datasets/dataset.model';
import {bboxDictToExtent, unixTimestampToIsoString} from '../util/conversions';
import {SpatialReference} from '../spatial-references/spatial-reference.model';

@Injectable({
    providedIn: 'root',
})
export class PlotsService {
    plotApi = new ReplaySubject<PlotsApi>(1);

    constructor(private sessionService: UserService) {
        this.sessionService.getSessionStream().subscribe({
            next: (session) => this.plotApi.next(new PlotsApi(apiConfigurationWithAccessKey(session.sessionToken))),
        });
    }

    async getPlot(
        id: UUID,
        bbox: BoundingBox2D,
        time: Time,
        spatialResolution: SpatialResolution,
        crs?: SpatialReference,
    ): Promise<WrappedPlotOutput> {
        const plotApi = await firstValueFrom(this.plotApi);

        return plotApi.getPlotHandler({
            bbox: bboxDictToExtent(bbox).join(','),
            time: time.asRequestString(),
            spatialResolution: `${spatialResolution.x},${spatialResolution.y}`,
            id,
            crs: crs?.srsString,
        });
    }
}
