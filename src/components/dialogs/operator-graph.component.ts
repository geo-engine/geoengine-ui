import {Component, ChangeDetectionStrategy, AfterViewInit,
        Input, ViewChild, ElementRef, ChangeDetectorRef} from "angular2/core";
import {Observable, Subject, BehaviorSubject} from "rxjs/Rx";

import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";
import {DialogContainerComponent} from "./dialog-basics.component";

import {LayerService} from "../../services/layer.service";

import {Layer} from "../../models/layer.model";
import {Operator} from '../../operators/operator.model';
import {ResultTypes} from '../../operators/result-type.model';

import d3 from "d3"; // necessary for dagreD3
// import dagre from "dagre";
import dagreD3 from "dagre-d3";

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
    }
};

/**
 * The dialog window for displaying the operator graph.
 */
@Component({
    selector: "wave-operator-graph-dialog",
    template: `
    <wave-dialog-container #container [title]="title" [overflow]="false" [layout]="'row'"
                           (close)="dialog.close()">
        <div layout="row">
            <svg #graph class="graph"
                 [style.width.px]="width$ | async" [style.height.px]="height$ | async"></svg>
            <md-content class="detailView" [style.height.px]="height$ | async">
                <md-list>
                    <md-subheader class="md-sticky md-primary">Type</md-subheader>
                    <md-list-item class="md-2-line">{{selectedOperatorName$ | async}}</md-list-item>
                    <md-divider></md-divider>
                    <md-subheader class="md-sticky md-primary">Parameters</md-subheader>
                        <md-list>
                            <template ngFor #parameter [ngForOf]="parameters$ | async" #i="index">
                                <md-subheader class="md-no-sticky">{{parameter.key}}</md-subheader>
                                <md-list-item>{{parameter.value}}</md-list-item>
                                <md-divider></md-divider>
                            </template>
                        </md-list>
                </md-list>
            </md-content>
        </div>
    </wave-dialog-container>
    `,
    styles: [`
        .detailView {
            width: ${GRAPH_STYLE.surrounding.detailComponentWidth}px;
        }
        .detailView >>> .md-list-item-inner {
            word-break: break-all;
        }

        /* GRAPH RELATED */

        .graph {
            background-color: #f5f5f5;
        }

        /* node header */
        :host .graph >>> .label .header {
            width: ${GRAPH_STYLE.general.width - (2 * GRAPH_STYLE.general.margin)}px;
            padding: ${GRAPH_STYLE.general.margin}px;
            overflow: hidden;
            text-overflow: ellipsis;
            whiteSpace: nowrap;
            font-family: RobotoDraft, Roboto, 'Helvetica Neue', sans-serif;
        }

        /* operator header */
        :host .graph >>> .operator .label .header {
            height: ${GRAPH_STYLE.general.headerHeight
                      - (2 * GRAPH_STYLE.general.margin)
                      - GRAPH_STYLE.operator.borderHeight}px;
            line-height: ${GRAPH_STYLE.general.headerHeight
                           - (2 * GRAPH_STYLE.general.margin)
                           - GRAPH_STYLE.operator.borderHeight}px;
            color: rgba(0, 0, 0, 0.87);
            border-bottom: ${GRAPH_STYLE.operator.borderHeight}px solid rgba(0, 0, 0, 0.12);
        }

        /* layer header */
        :host .graph >>> .layer .label .header {
            height: ${GRAPH_STYLE.general.headerHeight - (2 * GRAPH_STYLE.general.margin)}px;
            line-height: ${GRAPH_STYLE.general.headerHeight - (2 * GRAPH_STYLE.general.margin)}px;
            background-color: #3f51b5;
            color: rgba(255, 255, 255, 0.87059);
        }

        /* layer header accent */
        :host .graph >>> .layer.accent .label .header {
            background-color: #e91e63 !important;
        }

        /* operator header icon */
        :host .graph >>> .label .header .icon {
            display: block;
            float: left;
            width: ${GRAPH_STYLE.general.headerHeight
                     - (2 * GRAPH_STYLE.general.margin)
                     - GRAPH_STYLE.operator.borderHeight}px;
            height: ${GRAPH_STYLE.general.headerHeight
                      - (2 * GRAPH_STYLE.general.margin)
                      - GRAPH_STYLE.operator.borderHeight}px;
            margin-right: ${GRAPH_STYLE.general.margin}px;
            border-radius: ${GRAPH_STYLE.general.margin}px;
        }

        /* operator parameter content */
        :host .graph >>> .label .parameters {
            width: ${GRAPH_STYLE.general.width - (2 * GRAPH_STYLE.general.margin)}px;
            height: ${GRAPH_STYLE.operator.height
                      - GRAPH_STYLE.general.headerHeight
                      - (2 * GRAPH_STYLE.general.margin)}px;
            padding: ${GRAPH_STYLE.general.margin}px;
            overflow: hidden;
        }

        /* operator parameter content table */
        :host .graph >>> .label .parameters table {
            width: ${GRAPH_STYLE.general.width - (2 * GRAPH_STYLE.general.margin)}px;
            table-layout: fixed;
        }
        :host .graph >>> .label .parameters .key,
        :host .graph >>> .label .parameters .value {
            overflow: hidden;
            text-overflow: ellipsis;
        }
        :host .graph >>> .label .parameters .key {
            width: 33%;
        }
        :host .graph >>> .label .parameters .value {
            width: 67%;
        }

        /* node box */
        :host .graph >>> .node rect {
            stroke: rgba(0, 0, 0, 0.12);
            fill: #fff;
            stroke-width: 1.5px;
        }

        /* node box shadow */
        :host .graph >>> .label > g > foreignObject > div {
            box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2),
                          0px 5px 8px 0px rgba(0, 0, 0, 0.14),
                          0px 1px 14px 0px rgba(0, 0, 0, 0.12);
        }

        /* pointer */
        :host .graph >>> .operator .label > g > foreignObject > div {
            cursor: pointer;
        }

        /* highlight */
        :host .graph >>> .highlight rect {
            stroke: #3f51b5 !important;
        }

        /* edge */
        :host .graph >>> .edgePath path {
            stroke: #333;
            stroke-width: 1.5px;
        }

        /* edge to layer */
        :host .graph >>> .layer-edge path {
            stroke-dasharray: 5, 5;
        }
    `],
    directives: [MATERIAL_DIRECTIVES, DialogContainerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorGraphDialogComponent implements AfterViewInit {
    @ViewChild("container") dialogContainer: DialogContainerComponent;
    @ViewChild("graph") graphContainer: ElementRef;

    @Input() layerService: LayerService;
    @Input() selectedLayerOnly: boolean;

    private title = "Workflow";

    private width$: BehaviorSubject<number> = new BehaviorSubject(0);
    private height$: BehaviorSubject<number> = new BehaviorSubject(0);

    private selectedOperatorName$: BehaviorSubject<string> = new BehaviorSubject("");
    private parameters$: BehaviorSubject<Array<{key: string, value: string}>> =
        new BehaviorSubject([]);

    constructor(private changeDetectorRef: ChangeDetectorRef,
                private dialog: MdDialogRef) {}

    ngAfterViewInit() {
        let title = "Workflow";

        let graph = new dagreD3.graphlib.Graph()
                        .setGraph({})
                        .setDefaultEdgeLabel(function() { return {}; });

        if (this.selectedLayerOnly) {
            let layer = this.layerService.getSelectedLayer();

            title = `Workflow for ${layer.name}`;

            const operatorIdsInGraph = this.addOperatorsToGraph(graph, [layer.operator], [layer]);
            this.addLayersToGraph(
                graph,
                this.layerService.getLayers(),
                [layer],
                operatorIdsInGraph
            );
        } else {
            const operatorIdsInGraph = this.addOperatorsToGraph(
                graph,
                this.layerService.getLayers().map(layer => layer.operator),
                this.layerService.getLayers()
            );
            this.addLayersToGraph(
                graph,
                this.layerService.getLayers(),
                [],
                operatorIdsInGraph
            );
        }

        // create the renderer
        let render = new dagreD3.render();

        // Set up an SVG group so that we can translate the final graph.
        console.log(this.graphContainer.nativeElement);
        let svg = d3.select(this.graphContainer.nativeElement);
        let svgGroup = svg.append("g");

        // Run the renderer. This is what draws the final graph.
        render(svgGroup, graph);

        this.fixLabelPosition(svg);

        // do this asynchronously to start a new cycle of change detection
        setTimeout(() => {
            this.title = title;
            const sizes = this.setupWidthObservables(graph);
            this.addZoomSupport(svg, svgGroup, graph, sizes.width, sizes.height);
            this.addClickHandler(svg, graph);
        });
    }

    private setupWidthObservables(graph: Dagre.Graph): {width: number, height: number} {
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

        // combine the maximum window widths with the graph width
        Observable.zip(
            this.dialogContainer.maxWidth$,
            graphWidth$,
            widthBound
        ).subscribe(this.width$);

        Observable.zip(
            this.dialogContainer.maxHeight$,
            graphHeight$,
            heightBound
        ).subscribe(this.height$);

        // return the current width bounds
        return {
            width: widthBound(this.dialogContainer.maxWidth$.getValue(), graph.graph().width),
            height: heightBound(this.dialogContainer.maxHeight$.getValue(), graph.graph().height),
        };
    }

    private addOperatorsToGraph(graph: Dagre.Graph,
                      initialOperators: Array<Operator>,
                      layers: Array<Layer>): Array<number> {
        // TODO: replace with proper icons
        // from `http://stackoverflow.com/questions/3426404/
        // create-a-hexadecimal-colour-based-on-a-string-with-javascript`
        const hashCode = (str: string) => { // java String#hashCode
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
               hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        };

        const intToRGB = (i: number) => {
            const c = (i & 0x00FFFFFF).toString(16).toUpperCase();

            return "00000".substring(0, 6 - c.length) + c;
        };

        let operatorIdsInGraph: Array<number> = [];

        let operators: Array<Operator> = [...initialOperators];
        let edges: Array<[number, number]>  = [];
        while (operators.length > 0) {
            let operator = operators.pop();

            operatorIdsInGraph.push(operator.id);

            // add node to graph
            graph.setNode(`operator_${operator.id}`, {
                operator: operator,
                type: "operator",
                class: `operator operator_${operator.id}`,
                labelType: "html",
                label: `
                <div class="header">
                    <img src="${operator.operatorType.getIconUrl()}" class="icon">
                    </span>
                    ${operator.operatorType}
                </div>
                <div class="parameters">
                    <table>
                        <tr>
                        ${operator.operatorType.getParametersAsStrings()
                                               .map(([key, value]: [string, string]) => {
                                                    return `<td class="key">${key}</td>
                                                            <td class="value">${value}</td>`;
                                             }).join("</tr><tr>")}
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

        console.log(graph.edges(), graph);

        // return all operator ids that are contained in the graph
        return operatorIdsInGraph;
    }

    private addLayersToGraph(graph: Dagre.Graph,
                             layers: Array<Layer>,
                             layersToAccent: Array<Layer>,
                             operatorIdsInGraph: Array<number>) {
        for (let layer of layers) {
            // operator of layer is contained in graph
            if (operatorIdsInGraph.indexOf(layer.operator.id) >= 0) {
                // add node
                const hasAccent = layersToAccent.indexOf(layer) >= 0;
                graph.setNode(`layer_${layer.operator.id}`, {
                    class: hasAccent ? "layer accent" : "layer",
                    type: "layer",
                    labelType: "html",
                    label: `<div class="header">${layer.name}</div>`,
                    padding: 0,
                    width: GRAPH_STYLE.general.width,
                    height: GRAPH_STYLE.general.headerHeight,
                });

                // add edge
                graph.setEdge(`operator_${layer.operator.id}`, `layer_${layer.operator.id}`, {
                    class: "layer-edge",
                });
            }
        }
    }

    private addZoomSupport(svg: d3.Selection<any>, svgGroup: d3.Selection<any>,
                           graph: Dagre.Graph,
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
        zoom.on("zoom", () => {
            svgGroup.attr(
                "transform",
                `translate(${d3.event["translate"]})scale(${d3.event["scale"]})`
            );
        });
        svg.call(zoom);
    }

    private addClickHandler(svg: d3.Selection<any>, graph: Dagre.Graph) {
        svg.selectAll(".node").on("click", (nodeId: string) => {
            const node = graph.node(nodeId);
            if (node.type === "operator") {
                const operator: Operator = node.operator;

                // update operator type
                this.selectedOperatorName$.next(operator.operatorType.toString());

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
                svg.selectAll(".operator").classed("highlight", false);
                // set highlight
                svg.select(`.${nodeId}`).classed("highlight", true);
            }
        });
    }

    private fixLabelPosition(svg: d3.Selection<any>) {
        // HACK: move html label from center to top left
        svg.selectAll(".operator > .label > g > foreignObject")
           .attr("x", -GRAPH_STYLE.general.width / 2)
           .attr("y", -GRAPH_STYLE.operator.height / 2)
           .attr("width", GRAPH_STYLE.general.width)
           .attr("height", GRAPH_STYLE.operator.height);
        svg.selectAll(".layer > .label > g > foreignObject")
           .attr("x", -GRAPH_STYLE.general.width / 2)
           .attr("y", -GRAPH_STYLE.general.headerHeight / 2)
           .attr("width", GRAPH_STYLE.general.width)
           .attr("height", GRAPH_STYLE.general.headerHeight);
        svg.selectAll(".label > g").attr("transform", undefined);
    }
}

/**
 * Dialog config for the operator graph
 */
export class OperatorGraphDialogConfig extends MdDialogConfig {
    /**
     * It is required to pass a LayerService instance.
     * @param layerService a LayerService instance
     * @returns the config object
     */
    layerService(layerService: LayerService): OperatorGraphDialogConfig {
        this.context.layerService = layerService;
        return this;
    }

    /**
     * It is required to pass a boolean wether the operators of all layers should be displayed or
     * only the operators of the selected one.
     * @param selectedLayerOnly should only the selected layer's operators be displayed?
     * @returns the config object
     */
    selectedLayerOnly(selectedLayerOnly: boolean): OperatorGraphDialogConfig {
        this.context.selectedLayerOnly = selectedLayerOnly;
        return this;
    }
}
