/**
 * Created by jmaerte on 08.03.2017.
 */
export class CSV {
    public layerName: string;
    /**Data Properties
     * */
    public delimitter: string;
    public decimalSeperator: string;
    public isTextQualifier: boolean;
    public textQualifier: string;
    public isHeaderRow: boolean;
    public headerRow: number;
    /**Spatial Properties
     * */
        // public isSpatialProperties:boolean; Laut Folie optional, nach Absprache nicht.
    public xCol: number;
    public yCol: number;
    public spatialRefSys: string/**:Typ Einfügen(Enum)*/;
    public coordForm: string/**:Typ Einfügen(Enum)*/;
    /**Temporal Properties
     * */
    public intervallType: string;
    /**:element of {[Start, +inf), [Start, End], [Start, Start+Duration], (-inf, End]}*/
    public startFormat: number;
    public startCol: number;
    public endFormat: number;
    public endCol: number;
    public content: string;
}
