import {Component, ChangeDetectionStrategy, AfterViewInit, ElementRef, input, signal, viewChild, computed, effect} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {EditorView, ViewUpdate, lineNumbers, drawSelection, Panel, showPanel, PanelConstructor} from '@codemirror/view';
import {syntaxHighlighting, defaultHighlightStyle} from '@codemirror/language';
import {Compartment} from '@codemirror/state';
import {json} from '@codemirror/lang-json';
import {rust} from '@codemirror/lang-rust';

type Language = 'Rust' | 'JSON';

/**
 * A wrapper for the code editor.
 */
@Component({
    selector: 'geoengine-code-editor',
    template: `<div #editor></div>`,
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
export class CodeEditorComponent implements ControlValueAccessor, AfterViewInit {
    private readonly editorRef = viewChild.required<ElementRef<HTMLDivElement>>('editor');

    readonly language = input.required<Language>();
    readonly header = input<string>();

    private readonly code = signal<string>('');
    private readonly languageMode = computed(() => {
        switch (this.language()) {
            case 'Rust':
                return rust();
            case 'JSON':
                return json();
        }
    });

    private editor?: EditorView;
    private readonly languageCompartment = new Compartment();
    private readonly headerCompartment = new Compartment();
    private readonly headerPanel: Panel = createHeaderPanel();

    private onChanged?: (code: string) => void;
    private onTouched?: () => void;

    constructor() {
        effect(() => {
            this.editor?.dispatch({
                effects: this.languageCompartment.reconfigure(this.languageMode()),
            });
        });

        effect(() => {
            const code = this.code();
            if (this.onChanged) {
                this.onChanged(code);
            }
        });

        effect(() => {
            const header = this.header();

            this.headerPanel.dom.textContent = header ?? null;

            const panelConstructor: PanelConstructor | null = header ? (): Panel => this.headerPanel : null;

            this.editor?.dispatch({
                effects: this.headerCompartment.reconfigure(showPanel.of(panelConstructor)),
            });
        });
    }

    ngAfterViewInit(): void {
        const minHeightEditor = EditorView.theme({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '.cm-content, .cm-gutter': {minHeight: '6rem'},
        });

        this.editor = new EditorView({
            parent: this.editorRef().nativeElement,
            doc: this.code(),
            extensions: [
                lineNumbers(),
                drawSelection(),
                this.languageCompartment.of(this.languageMode()),
                syntaxHighlighting(defaultHighlightStyle),
                this.headerCompartment.of(showPanel.of(null)),
                minHeightEditor,
                EditorView.updateListener.of((v: ViewUpdate) => {
                    if (v.docChanged) {
                        this.code.set(v.state.doc.toString());
                    }
                    if (v.focusChanged && this.onTouched) {
                        this.onTouched();
                    }
                }),
            ],
        });
    }

    /** Implemented as part of ControlValueAccessor. */
    writeValue(code: string): void {
        if (this.editor) {
            this.editor?.dispatch({
                changes: {from: 0, to: this.editor.state.doc.length, insert: code},
            });
        } else {
            this.code.set(code);
        }
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: () => void): void {
        this.onChanged = fn;
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
}

function createHeaderPanel(): Panel {
    const dom = document.createElement('div');
    dom.textContent = 'F1: Toggle the help panel';
    dom.style.fontFamily = 'monospace';
    dom.style.padding = '0.5rem';
    return {top: true, dom};
}
