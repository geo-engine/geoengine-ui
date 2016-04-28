import {Component, ChangeDetectionStrategy, AfterViewInit,
        Input, ViewChild, ElementRef, ChangeDetectorRef} from "angular2/core";
import {Observable, Subject, BehaviorSubject} from "rxjs/Rx";

import {MATERIAL_DIRECTIVES} from "ng2-material/all";
import {MdDialogRef, MdDialogConfig} from "ng2-material/components/dialog/dialog";
import {DialogContainerComponent} from "./dialog-basics.component";

import {LayerService} from "../../services/layer.service";

import {Layer} from "../../models/layer.model";
import {Operator, ResultType} from "../../models/operator.model";

import d3 from "d3";
import dagre from "dagre";
import dagreD3 from "dagre-d3";

@Component({
    selector: "wave-operator-graph-dialog",
    template: `
    <wave-dialog-container #container [title]="title" [overflow]="false">
        <svg #graph [style.width.px]="width$ | async" [style.height.px]="height$ | async"></svg>
    </wave-dialog-container>
    `,
    styles: [``],
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

    private graphStyle = {
        operator: {
            width: 200,
            height: 136,
            headerHeight: 48,
            margin: 5,
            borderHeight: 1,
        },
        layer: {
            width: 200,
            height: 48,
            margin: 5,
        }
    };

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

            this.fillGraph(graph, [layer.operator], [layer]);
        } else {
            // this.title.next(`Workflow`);
            this.fillGraph(graph, this.layerService.getLayers().map(layer => layer.operator), [...this.layerService.getLayers()]);
        }

        // create the renderer
        let render = new dagreD3.render();

        // Set up an SVG group so that we can translate the final graph.
        let svg = d3.select(this.graphContainer.nativeElement);
        let svgGroup = svg.append("g");

        // Run the renderer. This is what draws the final graph.
        render(svgGroup, graph);

        this.setStyles(svg);

        setTimeout(() => {
            this.title = title;
            const sizes = this.setupWidthObservables(graph);
            this.addZoomSupport(svg, svgGroup, graph, sizes.width, sizes.height);
            // this.centerGraph(graph, svg, svgGroup);
        });
    }

    private setupWidthObservables(graph: dagreD3.graphlib.Graph): {width: number, height: number} {
        const graphWidth$ = Observable.of(graph.graph().width);
        const graphHeight$ = Observable.of(graph.graph().height);

        const widthBound = (maxWidth: number, graphWidth: number) => {
            const margin = 40;
            return Math.min(maxWidth, graphWidth + margin);
        };

        Observable.zip(
            this.dialogContainer.maxWidth$,
            graphWidth$,
            widthBound
        ).subscribe(this.width$);

        Observable.zip(
            this.dialogContainer.maxHeight$,
            graphHeight$,
            widthBound
        ).subscribe(this.height$);

        return {
            width: widthBound(this.dialogContainer.maxWidth$.getValue(), graph.graph().width),
            height: widthBound(this.dialogContainer.maxHeight$.getValue(), graph.graph().height),
        };
    }

    private fillGraph(graph: dagreD3.graphlib.Graph, initialOperators: Array<Operator>, layers: Array<Layer>) {
        // from `http://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript`
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

        const RESULT_TYPES = [ResultType.RASTER, ResultType.POINTS,
                             ResultType.LINES, ResultType.POLYGONS];

        let operators: Array<Operator> = [...initialOperators];
        let edges: Array<[number, number]>  = [];
        while (operators.length > 0) {
            let operator = operators.pop();

            // add node to graph
            graph.setNode(`operator_${operator.id}`, {
                operatorId: operator.id,
                class: "operator",
                labelType: "html",
                label: `
                <div class="type">
                    <span style="background-color: #${intToRGB(hashCode(operator.operatorType))}">
                    </span>
                    ${operator.operatorType}
                </div>
                <div class="parameters">
                    <table>
                        <tr>
                        ${Array.from(operator.parameters.entries())
                               .map(([key, value]: [string, any]) => {
                                   return `<td class="key">${key}</td>
                                           <td class="value">${value}</td>`;
                               })
                               .join("</tr><tr>")}
                        </tr>
                    </table>
                </div>
                `,
                padding: 0,
                width: this.graphStyle.operator.width,
                height: this.graphStyle.operator.height,
            });

            // add children
            for (let resultType of RESULT_TYPES) {
                for (let child of operator.getSources(resultType)) {
                    operators.push(child);
                    edges.push([child.id, operator.id]);
                }
            }
        }

        // add edges to graph
        for (let [sourceId, targetId] of edges) {
            graph.setEdge(`operator_${sourceId}`, `operator_${targetId}`);
        }

        // add layers as nodes and connect layers to operators
        for (let layer of layers) {
            graph.setNode(`layer_${layer.operator.id}`, {
                class: "layer",
                labelType: "html",
                label: `<div class="layer">${layer.name}</div>`,
                padding: 0,
                width: this.graphStyle.layer.width,
                height: this.graphStyle.layer.height,
            });

            graph.setEdge(`operator_${layer.operator.id}`, `layer_${layer.operator.id}`);
        }
    }

    private addZoomSupport(svg: d3.Selection<any>, svgGroup: d3.Selection<any>,
                           graph: dagreD3.graphlib.Graph,
                           svgWidth: number, svgHeight: number) {
        const margin = 40;
        const paddedWidth = svgWidth - margin;
        const paddedHeight = svgHeight - margin;

        const scale = Math.min(
            paddedWidth / graph.graph().width,
            paddedHeight / graph.graph().height
        );

        console.log(`Center: ${(svgHeight - (scale * svgHeight)) / 2}, svg: ${svgHeight}, padded: ${paddedHeight}, graph: ${graph.graph().height}`);

        const zoom = d3.behavior.zoom()
                                .translate([
                                    (svgWidth - (scale * graph.graph().width)) / 2,
                                    (svgHeight - (scale * graph.graph().height)) / 2,
                                 ])
                                .scale(scale);

        zoom.event(svgGroup.transition().duration(500));

        zoom.on("zoom", () => {
            // TODO: add `d3.event.translate` and `d3.event.scale` to definition file
            let d3Event: any = d3.event;

            svgGroup.attr(
                "transform",
                `translate(${d3Event.translate})scale(${d3Event.scale})`
            );
        });
        svg.call(zoom);
    }

    private centerGraph(graph: dagreD3.graphlib.Graph,
                        svg: d3.Selection<any>, svgGroup: d3.Selection<any>) {
        const containerWidth = this.graphContainer.nativeElement.scrollWidth;
        const graphWidth = graph.graph().width;
        const xCenterOffset = (containerWidth - graphWidth) / 2 + 20;
        svgGroup.attr("transform", `translate(${xCenterOffset}, 20)`);
        // svg.attr("height", graph.graph().height + 40);
        // svg.attr("width", graph.graph().width + 40);
    }

    private setStyles(svg: d3.Selection<any>) {
        // HACK: style the graph here because of view encapsulation

        // HACK: move html label from center to top left
        svg.selectAll(".operator > .label > g > foreignObject")
           .attr("x", -this.graphStyle.operator.width / 2)
           .attr("y", -this.graphStyle.operator.height / 2)
           .attr("width", this.graphStyle.operator.width)
           .attr("height", this.graphStyle.operator.height);
        svg.selectAll(".layer > .label > g > foreignObject")
           .attr("x", -this.graphStyle.layer.width / 2)
           .attr("y", -this.graphStyle.layer.height / 2)
           .attr("width", this.graphStyle.layer.width)
           .attr("height", this.graphStyle.layer.height);
        svg.selectAll(".label > g").attr("transform", undefined);

        // style node div
        svg.selectAll(".label > g > foreignObject >  div").style({
            "box-shadow": `0px 3px 5px -1px rgba(0, 0, 0, 0.2),
                           0px 5px 8px 0px rgba(0, 0, 0, 0.14),
                           0px 1px 14px 0px rgba(0, 0, 0, 0.12)`,
        });

        // style label header
        svg.selectAll(".label .type").style({
            width: `${this.graphStyle.operator.width - this.graphStyle.operator.margin}px`,
            "padding-right": `${this.graphStyle.operator.margin}px`,
            height: `${this.graphStyle.operator.headerHeight
                       - this.graphStyle.operator.borderHeight}px`,
            "line-height": `${this.graphStyle.operator.headerHeight
                              - this.graphStyle.operator.borderHeight}px`,
            overflow: "hidden",
            "text-overflow": "ellipsis",
            whiteSpace: "nowrap",
            color: "rgba(0, 0, 0, 0.87)",
            "border-bottom": `${this.graphStyle.operator.borderHeight}px solid rgba(0, 0, 0, 0.12)`,
            "font-family": "RobotoDraft, Roboto, 'Helvetica Neue', sans-serif",
        });

        // style label icon
        svg.selectAll(".label .type span").style({
            width: `${this.graphStyle.operator.headerHeight}px`,
            height: `${this.graphStyle.operator.headerHeight}px`,
            display: "block",
            float: "left",
            "margin-right": `${this.graphStyle.operator.margin}px`,
        });

        // style label parameter content
        svg.selectAll(".label .parameters").style({
            width: `${this.graphStyle.operator.width - (2 * this.graphStyle.operator.margin)}px`,
            height: `${this.graphStyle.operator.height
                       - this.graphStyle.operator.headerHeight
                       - (2 * this.graphStyle.operator.margin)}px`,
            "background-color": "#f5f5f5",
            padding: `${this.graphStyle.operator.margin}px`,
            overflow: "hidden",
            "text-overflow": "ellipsis",
            whiteSpace: "nowrap",
        });

        // style label parameter content table
        svg.selectAll(".label .parameters table").style({
            width: `${this.graphStyle.operator.width - (2 * this.graphStyle.operator.margin)}px`,
            "table-layout": "fixed",
        });
        svg.selectAll(".label .parameters .key").style({
            width: `33%`,
            overflow: "hidden",
            "text-overflow": "ellipsis",
        });
        svg.selectAll(".label .parameters .value").style({
            width: `67%`,
            overflow: "hidden",
            "text-overflow": "ellipsis",
        });

        // style of layer
        svg.selectAll(".label .layer").style({
            height: `${this.graphStyle.layer.height - (2 * this.graphStyle.operator.margin)}px`,
            "line-height": `${this.graphStyle.layer.height
                              - (2 * this.graphStyle.operator.margin)}px`,
            width: `${this.graphStyle.layer.width - (2 * this.graphStyle.operator.margin)}px`,
            padding: `${this.graphStyle.operator.margin}px`,
            "font-family": "RobotoDraft, Roboto, 'Helvetica Neue', sans-serif",
            "background-color": "#3f51b5",
            color: "rgba(255, 255, 255, 0.87059)",
        });

        // style of node rectangle
        svg.selectAll(".node rect").style({
            stroke: "rgba(0, 0, 0, 0.12)",
            fill: "#fff",
            strokeWidth: "1.5px",
        });

        // style of edge
        svg.selectAll(".edgePath path").style({
            stroke: "#333",
            strokeWidth: "1.5px",
        });
    }
}

export class OperatorGraphDialogConfig extends MdDialogConfig {
    layerService(layerService: LayerService): OperatorGraphDialogConfig {
        this.context.layerService = layerService;
        return this;
    }
    selectedLayerOnly(selectedLayerOnly: boolean): OperatorGraphDialogConfig {
        this.context.selectedLayerOnly = selectedLayerOnly;
        return this;
    }
}
