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
    PointSymbology,
    VectorSymbology,
    DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR,
    DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR,
    SymbologyType
} from '../layers/symbology/symbology.model';

export class StyleCreator {

    public static fromVectorSymbology(sym: AbstractVectorSymbology): OlStyleFunction | OlStyle {
        switch (sym.getSymbologyType()) {

            case SymbologyType.SIMPLE_LINE:
                return StyleCreator.fromSimpleLineSymbology(sym);
            case SymbologyType.SIMPLE_VECTOR:
                return StyleCreator.fromSimpleVectorSymbology(sym);

            case SymbologyType.SIMPLE_POINT:
                return StyleCreator.fromSimplePointSymbology(sym as PointSymbology);


            case SymbologyType.COMPLEX_POINT:
                return StyleCreator.fromComplexPointSymbology(sym as PointSymbology);

            case SymbologyType.COMPLEX_LINE:
                return StyleCreator.fromComplexVectorSymbology(sym as VectorSymbology);

            case SymbologyType.COMPLEX_VECTOR:
                return StyleCreator.fromComplexVectorSymbology(sym as VectorSymbology);

            default:
                console.error('StyleCreator: unknown AbstractSymbology: ' + sym.getSymbologyType());
                return StyleCreator.fromSimpleVectorSymbology(sym); // Lets pretend unknown symbology is a simple vector...
        }

    }

    static createHighlightSymbology<S extends AbstractVectorSymbology>(sym: S): S {
        const highlightSymbology: S = sym.clone() as S;
        highlightSymbology.fillRGBA = DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR;
        highlightSymbology.strokeRGBA = DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR;
        return highlightSymbology;
    }

    static fromSimpleLineSymbology(sym: AbstractVectorSymbology): OlStyle {
        return new OlStyle({
            stroke: new OlStyleStroke({color: sym.strokeRGBA.rgbaTuple(), width: sym.strokeWidth}),
        });
    }

    static fromSimpleVectorSymbology(sym: AbstractVectorSymbology): OlStyle {
        return new OlStyle({
            fill: new OlStyleFill({color: sym.fillRGBA.rgbaTuple()}),
            stroke: new OlStyleStroke({color: sym.strokeRGBA.rgbaTuple(), width: sym.strokeWidth}),
        });
    }

    static fromSimplePointSymbology(sym: PointSymbology): OlStyle {
        return new OlStyle({
            image: new OlStyleCircle({
                radius: sym.radius,
                fill: new OlStyleFill({color: sym.fillRGBA.rgbaTuple()}),
                stroke: new OlStyleStroke({color: sym.strokeRGBA.rgbaTuple(), width: sym.strokeWidth}),
            }),
        });
    }

    static buildStyleKey(
        featureFillColorValue: string | number | undefined,
        featureStrokeColorValue: string | number | undefined,
        featureTextValue: string | number | undefined,
        featureRadiusValue: string | number | undefined
    ): string {
        const VALUE_SEPARATOR_SYMBOL = ':::';
        return `${featureFillColorValue}${VALUE_SEPARATOR_SYMBOL}${featureStrokeColorValue}${VALUE_SEPARATOR_SYMBOL}`
            + `${featureTextValue}${VALUE_SEPARATOR_SYMBOL}${featureRadiusValue}`;
    }

    static fromComplexVectorSymbology(sym: VectorSymbology): OlStyleFunction {
        // we need a style cache to speed things up. This dangles in the void of the GC...
        const styleCache: { [key: string]: OlStyle } = {};

        return (feature: OlFeature, resolution: number) => {

            const featureFillColorValue =
                (sym.fillColorAttribute && sym.describesElementFill()) ? feature.get(sym.fillColorAttribute) : undefined;
            const featureStrokeColorValue = (sym.strokeColorAttribute) ? feature.get(sym.strokeColorAttribute) : undefined;
            const featureTextValue = (sym.textAttribute) ? feature.get(sym.textAttribute) : undefined;
            const styleKey =
                StyleCreator.buildStyleKey(featureFillColorValue, featureStrokeColorValue, featureTextValue, undefined);

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
                const textStyle = (!featureTextValue) ? undefined : new OlStyleText({
                    text: featureTextValue.toString(),
                    fill: new OlStyleFill({
                        color: sym.textColor.rgbaTuple(),
                    }),
                    stroke: new OlStyleStroke({
                        color: sym.strokeRGBA.rgbaTuple(),
                        width: sym.textStrokeWidth,
                    })
                });

                const style = new OlStyle({
                    stroke: strokeStyle,
                    fill: fillStyle,
                    text: textStyle
                });
                styleCache[styleKey] = style;
            }

            return styleCache[styleKey];
        };
    }

    static fromComplexPointSymbology(sym: PointSymbology): OlStyleFunction {
        // we need a style cache to speed things up. This dangles in the void of the GC...
        const styleCache: { [key: string]: OlStyle } = {};

        return (feature: OlFeature, resolution: number) => {

            const featureFillColorValue =
                (sym.fillColorAttribute && sym.describesElementFill()) ? feature.get(sym.fillColorAttribute) : undefined;
            const featureStrokeColorValue = (sym.strokeColorAttribute) ? feature.get(sym.strokeColorAttribute) : undefined;
            const featureTextValue = (sym.textAttribute) ? feature.get(sym.textAttribute) : undefined;
            const featureRadiusValue = (sym.radiusAttribute) ? feature.get(sym.radiusAttribute) : undefined;
            const styleKey = StyleCreator.buildStyleKey(
                featureFillColorValue, featureStrokeColorValue, featureTextValue, featureRadiusValue
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
                const radius = featureRadiusValue ? featureRadiusValue as number * sym.radiusFactor : sym.radius;

                const imageStyle = new OlStyleCircle({
                    radius,
                    fill: fillStyle,
                    stroke: strokeStyle,
                });

                // only build the text style if we are going to show it
                const textStyle = (!featureTextValue) ? undefined : new OlStyleText({
                    text: featureTextValue.toString(),
                    fill: new OlStyleFill({
                        color: sym.textColor.rgbaTuple(),
                    }),
                    stroke: new OlStyleStroke({
                        color: sym.strokeRGBA.rgbaTuple(),
                        width: sym.textStrokeWidth,
                    })
                });

                const style = new OlStyle({
                    image: imageStyle,
                    text: textStyle
                });
                styleCache[styleKey] = style;
            }

            return styleCache[styleKey];
        };
    }
}
