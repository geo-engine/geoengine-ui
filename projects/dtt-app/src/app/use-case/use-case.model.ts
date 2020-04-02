import {Extent, TimeInterval, TimeStepDuration} from 'wave-core';

export interface UseCase {
    readonly timeLimits: TimeInterval;
    readonly timeStep: TimeStepDuration;
    readonly boundingBox: Extent; // TODO: which projection?
    // TODO: layers, etc.
}
