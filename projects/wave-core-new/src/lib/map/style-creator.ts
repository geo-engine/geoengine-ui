import {
    Circle as OlStyleCircle,
    Fill as OlStyleFill,
    Stroke as OlStyleStroke,
    Style as OlStyle,
    StyleFunction as OlStyleFunction,
    Text as OlStyleText,
} from 'ol/style';

import {Feature as OlFeature} from 'ol';

import {
    AbstractVectorSymbology,
    DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR,
    DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR,
    MAX_ALLOWED_POINT_RADIUS,
    MAX_ALLOWED_TEXT_LENGTH,
    MIN_ALLOWED_POINT_RADIUS,
    PointSymbology,
    SymbologyType,
    VectorSymbology,
} from '../layers/symbology/symbology.model';

/**
 * The StyleCreator genreates OpenLayers styles from a layers Symbology.
 */
export class StyleCreator {
    /**
     * Generate a style from a vector layer symbology.
     */
    public static fromVectorSymbology(sym: AbstractVectorSymbology): OlStyleFunction | OlStyle {
        switch (sym.getSymbologyType()) {
            case SymbologyType.SIMPLE_POINT:
            case SymbologyType.CLUSTERED_POINT:
            case SymbologyType.COMPLEX_POINT:
                return StyleCreator.fromComplexPointSymbology(sym as PointSymbology);

            case SymbologyType.SIMPLE_LINE:
            case SymbologyType.COMPLEX_LINE:
                return StyleCreator.fromComplexVectorSymbology(sym as VectorSymbology);

            case SymbologyType.SIMPLE_VECTOR:
            case SymbologyType.COMPLEX_VECTOR:
                return StyleCreator.fromComplexVectorSymbology(sym as VectorSymbology);

            default:
                console.error('StyleCreator: unknown AbstractSymbology: ' + sym.getSymbologyType());
                return StyleCreator.fromComplexVectorSymbology(sym as VectorSymbology); // VectorSymbology should handle all types
        }
    }

    /**
     * Handles radius attribute values and converts them to valid radius.
     */
    static handleRadiusAttributeValue(radius: number | string, radiusScale: number = 1.0): number | undefined {
        const numberRadius = typeof radius === 'string' ? parseFloat(radius) : radius;
        if (radius === undefined || radius === null) {
            return undefined;
        }
        if (numberRadius > MAX_ALLOWED_POINT_RADIUS) {
            return MAX_ALLOWED_POINT_RADIUS;
        } else if (numberRadius < MIN_ALLOWED_POINT_RADIUS) {
            return MIN_ALLOWED_POINT_RADIUS;
        } else {
            return Math.trunc(numberRadius * radiusScale);
        }
    }

    /**
     * Handles text attribute values and converts them to a string or number for display.
     */
    static handleTextAttributeValue(text: string | number): string | number | undefined {
        if (text === undefined || text === null) {
            return undefined;
        }
        if (typeof text === 'string') {
            return text.slice(0, MAX_ALLOWED_TEXT_LENGTH);
        }
        return text;
    }

    /**
     * Warps a Symbology into a highlighted Symbology.
     */
    static createHighlightSymbology<S extends AbstractVectorSymbology>(sym: S): S {
        const highlightSymbology: S = sym.clone() as S;
        highlightSymbology.fillRGBA = DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR;
        highlightSymbology.strokeRGBA = DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR;
        return highlightSymbology;
    }

    /**
     * Generate a style key (string) for a feature.
     */
    static buildStyleKey(
        featureFillColorValue: string | number | undefined,
        featureStrokeColorValue: string | number | undefined,
        featureTextValue: string | number | undefined,
        featureRadiusValue: string | number | undefined,
    ): string {
        const VALUE_SEPARATOR_SYMBOL = ':::';
        return (
            `${featureFillColorValue}${VALUE_SEPARATOR_SYMBOL}${featureStrokeColorValue}${VALUE_SEPARATOR_SYMBOL}` +
            `${featureTextValue}${VALUE_SEPARATOR_SYMBOL}${featureRadiusValue}`
        );
    }

    /**
     * Generate an OpenLayers style function for vector layers.
     */
    static fromComplexVectorSymbology(sym: VectorSymbology): OlStyleFunction {
        // we need a style cache to speed things up. This dangles in the void of the GC...
        const styleCache: {[key: string]: OlStyle} = {};

        return (feature: OlFeature, _resolution: number) => {
            const featureFillColorValue =
                sym.fillColorAttribute && sym.describesElementFill() ? feature.get(sym.fillColorAttribute) : undefined;
            const featureStrokeColorValue = sym.strokeColorAttribute ? feature.get(sym.strokeColorAttribute) : undefined;
            const featureTextValue = sym.textAttribute ? StyleCreator.handleTextAttributeValue(feature.get(sym.textAttribute)) : undefined;
            const styleKey = StyleCreator.buildStyleKey(featureFillColorValue, featureStrokeColorValue, featureTextValue, undefined);

            if (!styleCache[styleKey]) {
                const fillColorBreakpointLookup = sym.fillColorizer.getBreakpointForValue(featureFillColorValue, true);
                const fillColor = fillColorBreakpointLookup ? fillColorBreakpointLookup.rgba.rgbaTuple() : sym.fillRGBA.rgbaTuple();

                const strokeColorBreakpointLookup = sym.strokeColorizer.getBreakpointForValue(featureStrokeColorValue, true);
                const strokeColor = strokeColorBreakpointLookup ? strokeColorBreakpointLookup.rgba.rgbaTuple() : sym.strokeRGBA.rgbaTuple();

                const fillStyle = new OlStyleFill({color: fillColor});
                const strokeStyle = new OlStyleStroke({color: strokeColor, width: sym.strokeWidth});

                if (sym.strokeDashStyle && sym.strokeDashStyle.length > 1) {
                    strokeStyle.setLineDash(sym.strokeDashStyle);
                }

                // only build the text style if we are going to show it
                const textStyle = !featureTextValue
                    ? undefined
                    : new OlStyleText({
                          text: featureTextValue.toString(),
                          fill: new OlStyleFill({
                              color: sym.textColor.rgbaTuple(),
                          }),
                          stroke: new OlStyleStroke({
                              color: sym.strokeRGBA.rgbaTuple(),
                              width: sym.textStrokeWidth,
                          }),
                          overflow: true,
                      });

                const style = new OlStyle({
                    stroke: strokeStyle,
                    fill: fillStyle,
                    text: textStyle,
                });
                styleCache[styleKey] = style;
            }

            return styleCache[styleKey];
        };
    }

    /**
     * Generate an OpenLayers style function for point layers.
     */
    static fromComplexPointSymbology(sym: PointSymbology): OlStyleFunction {
        // we need a style cache to speed things up. This dangles in the void of the GC...
        const styleCache: {[key: string]: OlStyle} = {};

        return (feature: OlFeature, _resolution: number) => {
            const featureFillColorValue =
                sym.fillColorAttribute && sym.describesElementFill() ? feature.get(sym.fillColorAttribute) : undefined;
            const featureStrokeColorValue = sym.strokeColorAttribute ? feature.get(sym.strokeColorAttribute) : undefined;
            const featureTextValue = sym.textAttribute ? StyleCreator.handleTextAttributeValue(feature.get(sym.textAttribute)) : undefined;
            const featureRadiusValue = sym.radiusAttribute
                ? StyleCreator.handleRadiusAttributeValue(feature.get(sym.radiusAttribute))
                : undefined;

            const styleKey = StyleCreator.buildStyleKey(
                featureFillColorValue,
                featureStrokeColorValue,
                featureTextValue,
                featureRadiusValue,
            );

            if (!styleCache[styleKey]) {
                const fillColorBreakpointLookup = sym.fillColorizer.getBreakpointForValue(featureFillColorValue, true);
                const fillColor = fillColorBreakpointLookup ? fillColorBreakpointLookup.rgba.rgbaTuple() : sym.fillRGBA.rgbaTuple();

                const strokeColorBreakpointLookup = sym.strokeColorizer.getBreakpointForValue(featureStrokeColorValue, true);
                const strokeColor = strokeColorBreakpointLookup ? strokeColorBreakpointLookup.rgba.rgbaTuple() : sym.strokeRGBA.rgbaTuple();

                const fillStyle = new OlStyleFill({color: fillColor});
                const strokeStyle = new OlStyleStroke({color: strokeColor, width: sym.strokeWidth});

                if (sym.strokeDashStyle && sym.strokeDashStyle.length > 1) {
                    strokeStyle.setLineDash(sym.strokeDashStyle);
                }

                const radius = featureRadiusValue ? featureRadiusValue : sym.radius;

                const imageStyle = new OlStyleCircle({
                    radius,
                    fill: fillStyle,
                    stroke: strokeStyle,
                });

                // only build the text style if we are going to show it
                const textStyle = !featureTextValue
                    ? undefined
                    : new OlStyleText({
                          text: featureTextValue.toString(),
                          fill: new OlStyleFill({
                              color: sym.textColor.rgbaTuple(),
                          }),
                          stroke: new OlStyleStroke({
                              color: sym.strokeRGBA.rgbaTuple(),
                              width: sym.textStrokeWidth,
                          }),
                      });

                const style = new OlStyle({
                    image: imageStyle,
                    text: textStyle,
                });
                styleCache[styleKey] = style;
            }

            return styleCache[styleKey];
        };
    }
}
