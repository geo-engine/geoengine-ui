import {Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';

import * as dagreD3 from 'dagre-d3';
import * as d3 from 'd3';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs/Rx';
import {LayoutService} from '../../layout.service';
import {Layer} from '../../layers/layer.model';
import {Symbology} from '../../layers/symbology/symbology.model';
import {MAT_DIALOG_DATA} from '@angular/material';
import {Operator} from '../../operators/operator.model';
import {ResultTypes} from '../../operators/result-type.model';
import {ProjectService} from '../../project/project.service';

const GRAPH_STYLE = {
    general: {
        width: 200,
        headerHeight: 48,
        margin: 5,
    },
    operator: {
        height: 136,
        borderHeight: 1,
    },
    surrounding: {
        margin: 40,
        detailComponentWidth: 200,
    },
};

@Component({
    selector: 'wave-lineage-graph',
    templateUrl: './lineage-graph.component.html',
    styleUrls: ['./lineage-graph.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineageGraphComponent implements OnInit, AfterViewInit {

    @ViewChild('svg') svg: ElementRef;
    @ViewChild('g') g: ElementRef;

    svgWidth$: Observable<number>;
    svgHeight$: Observable<number>;

    title$ = new BehaviorSubject<string>('Operator Lineage');

    selectedOperator$ = new ReplaySubject<Operator>(1);
    parameters$ = new ReplaySubject<Array<{ key: string, value: string }>>(1);

    private selectedLayer: Layer<Symbology> = undefined;

    private maxWidth$ = new BehaviorSubject<number>(1);
    private maxHeight$ = new BehaviorSubject<number>(1);

    private svgRatio = 0.7;

    constructor(private elementRef: ElementRef,
                private projectService: ProjectService,
                @Inject(MAT_DIALOG_DATA) private config: { layer?: Layer<Symbology> }) {
    }

    ngOnInit() {
        this.svgWidth$ = this.maxWidth$.map(width => Math.ceil(this.svgRatio * width));
        this.svgHeight$ = this.maxHeight$;

        if (this.config) {
            this.selectedLayer = this.config.layer;
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.calculateDialogBounds();

            setTimeout(() => {
                this.drawGraph();
            });
        });
    }

    private calculateDialogBounds() {
        let dialogContainer = undefined;
        let parent = this.elementRef.nativeElement.parentElement;
        while (!dialogContainer) {
            dialogContainer = parent.querySelector('.cdk-overlay-pane');
            parent = parent.parentElement;
        }

        const width = parseInt(getComputedStyle(dialogContainer).maxWidth, 10) - 2 * LayoutService.remInPx();
        const maxHeight = window.innerHeight * 0.8;

        this.maxWidth$.next(width);
        this.maxHeight$.next(maxHeight);
    }

    private drawGraph() {
        this.projectService.getProjectStream().first().subscribe(project => {
            let graph = new dagreD3.graphlib.Graph()
                .setGraph({})
                .setDefaultEdgeLabel(() => <any> { label: '' });

            if (this.selectedLayer) {
                this.title$.next(`Lineage for ${this.selectedLayer.name}`);

                const operatorIdsInGraph = this.addOperatorsToGraph(graph, [this.selectedLayer.operator], [this.selectedLayer]);
                this.addLayersToGraph(
                    graph,
                    project.layers,
                    [this.selectedLayer],
                    operatorIdsInGraph
                );
            } else {
                const operatorIdsInGraph = this.addOperatorsToGraph(
                    graph,
                    project.layers.map(layer => layer.operator),
                    project.layers
                );
                this.addLayersToGraph(
                    graph,
                    project.layers,
                    [],
                    operatorIdsInGraph
                );
            }

            // create the renderer
            let render = new dagreD3.render();

            // Set up an SVG group so that we can translate the final graph.
            // console.log(this.graphContainer.nativeElement);
            let svg = d3.select(this.svg.nativeElement);
            let svgGroup = d3.select(this.g.nativeElement);

            // Run the renderer. This is what draws the final graph.
            render(svgGroup, graph);


            this.fixLabelPosition(svg);

            // do this asynchronously to start a new cycle of change detection
            setTimeout(() => {
                // this.dialog.setTitle(title); // TODO: set title
                const sizes = this.setupWidthObservables(graph);
                this.addZoomSupport(svg, svgGroup, graph, sizes.width, sizes.height);
                this.addClickHandler(svg, graph);
            });
        });
    }

    private addOperatorsToGraph(graph: dagre.graphlib.Graph,
                                initialOperators: Array<Operator>,
                                layers: Array<Layer<Symbology>>): Array<number> {
        let operatorIdsInGraph: Array<number> = [];

        let operators: Array<Operator> = [...initialOperators];
        let edges: Array<[number, number]> = [];
        while (operators.length > 0) {
            let operator = operators.pop();

            operatorIdsInGraph.push(operator.id);

            // add node to graph
            graph.setNode(`operator_${operator.id}`, {
                operator: operator,
                type: 'operator',
                class: `operator operator_${operator.id}`,
                labelType: 'html',
                label: `
                <div class='header'>
                    <img src='${operator.operatorType.getIconUrl()}' class='icon'>
                    </span>
                    ${operator.operatorType}
                </div>
                <div class='parameters'>
                    <table>
                        <tr>
                        ${operator.operatorType.getParametersAsStrings()
                    .map(([key, value]: [string, string]) => {
                        return `<td class='key'>${key}</td>
                                                            <td class='value'>${value}</td>`;
                    }).join('</tr><tr>')}
                        </tr>
                    </table>
                </div>
                `,
                padding: 0,
                width: GRAPH_STYLE.general.width,
                height: GRAPH_STYLE.operator.height,
            });

            // add children
            for (let resultType of ResultTypes.INPUT_TYPES) {
                operator.getSources(resultType).forEach(child => {
                    operators.push(child);
                    edges.push([child.id, operator.id]);
                });
            }
        }

        // add edges to graph
        for (let [sourceId, targetId] of edges) {
            graph.setEdge(`operator_${sourceId}`, `operator_${targetId}`);
        }

        // console.log(graph.edges(), graph);

        // return all operator ids that are contained in the graph
        return operatorIdsInGraph;
    }

    private addLayersToGraph(graph: dagre.graphlib.Graph,
                             layers: Array<Layer<Symbology>>,
                             layersToAccent: Array<Layer<Symbology>>,
                             operatorIdsInGraph: Array<number>) {
        for (let layer of layers) {
            // operator of layer is contained in graph
            if (operatorIdsInGraph.indexOf(layer.operator.id) >= 0) {
                // add node
                const hasAccent = layersToAccent.indexOf(layer) >= 0;
                graph.setNode(`layer_${layer.operator.id}`, {
                    class: hasAccent ? 'layer accent' : 'layer',
                    type: 'layer',
                    labelType: 'html',
                    label: `<div class='header'>${layer.name}</div>`,
                    padding: 0,
                    width: GRAPH_STYLE.general.width,
                    height: GRAPH_STYLE.general.headerHeight,
                });

                // add edge
                graph.setEdge(`operator_${layer.operator.id}`, `layer_${layer.operator.id}`, {
                    class: 'layer-edge',
                });
            }
        }
    }

    private addZoomSupport(svg: d3.Selection<SVGSVGElement>, svgGroup: d3.Selection<SVGGElement>,
                           graph: dagre.graphlib.Graph,
                           svgWidth: number, svgHeight: number) {
        // calculate available space after subtracting the margin
        const paddedWidth = svgWidth - GRAPH_STYLE.surrounding.margin;
        const paddedHeight = svgHeight - GRAPH_STYLE.surrounding.margin;

        // calculate the initial zoom level that captures the whole graph
        const scale = Math.min(
            paddedWidth / graph.graph().width,
            paddedHeight / graph.graph().height,
            1 // do not scale more than 100% of size initially
        );

        // create zoom behavior
        const zoom = d3.behavior.zoom()
            .translate([
                (svgWidth - (scale * graph.graph().width)) / 2,
                (svgHeight - (scale * graph.graph().height)) / 2,
            ])
            .scale(scale);

        // apply zoom to svg
        zoom.event(svgGroup.transition().duration(500));

        // add zoom handler
        zoom.on('zoom', () => {
            const zoomEvent = d3.event as d3.ZoomEvent;
            const zoomTranslate = isNaN(zoomEvent.translate[0]) ? [0, 0] : zoomEvent.translate;
            const zoomScale = isNaN(zoomEvent.scale) ? 0 : zoomEvent.scale;
            svgGroup.attr(
                'transform',
                `translate(${zoomTranslate})scale(${zoomScale})`
            );
        });
        svg.call(zoom);
    }

    private addClickHandler(svg: d3.Selection<SVGSVGElement>, graph: dagre.graphlib.Graph) {
        svg.selectAll('.node').on('click', (nodeId: string) => {
            const node = graph.node(nodeId);
            if (node.type === 'operator') {
                const operator: Operator = node.operator;

                // update operator type
                this.selectedOperator$.next(operator);

                // update parameter view
                this.parameters$.next(
                    operator.operatorType.getParametersAsStrings().map(([key, value]) => {
                        return {
                            key: key,
                            value: value.toString(),
                        };
                    })
                );

                // de-select all
                svg.selectAll('.operator').classed('highlight', false);
                // set highlight
                svg.select(`.${nodeId}`).classed('highlight', true);
            }
        });
    }

    private fixLabelPosition(svg: d3.Selection<SVGSVGElement>) {
        // HACK: move html label from center to top left
        svg.selectAll('.operator > .label > g > foreignObject')
            .attr('x', -GRAPH_STYLE.general.width / 2)
            .attr('y', -GRAPH_STYLE.operator.height / 2)
            .attr('width', GRAPH_STYLE.general.width)
            .attr('height', GRAPH_STYLE.operator.height);
        svg.selectAll('.layer > .label > g > foreignObject')
            .attr('x', -GRAPH_STYLE.general.width / 2)
            .attr('y', -GRAPH_STYLE.general.headerHeight / 2)
            .attr('width', GRAPH_STYLE.general.width)
            .attr('height', GRAPH_STYLE.general.headerHeight);
        svg.selectAll('.label > g').attr('transform', undefined);
    }

    private setupWidthObservables(graph: dagre.graphlib.Graph): { width: number, height: number } {
        // create observables for the current graph bounds
        const graphWidth$ = Observable.of(graph.graph().width);
        const graphHeight$ = Observable.of(graph.graph().height);

        const widthBound = (maxWidth: number, graphWidth: number) => {
            return Math.min(
                maxWidth
                - GRAPH_STYLE.surrounding.detailComponentWidth
                - GRAPH_STYLE.surrounding.margin,
                graphWidth
            );
        };
        const heightBound = (maxWidth: number, graphWidth: number) => {
            // return Math.min(maxWidth, graphWidth + GRAPH_STYLE.surrounding.margin);
            return maxWidth;
        };

        // return the current width bounds
        return {
            width: widthBound(this.maxWidth$.getValue(), graph.graph().width),
            height: heightBound(this.maxHeight$.getValue(), graph.graph().height),
        };
    }

}
