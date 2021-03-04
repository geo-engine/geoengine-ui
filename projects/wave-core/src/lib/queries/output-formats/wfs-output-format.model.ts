import {OutputFormat} from '../output-format.model';

/**
 * Base class for WFS Output Formats
 */
export class WFSOutputFormat extends OutputFormat {}

/**
 * WFS Output format for export
 */
class ExportWFSOutputFormat extends WFSOutputFormat {
    constructor(outputFormat: WFSOutputFormat) {
        super('application/x-export;' + outputFormat.getFormat(), outputFormat.toString());
    }
}

/**
 * WFS Output Formats
 */
export class WFSOutputFormatCollection {
    static readonly INSTANCE = new WFSOutputFormatCollection();

    private _JSON = new WFSOutputFormat('application/json', 'GeoJSON');
    private _CSV = new WFSOutputFormat('csv', 'CSV');
    private _JSON_ZIP = new ExportWFSOutputFormat(this._JSON);
    private _CSV_ZIP = new ExportWFSOutputFormat(this._CSV);
    private _TYPES = [this._JSON, this._CSV];
    private _EXPORT_TYPES = [this._JSON_ZIP, this._CSV_ZIP];

    protected constructor() {}

    get JSON(): WFSOutputFormat {
        return this._JSON;
    }

    get CSV(): WFSOutputFormat {
        return this._CSV;
    }

    get JSON_ZIP(): WFSOutputFormat {
        return this._JSON_ZIP;
    }

    get CSV_ZIP(): WFSOutputFormat {
        return this._CSV_ZIP;
    }

    get TYPES(): Array<WFSOutputFormat> {
        return this._TYPES;
    }

    get EXPORT_TYPES(): Array<WFSOutputFormat> {
        return this._EXPORT_TYPES;
    }
}

/**
 * Export WFSOutputFormat as singleton.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle, id-blacklist, id-match
export const WFSOutputFormats = WFSOutputFormatCollection.INSTANCE;
