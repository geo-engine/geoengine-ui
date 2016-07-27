import {
    Component, ChangeDetectionStrategy, Input, Output, AfterViewInit, EventEmitter, ViewChild,
    ElementRef, OnChanges, SimpleChange,
} from '@angular/core';

import d3 from 'd3';

/**
 * Schema for histogram data.
 */
export interface HistogramData {
   type: string; // histogram
   data: Array<number>;
   lines?: Array<{name: string, pos: number}>;
   metadata: {
       numberOfBuckets: number,
       min: number,
       max: number,
       nodata: number,
   };
}

/**
 * Helper class for slider dimension
 */
interface SliderDim {
    width: number;
    height: number;
    margin: {
        top: number,
        bottom: number,
    };
}

/**
 * Helper interface for a slider
 */
interface Slider {
    area: d3.Selection<SVGGElement>;
    pointer: d3.Selection<SVGGElement>;
    text: d3.Selection<SVGGElement>;
    position: number;
}

@Component({
    selector: 'wave-histogram',
    template: `<svg #svg class="histogram"></svg>`,
    styles: [
        `
        :host .histogram >>> .chartbg {
          fill: transparent;
        }

        :host .histogram >>> .container {
          fill: white;
        }

        :host .histogram >>> .chart {
          font: 10px sans-serif;
        }

        :host .histogram >>> .bar rect {
          fill: steelblue;
          shape-rendering: crispEdges;
        }

        :host .histogram >>> .lines rect {
          fill: #ff0000;
          shape-rendering: crispEdges;
        }

        :host .histogram >>> .lines text {
          fill : #ff0000;
        }

        :host .histogram >>> .bar text {
          fill: #fff;
        }

        :host .histogram >>> .axis path,.axis line {
          fill: none;
          stroke: #000;
          shape-rendering: crispEdges;
        }

        /* taken from http://bl.ocks.org/Caged/6476579 */

        :host .histogram >>> .d3-tip {
          line-height: 1;
          font-weight: bold;
          padding: 12px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          border-radius: 2px;
        }

        /* Creates a small triangle extender for the tooltip */
        :host .histogram >>> .d3-tip:after {
          box-sizing: border-box;
          display: inline;
          font-size: 10px;
          width: 100%;
          line-height: 1;
          color: rgba(0, 0, 0, 0.8);
          content: "\25BC";
          position: absolute;
          text-align: center;
        }

        /* Style northward tooltips differently */
        :host .histogram >>> .d3-tip.n:after {
          margin: -1px 0 0 0;
          top: 100%;
          left: 0;
        }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistogramComponent implements AfterViewInit, OnChanges {
    @ViewChild('svg') svgRef: ElementRef;

    @Input() data: HistogramData;

    @Input() height: number;
    @Input() width: number;
    @Input() viewBoxRatio: number = 1;

    @Input() selectable: boolean = false;
    @Input() interactable: boolean = false;

    @Input() minRange: number = undefined;
    @Output() minRangeChange = new EventEmitter<number>();
    @Input() maxRange: number = undefined;
    @Output() maxRangeChange = new EventEmitter<number>();

    private leftSlider: Slider;
    private rightSlider: Slider;
    private xAxis: d3.svg.Axis;
    private maxWidth: number;

    constructor() {}

    ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
        if (changes['data'] && !changes['data'].isFirstChange()) {
            this.drawHistogram();
        }
        // TODO: refactor the set slider position function out (here and in makeDrag)
        if (changes['minRange'] && !changes['minRange'].isFirstChange()) {
            const value = changes['minRange'].currentValue;
            const xPosition = Math.max(this.xAxis.scale()(value), 0);
            this.leftSlider.pointer.attr('x', xPosition);
            this.leftSlider.position = value;
            this.leftSlider.text.attr('x', xPosition);
            this.leftSlider.text.text(value);
            this.leftSlider.area.attr('width', xPosition);
        }
        if (changes['maxRange'] && !changes['maxRange'].isFirstChange()) {
            const value = changes['maxRange'].currentValue;
            const xPosition = Math.min(this.xAxis.scale()(value), this.maxWidth);
            this.rightSlider.pointer.attr('x', xPosition);
            this.rightSlider.position = value;
            this.rightSlider.text.attr('x', xPosition);
            this.rightSlider.text.text(value);
            this.rightSlider.area.attr('width', this.maxWidth - xPosition);
            this.rightSlider.area.attr('x', xPosition);
        }
    }

    ngAfterViewInit() {
        if (this.data) {
            this.drawHistogram();
        }
    }

    private drawHistogram() {
        const drawLines: boolean = (this.data.lines !== undefined);

        const margin = {
            top: 10,
            right: 50,
            bottom: this.selectable ? 80 : 30,
            left: 50,
        };

        const width = this.width * this.viewBoxRatio - margin.left - margin.right;
        this.maxWidth = width;
        const height = this.height * this.viewBoxRatio - margin.top - margin.bottom;

        const x = d3.scale.linear()
                          .domain([this.data.metadata.min, this.data.metadata.max])
                          .range([0, width]);

        const y = d3.scale.linear().domain([0, d3.max(this.data.data)])
                                   .range([height, 0]);

        const xAxis = d3.svg.axis().scale(x).orient('bottom');
        this.xAxis = xAxis;

        const yAxis = d3.svg.axis().scale(y).orient('left');

        const svg = d3.select(this.svgRef.nativeElement)
                      .attr('width', this.width)
                      .attr('height', this.height)
                      .attr(
                          'viewBox',
                          [
                              0,
                              0,
                              this.width * this.viewBoxRatio,
                              this.height * this.viewBoxRatio,
                          ].join(' ')
                      )
                      .append('g')
                      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        const container = svg.append('g').classed('container', true);

        const barWidth = width / this.data.metadata.numberOfBuckets;

        const bar = container.selectAll('.bar')
                             .data(this.data.data)
                             .enter()
                             .append('g')
                             .classed('bar', true)
                             .attr('transform', (d, i) => {
                                 let xPos = i * barWidth;
                                 return `translate(${xPos},0)`;
                             });

        bar.append('rect')
            .attr('height', d => {
                return height - y(d);
            })
            .attr('width', (barWidth > 1) ? (barWidth - 1) : barWidth)
            .attr('transform', (d, i) => {
                let yTrans = y(d);
                return `translate(0,${yTrans})`;
            });

        /* draw vertical lines */
        if (drawLines) {
            const lineContainer = container.append('g');
            const lines = lineContainer.selectAll('.lines')
                                     .data(this.data.lines)
                                     .enter()
                                     .append('g')
                                     .attr('class', 'lines');
            lines.append('rect')
                 .attr('x', d => {
                     return x(d.pos);
                 }) // position()
                 .attr('y', y(0) - height)
                 .attr('height', height)
                 .attr('width', 1);

            lines.append('text')
                 .attr('x', d => {
                     return x(d.pos) + 5;
                 }) // position()
                 .attr('y', y(0) - height + 20)
                 .text(d => {
                     return d.name;
                 });
        }

        const borders = svg.append('g')
                           .attr(
                               'transform',
                               `translate(${-margin.left},${-margin.top})`
                           );

        borders.append('rect')
               .attr('width', margin.left)
               .attr('height', this.height)
               .attr('fill', 'white');

        borders.append('rect')
               .attr('x', margin.left + width)
               .attr('height', this.height)
               .attr('width', margin.left).attr('fill', 'white');

        svg.append('g')
           .attr('class', 'x axis')
           .attr('transform', `translate(0,${height})`)
           .call(xAxis);

        svg.append('g').attr('class', 'y axis').call(yAxis);

        let zoom: d3.behavior.Zoom<SVGElement>;
        if (this.selectable) {
            // sliders to select a range

            const sliderDim: SliderDim = {
                width: 10,
                height: 20,
                margin: {
                    top: 20,
                    bottom: 10,
                },
            };

            const xSlider = svg.append('g');

            const leftSlider: Slider = {
                area: this.makeArea(xSlider, height),
                pointer: this.makePointer(xSlider, height, sliderDim, 0),
                text: this.makeText(xSlider, height, sliderDim, 0, this.data.metadata.min),
                position: this.data.metadata.min,
            };
            this.leftSlider = leftSlider;

            const rightSlider: Slider = {
                area: this.makeArea(xSlider, height),
                pointer: this.makePointer(xSlider, height, sliderDim, width),
                text: this.makeText(xSlider, height, sliderDim, width, this.data.metadata.max),
                position: this.data.metadata.max,
            };
            this.rightSlider = rightSlider;

            const leftDrag = this.makeDrag(
                xAxis, leftSlider, leftSlider, rightSlider, width, true
            );
            const rightDrag = this.makeDrag(
                xAxis, rightSlider, leftSlider, rightSlider, width, false
            );
            leftSlider.pointer.call(leftDrag);
            rightSlider.pointer.call(rightDrag);

            // zoom
            if (this.interactable) {
                zoom = d3.behavior.zoom()
                                  .scaleExtent([1, 10])
                                  .x(x)
                                  .on(
                                      'zoom',
                                      this.sliderZoomed(svg, container, xAxis, height, width,
                                                        leftSlider, rightSlider)
                                  );
            }
        } else {
            if (this.interactable) {
                zoom = d3.behavior.zoom()
                                  .scaleExtent([1, 10])
                                  .x(x)
                                  .on('zoom', this.zoomed(svg, container, xAxis));
            }
        }

        const chartbg = svg.append('rect')
                           .attr('class', 'chartbg')
                           .attr('width', width)
                           .attr('height', height);

        if (this.interactable) {
            chartbg.call(zoom);
        }

    }

    private zoomed(svg: d3.Selection<SVGSVGElement>,
                   container: d3.Selection<SVGGElement>,
                   xAxis: d3.svg.Axis): () => void {
        return () => {
            const zoomEvent = d3.event as d3.ZoomEvent;
            container.attr(
                'transform',
                `translate(${zoomEvent.translate[0]},0)scale(${zoomEvent.scale},1)`
            );
            svg.select('.x.axis').call(xAxis);
        };
    }

    private sliderZoomed(svg: d3.Selection<SVGSVGElement>,
                         container: d3.Selection<SVGGElement>,
                         xAxis: d3.svg.Axis,
                         height: number,
                         width: number,
                         leftSlider: Slider,
                         rightSlider: Slider): () => void {
        return () => {
            this.zoomed(svg, container, xAxis)();

            // set left slider
            let newPointerpos = xAxis.scale()(leftSlider.position);
            if (newPointerpos < 0) {
                newPointerpos = 0;
            }
            if (newPointerpos > width) {
                newPointerpos = width;
            }
            leftSlider.area.attr('width', newPointerpos);
            leftSlider.pointer.attr('x', newPointerpos);
            leftSlider.text.attr('x', newPointerpos);
            // set right slider
            newPointerpos = xAxis.scale()(rightSlider.position);
            if (newPointerpos < 0) {
                newPointerpos = 0;
            }
            if (newPointerpos > width) {
                newPointerpos = width;
            }
            rightSlider.area.attr('width', width - newPointerpos);
            rightSlider.area.attr('x', newPointerpos);
            rightSlider.pointer.attr('x', newPointerpos);
            rightSlider.text.attr('x', newPointerpos);
        };
    }

    private makeArea(xSlider: d3.Selection<SVGGElement>,
                     height: number): d3.Selection<SVGGElement> {
        return xSlider.append('rect')
                      .attr('x', 0)
                      .attr('width', 0)
                      .attr('height', height)
                      .attr('fill-opacity', 0.2);
    }

    private makePointer(xSlider: d3.Selection<SVGGElement>,
                        height: number,
                        sliderDim: SliderDim,
                        xPosition: number): d3.Selection<SVGGElement> {
        return xSlider.append('rect')
                      .attr('y', height + sliderDim.margin.top)
                      .attr('x', xPosition)
                      .attr('width', sliderDim.width)
                      .attr('height', sliderDim.height)
                      .attr('transform', 'translate(' + -(sliderDim.width / 2) + ',0)');
    }

    private makeText(xSlider: d3.Selection<SVGGElement>,
                     height: number,
                     sliderDim: SliderDim,
                     xPosition: number,
                     value: number): d3.Selection<SVGGElement> {
        return xSlider.append('text')
                      .text(value.toFixed(2))
                      .attr('x', xPosition - sliderDim.width / 2 + 5)
                      .attr(
                          'y',
                          sliderDim.margin.top + height +
                          sliderDim.height + sliderDim.margin.bottom
                      );
    }

    private makeDrag(xAxis: d3.svg.Axis,
                     slider: Slider,
                     leftSlider: Slider,
                     rightSlider: Slider,
                     width: number,
                     isLeft: boolean): d3.behavior.Drag<{}> {
        return d3.behavior.drag().on('drag', () => {
            const minX = this.data.metadata.min;
            const maxX = this.data.metadata.max;
            const bins = this.data.metadata.numberOfBuckets;

            const dragEvent = d3.event as d3.DragEvent;
            const eventX = dragEvent.x;

            let lowerbound: number;
            let upperbound: number;
            if (isLeft) {
                if (xAxis.scale()(minX) > 0) {
                    lowerbound = xAxis.scale()(minX);
                } else {
                    lowerbound = 0;
                }
            } else {
                lowerbound = xAxis.scale()(leftSlider.position) + 1;
            }
            if (!isLeft) {
                if (xAxis.scale()(maxX) < width) {
                    upperbound = xAxis.scale()(maxX);
                } else {
                    upperbound = width;
                }
            } else {
                upperbound = xAxis.scale()(rightSlider.position) - 1;
            }

            let newX: number;
            if ((eventX > lowerbound) && (eventX < upperbound)) {
                newX = eventX;
            } else if (eventX <= lowerbound) {
                newX = lowerbound;
            } else {
                newX = upperbound;
            }

            // snap to closest bar
            let newXVal = xAxis.scale().invert(newX);
            const bw = (maxX - minX) / bins;
            const n = Math.round((newXVal - minX) / bw);
            newX = xAxis.scale()(minX + n * bw);
            newXVal = xAxis.scale().invert(newX);

            slider.pointer.attr('x', newX);
            slider.position = newXVal;
            slider.text.attr('x', newX);
            slider.text.text(newXVal);
            if (isLeft) {
                this.minRange = newXVal;
                this.minRangeChange.emit(this.minRange);
            } else {
                this.maxRange = newXVal;
                this.maxRangeChange.emit(this.maxRange);
            }
            if (isLeft) {
                if (newX > 0) {
                    slider.area.attr('width', newX);
                } else {
                    slider.area.attr('width', 0);
                }
            } else {
                slider.area.attr('width', width - newX);
                slider.area.attr('x', newX);
            }
        });
    }
}
