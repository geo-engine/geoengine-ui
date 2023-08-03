import {Injectable} from '@angular/core';
import {Config, ConfigStructure, DEFAULT_CONFIG, mergeDeepOverrideLists} from '@geoengine/core';

interface Data {
    readonly RASTER4D: {
        readonly PROVIDER: string;
        readonly COLLECTION: string;
    };
    readonly RASTER_OTHER: {
        readonly PROVIDER: string;
        readonly COLLECTION: string;
    };
    readonly VECTOR: {
        readonly PROVIDER: string;
        readonly COLLECTION: string;
    };
}

interface AppConfigStructure extends ConfigStructure {
    readonly DATA: Data;
}

const APP_CONFIG_DEFAULTS = mergeDeepOverrideLists(DEFAULT_CONFIG, {
    DATA: {
        RASTER4D: {
            PROVIDER: '1690c483-b17f-4d98-95c8-00a64849cd0b',
            COLLECTION: 'root',
        },
        RASTER_OTHER: {
            PROVIDER: 'ce5e84db-cbf9-48a2-9a32-d4b7cc56ea74',
            COLLECTION: 'ddacf46f-b28c-4e05-aae4-58e933cfdec3',
        },
        VECTOR: {
            PROVIDER: 'ce5e84db-cbf9-48a2-9a32-d4b7cc56ea74',
            COLLECTION: '77004f1b-136d-4392-8be9-e88da1528838',
        },
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected override config!: AppConfigStructure;

    get DATA(): Data {
        return this.config.DATA;
    }

    override load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
