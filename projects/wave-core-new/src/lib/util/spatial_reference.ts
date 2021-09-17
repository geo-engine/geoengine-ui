import {SpatialReference} from '../spatial-references/spatial-reference.model';
import {WGS_84} from '../spatial-references/spatial-reference.service';

/**
 * @returns the target spatial reference for a common projection of the given inputs
 */
export function getProjectionTarget(inputRefs: Array<SpatialReference>): SpatialReference {
    if (inputRefs.length === 0) {
        return WGS_84.spatialReference;
    }

    if (inputRefs.findIndex((s) => s.srsString === WGS_84.spatialReference.srsString) > 0) {
        return WGS_84.spatialReference;
    }

    return inputRefs[0];
}
