import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChange,
    ViewChild,
    AfterViewInit,
    ElementRef,
    OnDestroy,
    input,
    signal,
    viewChild,
    computed,
    effect,
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {BehaviorSubject, skip, Subscription} from 'rxjs';
import {EditorView, ViewUpdate, lineNumbers, drawSelection, Decoration, DecorationSet} from '@codemirror/view';
import {syntaxHighlighting, defaultHighlightStyle} from '@codemirror/language';
import {EditorState, Transaction, Compartment, EditorSelection, RangeSet} from '@codemirror/state';
import {json} from '@codemirror/lang-json';
import {rust} from '@codemirror/lang-rust';

// import all possible modes
import 'codemirror/mode/rust/rust';

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
export class CodeEditorComponent implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy {
    private editorRef = viewChild.required<ElementRef>('editor');

    language = input.required<Language>();
    header = input<string>('');

    private code = signal<string>('');

    private editor: EditorView;
    private languageCompartment = new Compartment();

    private onTouched?: () => void;

    constructor() {
        this.editor = new EditorView({
            extensions: [
                lineNumbers(),
                drawSelection(),
                this.languageCompartment.of(rust()),
                syntaxHighlighting(defaultHighlightStyle),
                EditorView.updateListener.of((v: ViewUpdate) => {
                    if (v.docChanged) {
                        this.code.set(this.getCode());
                    }
                }),
            ],
        });

        computed(() => {
            const lang = this.language();
            let mode;
            switch (lang) {
                case 'Rust':
                    mode = rust();
                    break;
                case 'JSON':
                    mode = json();
                    break;
            }
            this.editor.dispatch({
                effects: this.languageCompartment.reconfigure(mode),
            });
        });
    }

    ngOnChanges(changes: Record<string, SimpleChange>): void {
        if (!this.editor) {
            return;
        }

        if (changes.language) {
            this.editor.setOption('mode', changes.language.currentValue);
        }

        if (changes.prefixLine || changes.suffixLine) {
            this.writeValue(this.getCode(changes.prefixLine?.previousValue, changes.suffixLine?.previousValue));
        }
    }

    ngAfterViewInit(): void {
        if (LANGUAGES.indexOf(this.language)) {
            throw new Error(`Language ${this.language} is not (yet) supported.`);
        }

        this.editor = CodeMirror.fromTextArea(this.editorRef.nativeElement, {
            lineNumbers: true,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            lineSeparator: '\n',
            mode: this.language,
            smartIndent: true,
        });

        this.editor.setValue(this.code$.value);
        this.editor.scrollIntoView({line: 0, ch: 0});

        // add value observer
        CodeMirror.on(this.editor, 'change', () => {
            this.code$.next(this.getCode());
        });

        // add touched observer
        CodeMirror.on(this.editor, 'blur', () => {
            if (this.onTouched) {
                this.onTouched();
            }
        });

        // TODO: find a better way to fix the viewport issue.
        for (const timeOffset of [0, 100, 500, 1000]) {
            setTimeout(() => {
                if (this.editor) {
                    this.editor.refresh();
                }
            }, timeOffset);
        }

        // set prefix and suffix lines
        if (this.prefixLine) {
            this.writeValue(this.getCode(this.prefixLine, this.suffixLine));
        }
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

        const code = this.editor.getValue();

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
        this.editor?.refresh();
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

        this.editor.setValue(code);
        this.editor.scrollIntoView({line: 0, ch: 0});

        if (this.prefixLine) {
            this.editor.markText({line: 0, ch: 0}, {line: 1, ch: 0}, {readOnly: true, inclusiveLeft: true, inclusiveRight: false});
        }

        if (this.suffixLine) {
            const lastLine = this.editor.lineCount() - 1;
            const secondLastLine = lastLine - 1;
            this.editor.markText(
                {line: secondLastLine, ch: this.editor.getLine(secondLastLine).length},
                {line: lastLine, ch: suffix.length},
                {readOnly: true, inclusiveLeft: false, inclusiveRight: true},
            );
        }
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: () => void): void {
        effect(() => {
            this.code();
            fn();
        });
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => void): void {
        if (this.onTouched) {
            this.onTouched = fn;
        }
    }
}
