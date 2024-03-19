import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChange,
    ViewChild,
    AfterViewInit,
    ElementRef,
    OnDestroy,
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

import {BehaviorSubject, Subscription} from 'rxjs';

import {EditorView, ViewUpdate, lineNumbers, drawSelection, Decoration, DecorationSet} from '@codemirror/view';
import {syntaxHighlighting, defaultHighlightStyle} from '@codemirror/language';
import {EditorState, Transaction, Compartment, EditorSelection, RangeSet} from '@codemirror/state';
import {rust} from '@codemirror/lang-rust';
import {clamp} from '../math';

const LANGUAGES = ['Rust'];

/**
 * A wrapper for the code editor.
 */
@Component({
    selector: 'geoengine-code-editor',
    template: ` <div #editor></div> `,
    styles: [
        `
            :host {
                display: block;
            }

            div {
                height: 100%;
                width: 100%;
            }
        `,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: CodeEditorComponent,
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('editor', {static: true}) editorRef!: ElementRef;

    @Input() language = 'Rust'; // TODO: remove?
    @Input() prefixLine?: string;
    @Input() suffixLine?: string;

    private code$ = new BehaviorSubject('');

    private editor: EditorView;
    private languageCompartment = new Compartment();
    private readonlyCompartment = new Compartment();

    private onTouched?: () => void;
    private changeSubscription?: Subscription;

    constructor() {
        this.editor = new EditorView({
            extensions: [
                lineNumbers(),
                drawSelection(),
                this.languageCompartment.of(rust()),
                syntaxHighlighting(defaultHighlightStyle),
                // preventModifyTargetRanges(getReadOnlyRanges),
                this.readonlyCompartment.of([]),
                EditorView.updateListener.of((v: ViewUpdate) => {
                    if (v.docChanged) {
                        this.code$.next(this.getCode());
                    }
                }),
            ],
        });
    }

    ngOnChanges(changes: {[propKey: string]: SimpleChange}): void {
        if (!this.editor) {
            return;
        }

        if (changes.language) {
            // this.editor.setOption('mode', changes.language.currentValue);
            // TODO
        }

        if (changes.prefixLine || changes.suffixLine) {
            this.writeValue(this.getCode(changes.prefixLine?.previousValue, changes.suffixLine?.previousValue));
        }
    }

    ngAfterViewInit(): void {
        if (LANGUAGES.indexOf(this.language)) {
            throw new Error(`Language ${this.language} is not (yet) supported.`);
        }

        // this.editor = new EditorView({
        //     extensions: [rust(), syntaxHighlighting(defaultHighlightStyle)],
        //     parent: this.editorRef.nativeElement,
        // });
        this.editorRef.nativeElement.appendChild(this.editor.dom);

        // this.editor = CodeMirror.fromTextArea(this.editorRef.nativeElement, {
        //     lineNumbers: true,
        //     tabSize: 4,
        //     indentWithTabs: false,
        //     lineWrapping: true,
        //     lineSeparator: '\n',
        //     mode: this.language,
        //     smartIndent: true,
        // });

        // this.editor.setValue(this.code$.value);
        // this.editor.scrollIntoView({line: 0, ch: 0});

        // // add value observer
        // CodeMirror.on(this.editor, 'change', () => {
        //     this.code$.next(this.getCode());
        // });

        // // add touched observer
        // CodeMirror.on(this.editor, 'blur', () => {
        //     if (this.onTouched) {
        //         this.onTouched();
        //     }
        // });

        // // TODO: find a better way to fix the viewport issue.
        // for (const timeOffset of [0, 100, 500, 1000]) {
        //     setTimeout(() => {
        //         if (this.editor) {
        //             this.editor.refresh();
        //         }
        //     }, timeOffset);
        // }
    }

    ngOnDestroy(): void {
        if (this.changeSubscription) {
            this.changeSubscription.unsubscribe();
        }
    }

    /**
     * @return the current editor content
     */
    getCode(prefixLine = this.prefixLine, suffixLine = this.suffixLine): string {
        if (!this.editor) {
            return '';
        }

        const code = this.editor.state.doc.toString();

        // +1 for the `\n`
        const startIndex = prefixLine && code.startsWith(prefixLine) ? prefixLine.length + 1 : 0;
        const endLength = suffixLine && code.endsWith(suffixLine) ? suffixLine.length + 1 : 0;
        const endIndex = code.length - endLength;

        return code.substring(startIndex, endIndex);
    }

    /**
     * Refresh the viewport.
     */
    refresh(): void {
        // this.editor?.refresh(); // TODO: change?
    }

    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: string): void {
        const prefix = this.prefixLine ? `${this.prefixLine}\n` : '';
        const suffix = this.suffixLine ? ` \n${this.suffixLine}` : '';

        const code = prefix + value + suffix;

        if (!this.editor) {
            this.code$.next(value);
            return;
        }

        console.log('writeValue', value, code);

        // this.editor.setValue(code);
        this.editor.dispatch({
            changes: {from: 0, to: this.editor.state.doc.length, insert: code},
            effects: this.readonlyCompartment.reconfigure(
                // preventModifyTargetRanges((targetState: EditorState): Array<{from: number | undefined; to: number | undefined}> => {
                //     console.log('targetState lines', targetState.doc.line(0), targetState.doc.line(1));

                //     return [
                //         {
                //             from: undefined, //same as: targetState.doc.line(0).from or 0
                //             to: targetState.doc.line(0).to,
                //         },
                //         {
                //             from: targetState.doc.line(targetState.doc.lines).from,
                //             to: undefined, // same as: targetState.doc.line(targetState.doc.lines).to
                //         },
                //     ];
                // }),
                // EditorView.changeF
                [],
            ),
            scrollIntoView: true,
        });

        this.editor.dispatch({
            effects: this.readonlyCompartment.reconfigure(
                // preventModifyTargetRanges((targetState: EditorState): Array<{from: number | undefined; to: number | undefined}> => {
                //     console.log('targetState lines', targetState.doc.line(0), targetState.doc.line(1));

                //     const areas: Array<{from: number; to: number}> = [];

                //     // https://andrebnassis.github.io/codemirror-readonly-ranges/?path=/docs/3-code-sample--react-sample

                //     if (prefix) {
                //         // areas.push({
                //         //     // from: undefined, //same as: targetState.doc.line(0).from or 0
                //         //     // to: targetState.doc.line(1).to,
                //         //     from: 0,
                //         //     // to: prefix.length,
                //         //     to: 0,
                //         // });
                //     }
                //     // if (suffix) {
                //     //     areas.push({
                //     //         from: targetState.doc.line(targetState.doc.lines).from,
                //     //         to: undefined, // same as: targetState.doc.line(targetState.doc.lines).to
                //     //     });
                //     // }

                //     return areas;
                // }),
                // ),
                // EditorState.changeFilter.of((tr: Transaction) => {
                //     const areas: Array<number> = [];
                //     if (prefix) {
                //         areas.push(0);
                //         areas.push(prefix.length);
                //     }
                //     if (suffix) {
                //         console.log(tr.state.doc);

                //         console.log(tr.state.doc.line(tr.state.doc.lines).to, tr.state.doc.length);
                //         areas.push(tr.state.doc.line(tr.state.doc.lines).to - suffix.length);
                //         areas.push(tr.state.doc.line(tr.state.doc.lines).to + 1);
                //     }
                //     return areas;
                // }),
                // EditorState.transactionFilter.of((tr) => {
                //     const from = prefix.length;
                //     const to = tr.newDoc.length - suffix.length;

                //     // check any changes are out of bounds
                //     let out_of_bounds = false;
                //     tr.changes.iterChanges(
                //         (fromA, toA, fromB, toB, inserted) => (out_of_bounds = out_of_bounds || fromB < from || toB > to + inserted.length),
                //     );
                //     if (out_of_bounds) return [];

                //     // check any selections are out of bounds
                //     const selectionOkay = tr.newSelection.ranges.every((r) => r.from >= from && r.to <= to);
                //     if (selectionOkay) return tr;

                //     // create new selection which is in bounds
                //     const selection = EditorSelection.create(
                //         tr.newSelection.ranges.map((r) => EditorSelection.range(clamp(r.anchor, from, to), clamp(r.head, from, to))),
                //         tr.newSelection.mainIndex,
                //     );

                //     return [{selection}];
                // }),
                readOnlyTransactionFilter(new Decoration())
            ),
        });
        // this.editor.scrollIntoView({line: 0, ch: 0}); // TODO:

        if (this.prefixLine) {
            // this.editor.markText({line: 0, ch: 0}, {line: 1, ch: 0}, {readOnly: true, inclusiveLeft: true, inclusiveRight: false});
            // TODO:
        }

        if (this.suffixLine) {
            // const lastLine = this.editor.lineCount() - 1;
            // const secondLastLine = lastLine - 1;
            // this.editor.markText(
            //     {line: secondLastLine, ch: this.editor.getLine(secondLastLine).length},
            //     {line: lastLine, ch: suffix.length},
            //     {readOnly: true, inclusiveLeft: false, inclusiveRight: true},
            // );
            // TODO
        }
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: () => void): void {
        if (this.changeSubscription) {
            this.changeSubscription.unsubscribe();
        }
        this.changeSubscription = this.code$.subscribe(fn);
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => void): void {
        if (this.onTouched) {
            this.onTouched = fn;
        }
    }
}

const getReadOnlyRanges = (targetState: EditorState): Array<{from: number | undefined; to: number | undefined}> => {
    return [
        {
            from: undefined, //same as: targetState.doc.line(0).from or 0
            to: targetState.doc.line(0).to,
        },
        {
            from: targetState.doc.line(targetState.doc.lines).from,
            to: undefined, // same as: targetState.doc.line(targetState.doc.lines).to
        },
    ];
};

const preventModifyTargetRanges = (
    getReadOnlyRanges: (targetState: EditorState) => Array<{from: number | undefined; to: number | undefined}>,
) =>
    EditorState.changeFilter.of((tr: Transaction) => {
        try {
            const readOnlyRangesBeforeTransaction = getReadOnlyRanges(tr.startState);
            const readOnlyRangesAfterTransaction = getReadOnlyRanges(tr.state);

            console.log('readOnlyRangesBeforeTransaction', readOnlyRangesBeforeTransaction);
            console.log('readOnlyRangesAfterTransaction', readOnlyRangesAfterTransaction);

            for (let i = 0; i < readOnlyRangesBeforeTransaction.length; i++) {
                const targetFromBeforeTransaction = readOnlyRangesBeforeTransaction[i].from ?? 0;
                const targetToBeforeTransaction =
                    readOnlyRangesBeforeTransaction[i].to ?? tr.startState.doc.line(tr.startState.doc.lines).to;

                const targetFromAfterTransaction = readOnlyRangesAfterTransaction[i].from ?? 0;
                const targetToAfterTransaction = readOnlyRangesAfterTransaction[i].to ?? tr.state.doc.line(tr.state.doc.lines).to;

                if (
                    tr.startState.sliceDoc(targetFromBeforeTransaction, targetToBeforeTransaction) !==
                    tr.state.sliceDoc(targetFromAfterTransaction, targetToAfterTransaction)
                ) {
                    return false;
                }
            }
        } catch (e) {
            return false;
        }
        return true;
    });

const underlineMark = Decoration.mark({class: 'cm-underline'});

function readOnlyTransactionFilter(readonlyRangeSet: RangeSet<Decoration>) {
    return EditorState.transactionFilter.of((tr) => {
        // let readonlyRangeSet = tr.startState.field(underlineField, false);
        if (readonlyRangeSet && tr.docChanged && !tr.annotation(Transaction.remote)) {
            let block = false;
            tr.changes.iterChangedRanges((chFrom, chTo) => {
                readonlyRangeSet.between(chFrom, chTo, (roFrom, roTo) => {
                    if (chTo > roFrom && chFrom < roTo) block = true;
                });
            });
            if (block) return [];
        }
        return tr;
    });
}
