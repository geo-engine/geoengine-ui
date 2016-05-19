import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

import {Projection, Projections} from '../projection.model';

interface ProjectionTypeConfig {
    srcProjection: Projection;
    destProjection: Projection;
}

interface ProjectionTypeMappingDict extends OperatorTypeMappingDict {
    src_projection: string;
    dest_projection: string;
}

export interface ProjectionTypeDict extends OperatorTypeDict  {
    srcProjection: string;
    destProjection: string;
}

/**
 * The projection type.
 */
export class ProjectionType extends OperatorType {
    private static _TYPE = 'projection';
    private static _ICON_URL = OperatorType.createIconDataUrl(ProjectionType._TYPE);
    private static _NAME = 'Projection';

    static get TYPE(): string { return ProjectionType._TYPE; }
    static get ICON_URL(): string { return ProjectionType._ICON_URL; }
    static get NAME(): string { return ProjectionType._NAME; }

    private srcProjection: Projection;
    private destProjection: Projection;

    constructor(config: ProjectionTypeConfig) {
        super();
        this.srcProjection = config.srcProjection;
        this.destProjection = config.destProjection;
    }

    static fromDict(dict: ProjectionTypeDict): ProjectionType {
        return new ProjectionType({
            srcProjection: Projections.fromCode(dict.srcProjection),
            destProjection: Projections.fromCode(dict.destProjection),
        });
    }

    getMappingName(): string {
        return ProjectionType.TYPE;
    }

    getIconUrl(): string {
        return ProjectionType.ICON_URL;
    }

    toString(): string {
        return ProjectionType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['srcProjection', this.srcProjection.toString()],
            ['destProjection', this.destProjection.toString()],
        ];
    }

    toMappingDict(): ProjectionTypeMappingDict {
        return {
            src_projection: this.srcProjection.getCode(),
            dest_projection: this.destProjection.getCode(),
        };
    }

    toDict(): ProjectionTypeDict {
        return {
            operatorType: ProjectionType.TYPE,
            srcProjection: this.srcProjection.getCode(),
            destProjection: this.destProjection.getCode(),
        };
    }

}
