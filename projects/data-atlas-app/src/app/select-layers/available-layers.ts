import moment from 'moment';
import {Colorizer, ColorizerDict, Time, TimeIntervalDict, TimeStepDict, timeStepDictTotimeStepDuration, UUID} from 'wave-core';

export interface EbvHierarchy {
    providerId: UUID;
    tree: EbvTree;
}

export interface EbvTree {
    fileName: string;
    title: string;
    summary: string; // TODO: add to backend
    creator: EbvCreator; // TODO: add to backend
    spatialReference: string;
    groups: Array<EbvTreeSubgroup>;
    entities: Array<EbvTreeEntity>;
    time: TimeIntervalDict;
    timeStep: TimeStepDict;
    colorizer: ColorizerDict;
}

export interface EbvCreator {
    name: string;
    institution: string;
    email: string;
}

export interface EbvTreeSubgroup {
    name: string;
    title: string;
    description: string;
    dataType?: 'U8' | 'U16' | 'U32' | 'U64' | 'I8' | 'I16' | 'I32' | 'I64' | 'F32' | 'F64';
    groups: Array<EbvTreeSubgroup>;
}

export interface EbvTreeEntity {
    id: number;
    name: string;
    description: string;
}

export interface EbvDatasetId {
    fileName: string;
    groupNames: Array<string>;
    entity: number;
}

export function guessDataRange(colorizer: Colorizer): {min: number; max: number} {
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;

    for (const breakpoint of colorizer.getBreakpoints()) {
        min = Math.min(min, breakpoint.value);
        max = Math.max(max, breakpoint.value);
    }

    return {min, max};
}

export function computeTimeSteps(inputTime: TimeIntervalDict, inputTimeStep: TimeStepDict): Array<Time> {
    const timeSteps: Array<Time> = [];

    const timeStep = timeStepDictTotimeStepDuration(inputTimeStep);

    let time = new Time(moment.unix(inputTime.start / 1_000).utc());
    const timeEnd = new Time(moment.unix(inputTime.end / 1_000).utc());

    while (time < timeEnd) {
        timeSteps.push(time);
        time = time.addDuration(timeStep);
    }

    if (timeSteps.length === 0) {
        // only one time step
        timeSteps.push(time);
    }

    return timeSteps;
}

export interface TerraNovaGroup {
    name: 'Anthropogenic activity' | 'Biodiversity' | 'Climate';
    icon: string;
}
