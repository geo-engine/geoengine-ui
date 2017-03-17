import {
    Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChange, ViewChild, AfterViewInit,
    ElementRef, OnDestroy, Provider,
} from '@angular/core';

import {BehaviorSubject, Subscription} from 'rxjs/Rx';

import * as CodeMirror from 'codemirror';

// import all possible modes
import 'codemirror/mode/r/r';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from "@angular/forms";

const LANGUAGES = ['r'];

/**
 * A wrapper for the code editor.
 */
@Component({
    selector: 'wave-code-editor',
    template: `
    <textarea #editor></textarea>
    `,
    styles: [`
    :host {
        display: block;
    }
    div {
        height: 100%;
        width: 100%;
    }
    `],
    providers: [ {provide: NG_VALUE_ACCESSOR, useExisting: CodeEditorComponent, multi: true,},
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent
    implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('editor') editorRef: ElementRef;

    @Input() language: string;

    private code$ = new BehaviorSubject('');

    private editor: CodeMirror.Editor;

    private onTouched: () => void;
    private changeSubscription: Subscription;

    ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
        if (this.editor) {
            for (const attribute in changes) {
                switch (attribute) {
                    case 'language':
                        this.editor.setOption('mode', this.language);
                        break;
                    default:
                        // do nothing
                }
            }
        }
    }

    ngAfterViewInit() {
        if (LANGUAGES.indexOf(this.language)) {
            throw `Language ${this.language} is not (yet) supported.`;
        }

        this.editor = CodeMirror.fromTextArea(this.editorRef.nativeElement, {
            lineNumbers: true,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            mode: this.language,
        });

        // subscribe to data
        // this.code$.subscribe(code => {
        //     if (code !== this.getCode()) {
        //         this.editor.setValue(code);
        //         this.editor.scrollIntoView({ line: 0, ch: 0 });
        //     }
        // });
        this.editor.setValue(this.code$.value);
        this.editor.scrollIntoView({ line: 0, ch: 0 });

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
            setTimeout(() => this.editor.refresh(), timeOffset);
        }
    }

    ngOnDestroy() {
        if (this.changeSubscription) {
            this.changeSubscription.unsubscribe();
        }
        this.code$.unsubscribe();
    }

    /**
     * @return the current editor content
     */
    getCode(): string {
        const code = this.editor.getValue();
        return code.replace('\r\n', '\n');
    }

    /**
     * Refresh the viewport.
     */
    refresh() {
        this.editor.refresh();
    }

    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: string): void {
        if (this.editor) {
            this.editor.setValue(value);
            this.editor.scrollIntoView({ line: 0, ch: 0 });
        } else {
            this.code$.next(value);
        }
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: () => {}) {
        if (this.changeSubscription) {
          this.changeSubscription.unsubscribe();
        }
        this.changeSubscription = this.code$.subscribe(fn);
    }

    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => {}) {
        if (this.onTouched) {
            this.onTouched = fn;
        }
    }
}
