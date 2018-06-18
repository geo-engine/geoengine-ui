import ol from 'ol';
import OlStyleStyle from 'ol/style/style';
import OlStyleFill from 'ol/style/fill'
import OlStyleStroke from 'ol/style/stroke'
import OlStyleCircle from 'ol/style/circle'
import OlStyleText from 'ol/style/text'

import {
    SymbologyType,
    AbstractVectorSymbology,
    SimpleVectorSymbology,
    SimplePointSymbology,
    ComplexVectorSymbology,
    ComplexPointSymbology,
    DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR,
    DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR
} from '../layers/symbology/symbology.model';

export class StyleCreator {

    public static fromVectorSymbology(sym: AbstractVectorSymbology): ol.StyleFunction | ol.style.Style {
        // console.log('StyleCreator', 'fromVectorSymbology', sym);
        switch (sym.getSymbologyType()) {
            case SymbologyType.SIMPLE_VECTOR:
                return StyleCreator.fromSimpleVectorSymbology(sym);

            case SymbologyType.SIMPLE_POINT:
                return StyleCreator.fromSimplePointSymbology(sym as SimplePointSymbology);

            case SymbologyType.COMPLEX_VECTOR:
                return StyleCreator.fromComplexVectorSymbology(sym as ComplexVectorSymbology);

            case SymbologyType.COMPLEX_POINT:
                return StyleCreator.fromComplexPointSymbology(sym as ComplexPointSymbology);

            default:
                console.error('StyleCreator: unknown Symbology: ' + sym.getSymbologyType())
                return StyleCreator.fromSimpleVectorSymbology(sym); // Lets pretend unknown symbology is a simple vector...
        }

    }

    static createHighlightSymbology<S extends AbstractVectorSymbology> (sym: S): S {
        const highlightSymbology: S = sym.clone() as S; // wtf?
        highlightSymbology.fillRGBA = DEFAULT_VECTOR_HIGHLIGHT_FILL_COLOR;
        highlightSymbology.strokeRGBA = DEFAULT_VECTOR_HIGHLIGHT_STROKE_COLOR;
        return highlightSymbology;
    }

    static fromSimpleVectorSymbology(sym: AbstractVectorSymbology): ol.style.Style {
        return new OlStyleStyle({
            fill: new OlStyleFill({ color: sym.fillRGBA.rgbaTuple() }),
            stroke: new OlStyleStroke({ color: sym.strokeRGBA.rgbaTuple(), width: sym.strokeWidth }),
        });
    }

    static fromSimplePointSymbology(sym: SimplePointSymbology): ol.style.Style {
            return new OlStyleStyle({
                image: new OlStyleCircle({
                    radius: sym.radius,
                    fill: new OlStyleFill({ color: sym.fillRGBA.rgbaTuple() }),
                    stroke: new OlStyleStroke({ color: sym.strokeRGBA.rgbaTuple(), width: sym.strokeWidth }),
                }),
            });
    }

    // TODO: put style and cache into wrapper class?

    static fromComplexVectorSymbology(sym: ComplexVectorSymbology): ol.StyleFunction {
      // we need a style cache to speed things up. This dangles in the void of the GC...
      const styleCache: {[key: string]: OlStyleStyle} = {};

      return (feature: ol.Feature, resolution: number) => {

          // console.log(feature, this.colorAttribute, this.textAttribute, this.radiusAttribute);

          const featureColorValue = (sym.colorAttribute) ? feature.get(sym.colorAttribute) : undefined;
          const featureTextValue = (sym.textAttribute) ? feature.get(sym.textAttribute) : undefined;

          // console.log(featureColorValue, featureTextValue, featureRadiusValue);

          let styleKey = '';
          styleKey += (featureColorValue ? featureColorValue.toString() : '|||');
          styleKey += (':::' + (featureTextValue ? featureTextValue.toString() : '|||'));

          // console.log("ComplexVectorSymbology.getOlStyleAsFunction", "styleKey", styleKey);

          if (!styleCache[styleKey]) {

              const colorBreakpointLookup = sym.colorizer.getBreakpointForValue(featureColorValue, true);
              // console.log('StyleCreator', 'fromComplexVectorSymbology', 'colorBreakpointLookup:', colorBreakpointLookup);
              const color = colorBreakpointLookup ? colorBreakpointLookup.rgba.rgbaTuple() : sym.fillRGBA.rgbaTuple();

              // console.log("ComplexVectorSymbology.getOlStyleAsFunction", colorLookup, color, radius);

              const fill = new OlStyleFill({ color: color });
              const stroke = new OlStyleStroke({ color: sym.strokeRGBA.rgbaTuple(), width: sym.strokeWidth });

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

              const style = new OlStyleStyle({
                  stroke: stroke,
                  fill: fill,
                  text: textStyle
              });
              styleCache[styleKey] = style;
          }

          return styleCache[styleKey];
      };
    }

    static fromComplexPointSymbology(sym: ComplexPointSymbology): ol.StyleFunction {
        // we need a style cache to speed things up. This dangles in the void of the GC...
        const styleCache: {[key: string]: OlStyleStyle} = {};

        return (feature: ol.Feature, resolution: number) => {

            // console.log(feature, this.colorAttribute, this.textAttribute, this.radiusAttribute);

            const featureColorValue = (sym.colorAttribute) ? feature.get(sym.colorAttribute) : undefined;
            const featureTextValue = (sym.textAttribute) ? feature.get(sym.textAttribute) : undefined;
            const featureRadiusValue = (sym.radiusAttribute) ?  feature.get(sym.radiusAttribute) : undefined;
            // console.log(featureColorValue, featureTextValue, featureRadiusValue);

            let styleKey = '';
            styleKey += (featureColorValue ? featureColorValue.toString() : '|||');
            styleKey += (':::' + (featureTextValue ? featureTextValue.toString() : '|||'));
            styleKey += (':::' + (featureRadiusValue ? featureRadiusValue.toString() : '|||'));
            // console.log('fromComplexPointSymbology', 'styleKey', styleKey);

            if (!styleCache[styleKey]) {

                const colorBreakpointLookup = sym.colorizer.getBreakpointForValue(featureColorValue, true);
                // console.log('StyleCreator', 'fromComplexPointSymbology', 'colorBreakpointLookup:', colorBreakpointLookup);
                const color = colorBreakpointLookup ? colorBreakpointLookup.rgba.rgbaTuple() : sym.fillRGBA.rgbaTuple();
                const radius = featureRadiusValue ? featureRadiusValue as number : sym.radius;
                // console.log('fromComplexPointSymbology', colorBreakpointLookup, color, radius);

                const imageStyle = new OlStyleCircle({
                        radius: radius,
                        fill: new OlStyleFill({ color: color }),
                        stroke: new OlStyleStroke({ color: sym.strokeRGBA.rgbaTuple(), width: sym.strokeWidth }),
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

                const style = new OlStyleStyle({
                    image: imageStyle,
                    text: textStyle
                });
                styleCache[styleKey] = style;
            }

            return styleCache[styleKey];
        };
    }
}
