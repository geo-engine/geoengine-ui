import {Extent, TimeInterval, TimeIntervalDict, TimeStepDuration, MappingSource} from 'wave-core';

export interface UseCaseDict {
    readonly name: string;
    readonly shortDescription: string;

    /**
     * A HTML description
     */
    readonly description: string;

    readonly timeLimits: TimeIntervalDict;
    readonly timeStep: TimeStepDuration;
    readonly boundingBox: Extent; // WGS84

    /**
     * A list of dataset names
     */
    readonly datasets: Array<string>;
}

export interface UseCase {
    readonly name: string;
    readonly shortDescription: string;

    /**
     * A HTML description
     */
    readonly description: string;

    readonly timeLimits: TimeInterval;
    readonly timeStep: TimeStepDuration;
    readonly boundingBox: Extent; // WGS84

    /**
     * A list of dataset names
     */
    readonly datasets: Array<MappingSource>;
}
