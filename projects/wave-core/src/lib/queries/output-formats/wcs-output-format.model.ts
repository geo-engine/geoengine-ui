import {OutputFormat} from '../output-format.model';

/**
 * Base class for WCS Output Formats
 */
export class WCSOutputFormat extends OutputFormat {
}

/**
 * WFS Output format for export
 */
class ExportWCSOutputFormat extends WCSOutputFormat {
    constructor(outputFormat: WCSOutputFormat) {
        super(
            'application/x-export;' + outputFormat.getFormat(),
            outputFormat.toString()
        );
    }
}

/**
 * WCS Output Formats
 */
export class WCSOutputFormatCollection {
    static readonly INSTANCE = new WCSOutputFormatCollection();

    private _TIFF = new WCSOutputFormat('image/tiff', 'GeoTIFF');
    private _EXPORT_TIFF = new ExportWCSOutputFormat(this._TIFF);
    private _TYPES = [this._TIFF];
    private _EXPORT_TYPES = [this._EXPORT_TIFF];

    protected constructor() {
    }

    get TIFF(): WCSOutputFormat {
        return this._TIFF;
    };

    get TYPES(): Array<WCSOutputFormat> {
        return this._TYPES;
    }

    get EXPORT_TYPES(): Array<WCSOutputFormat> {
        return this._EXPORT_TYPES;
    }
}

/**
 * Export WCSOutputFormatCollection as singleton.
 */
// tslint:disable-next-line:variable-name
export const WCSOutputFormats = WCSOutputFormatCollection.INSTANCE;
