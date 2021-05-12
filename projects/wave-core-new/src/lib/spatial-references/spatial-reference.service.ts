import {Injectable} from '@angular/core';
import {merge, Observable, of} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {SpatialReferenceSpecificationDict, SrsString, UUID} from '../backend/backend.model';
import {BackendService} from '../backend/backend.service';
import {UserService} from '../users/user.service';
import {SpatialReference, SpatialReferenceSpecification, WELL_KNOWN_SPATAL_REFERENCES} from './spatial-reference.model';
import {get as olGetProjection, addProjection as olAddProjection} from 'ol/proj';
import {register as olProj4Register} from 'ol/proj/proj4';
import OlProjection from 'ol/proj/Projection';
import proj4 from 'proj4';

/**
 * Service for managing spatial references and projections
 */
@Injectable()
export class SpatialReferenceService {
    private specs = new Map<string, SpatialReferenceSpecification>();

    constructor(protected backend: BackendService, protected userService: UserService) {
        this.registerDefaults();
    }

    /**
     * lookup specification by srs string authority:code
     */
    getSpatialReferenceSpecification(srsString: SrsString): Observable<SpatialReferenceSpecification> {
        const spec = this.specs.get(srsString.toUpperCase());

        if (spec) {
            return of(spec);
        }

        return this.getAndRegisterSpec(srsString);
    }

    getOlProjection(spatialReference: SpatialReference): OlProjection {
        return olGetProjection(spatialReference.srsString);
    }

    private registerDefaults(): void {
        this.specs.set(
            'EPSG:4326',
            new SpatialReferenceSpecification({
                name: 'WGS84',
                spatialReference: 'EPSG:4326',
                projString: '+proj=longlat +datum=WGS84 +no_defs +type=crs',
                extent: {
                    lowerLeftCoordinate: {
                        x: -180,
                        y: -90,
                    },
                    upperRightCoordinate: {
                        x: 180,
                        y: 90,
                    },
                },
                axisLabels: ['longitude', 'latitude'],
            }),
        );

        this.specs.set(
            'EPSG:3857',
            new SpatialReferenceSpecification({
                name: 'WGS84 Webmercator',
                spatialReference: 'EPSG:3857',
                projString:
                    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
                extent: {
                    lowerLeftCoordinate: {
                        x: -20037508.34,
                        y: -20037508.34,
                    },
                    upperRightCoordinate: {
                        x: 20037508.34,
                        y: 20037508.34,
                    },
                },
            }),
        );

        merge(
            WELL_KNOWN_SPATAL_REFERENCES.filter((sref) => !this.specs.has(sref.spatialReference.srsString)).map((sref) =>
                this.getAndRegisterSpec(sref.spatialReference.srsString),
            ),
        ).subscribe((specs) => {
            specs.forEach((spec) => {
                this.specs.set(spec.spatialReference.srsString, spec);
            });
        });
    }

    private getAndRegisterSpec(srsString: SrsString): Observable<SpatialReferenceSpecification> {
        return this.userService.getSessionTokenForRequest().pipe(
            mergeMap((token: UUID) => this.backend.getSpatialReferenceSpecification(token, srsString)),
            map((dict: SpatialReferenceSpecificationDict) => {
                const spec = SpatialReferenceSpecification.fromDict(dict);

                proj4.defs(spec.projString);
                olProj4Register(proj4);

                olAddProjection(
                    new OlProjection({
                        code: spec.spatialReference.srsString,
                        extent: spec.extent,
                        units: '', // TODO: get units from proj or backend
                    }),
                );

                return spec;
            }),
        );
    }
}
