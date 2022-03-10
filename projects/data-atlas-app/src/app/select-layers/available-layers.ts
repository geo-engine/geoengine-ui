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

const PROVIDER_ID = '1690c483-b17f-4d98-95c8-00a64849cd0b';

export const LAYERS: Map<TerraNovaGroup, Array<EbvHierarchy>> = new Map([
    [{name: 'Anthropogenic activity', icon: 'terrain'}, []],
    [{name: 'Biodiversity', icon: 'pets'}, []],
    [
        {name: 'Climate', icon: 'public'},
        [
            {
                providerId: PROVIDER_ID,
                tree: {
                    fileName: 'zapolska_climate_tn1_20220301.nc',
                    title: 'Climate layers for the Pre-Industrial time period',
                    summary:
                        'Daily climate metrics simulated at 0,25° spatial resolution (lat, lon) over Europe.  The dataset is a mean climatology of the Pre-Industrial conditions (see Methods below)',
                    creator: {
                        name: 'ZAPOLSKA, Anhelina',
                        institution: 'Vrije Universiteit Amsterdam',
                        email: 'a.zapolska@vu.nl',
                    },
                    spatialReference: 'EPSG:4326',
                    groups: [
                        {
                            name: 'metric_1',
                            title: 'Surface Air Temperature',
                            description: 'Simulated air temperature, taken at the surface',
                            dataType: 'F32',
                            groups: [],
                        },
                    ],
                    entities: [
                        {
                            id: 0,
                            name: 'surface air temperature',
                            description: '',
                        },
                    ],
                    time: {
                        start: moment.utc('1750-01-01T00:00:00').unix() * 1000,
                        end: moment.utc('1750-01-01T00:00:00').unix() * 1000,
                    },
                    timeStep: {
                        granularity: 'Years',
                        step: 0,
                    },
                    colorizer: {
                        type: 'linearGradient',
                        breakpoints: [
                            {value: -15.0, color: [49, 54, 149, 255]},
                            {value: -12.5, color: [62, 94, 168, 255]},
                            {value: -10.0, color: [81, 131, 187, 255]},
                            {value: -7.5, color: [110, 166, 206, 255]},
                            {value: -5.0, color: [144, 195, 221, 255]},
                            {value: -2.5, color: [178, 221, 235, 255]},
                            {value: 0.0, color: [212, 237, 244, 255]},
                            {value: 2.5, color: [236, 248, 226, 255]},
                            {value: 5.0, color: [255, 254, 190, 255]},
                            {value: 7.5, color: [254, 235, 161, 255]},
                            {value: 10.0, color: [254, 210, 131, 255]},
                            {value: 12.5, color: [253, 179, 102, 255]},
                            {value: 15.0, color: [248, 140, 81, 255]},
                            {value: 17.5, color: [239, 99, 63, 255]},
                            {value: 20.0, color: [221, 61, 45, 255]},
                            {value: 22.5, color: [194, 28, 39, 255]},
                            {value: 25.0, color: [165, 0, 38, 255]},
                        ],
                        noDataColor: [0, 0, 0, 0],
                        defaultColor: [0, 0, 0, 0],
                    },
                },
            },
            {
                providerId: PROVIDER_ID,
                tree: {
                    fileName: 'zapolska_climate_tn2_20220302.nc',
                    title: 'Climate layers for the Early Holocene (6K B.P.)',
                    summary:
                        'Daily climate metrics simulated at 0,25° spatial resolution (lat, lon) over Europe.  The dataset is a mean climatology of the 6K B.P. conditions (see Methods below)',
                    creator: {
                        name: 'ZAPOLSKA, Anhelina',
                        institution: 'Vrije Universiteit Amsterdam',
                        email: 'a.zapolska@vu.nl',
                    },
                    spatialReference: 'EPSG:4326',
                    groups: [
                        {
                            name: 'metric_1',
                            title: 'Surface Air Temperature',
                            description: 'Simulated air temperature, taken at the surface',
                            dataType: 'F32',
                            groups: [],
                        },
                    ],
                    entities: [
                        {
                            id: 0,
                            name: 'surface air temperature',
                            description: '',
                        },
                    ],
                    time: {
                        start: moment.utc('0001-01-01T00:00:00').unix() * 1000,
                        end: moment.utc('0001-01-01T00:00:00').unix() * 1000,
                    },
                    timeStep: {
                        granularity: 'Years',
                        step: 0,
                    },
                    colorizer: {
                        type: 'linearGradient',
                        breakpoints: [
                            {value: -15.0, color: [49, 54, 149, 255]},
                            {value: -12.5, color: [62, 94, 168, 255]},
                            {value: -10.0, color: [81, 131, 187, 255]},
                            {value: -7.5, color: [110, 166, 206, 255]},
                            {value: -5.0, color: [144, 195, 221, 255]},
                            {value: -2.5, color: [178, 221, 235, 255]},
                            {value: 0.0, color: [212, 237, 244, 255]},
                            {value: 2.5, color: [236, 248, 226, 255]},
                            {value: 5.0, color: [255, 254, 190, 255]},
                            {value: 7.5, color: [254, 235, 161, 255]},
                            {value: 10.0, color: [254, 210, 131, 255]},
                            {value: 12.5, color: [253, 179, 102, 255]},
                            {value: 15.0, color: [248, 140, 81, 255]},
                            {value: 17.5, color: [239, 99, 63, 255]},
                            {value: 20.0, color: [221, 61, 45, 255]},
                            {value: 22.5, color: [194, 28, 39, 255]},
                            {value: 25.0, color: [165, 0, 38, 255]},
                        ],
                        noDataColor: [0, 0, 0, 0],
                        defaultColor: [0, 0, 0, 0],
                    },
                },
            },
        ],
    ],
]);
