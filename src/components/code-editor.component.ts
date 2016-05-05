import {Component, Input, Output, ChangeDetectionStrategy, EventEmitter, ViewChild, AfterViewInit,
        ElementRef, AfterViewChecked} from "angular2/core";

import CodeMirror from "codemirror";

// import all possible modes
import "codemirror/mode/r/r";

const LANGUAGES = ["r"];

/**
 * A wrapper for the code editor.
 */
@Component({
    selector: "wave-code-editor",
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent implements AfterViewInit {
    @ViewChild("editor") editorRef: ElementRef;

    @Input() language: string;

    @Input() code: string = "";
    @Output() codeChange = new EventEmitter<string>();

    private editor: CodeMirror.Editor;

    private initializationState = 0;

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

        // set initial code
        if (this.code !== undefined) {
            this.editor.setValue(this.code);
            this.editor.scrollIntoView({ line: 0, ch: 0 });
        }

        // add value observer
        CodeMirror.on(this.editor, "change", () => {
            this.codeChange.emit(this.getCode());
        });

        // TODO: find a better way to fix the viewport issue.
        setTimeout(() => this.editor.refresh(), 1000);
    }

    /**
     * @return the current editor content
     */
    getCode(): string {
        const code = this.editor.getValue();
        return code.replace("\r\n", "\n");
    }
}
