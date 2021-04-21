import {SpatialReference, SpatialReferences} from '../operators/spatial-reference.model';

/**
 * @returns the target spatial reference for a common projection of the given inputs
 */
export function getProjectionTarget(inputRefs: Array<SpatialReference>): SpatialReference {
    if (inputRefs.length === 0) {
        return SpatialReferences.WGS_84;
    }

    if (inputRefs.indexOf(SpatialReferences.WGS_84) > 0) {
        return SpatialReferences.WGS_84;
    }

    return inputRefs[0];
}
