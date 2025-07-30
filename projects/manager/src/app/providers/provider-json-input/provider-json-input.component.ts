import {AfterViewInit, Component, ElementRef, viewChild, output, input, signal, effect} from '@angular/core';
import {TypedDataProviderDefinition, TypedDataProviderDefinitionFromJSON} from '@geoengine/openapi-client';
import CodeMirror from 'codemirror';
import {MatError} from '@angular/material/form-field';

@Component({
    selector: 'geoengine-manager-provider-json-input',
    templateUrl: './provider-json-input.component.html',
    styleUrl: './provider-json-input.component.scss',
    imports: [MatError],
})
export class ProviderJsonInputComponent implements AfterViewInit {
    readonly editorRef = viewChild.required<ElementRef>('editor');
    readonly changed = output<TypedDataProviderDefinition>();
    readonly provider = input<TypedDataProviderDefinition>();
    _provider = signal<TypedDataProviderDefinition | undefined>(undefined);
    readonly visible = input<boolean>(false);
    readonly readonly = input<boolean>(false);
    editor?: CodeMirror.Editor;
    inputInvalid: boolean = false;

    constructor() {
        effect(() => {
            this._provider.set(this.provider());

            if (this.visible()) {
                setTimeout(() => {
                    this.editor?.refresh();
                    this.editor?.setOption('readOnly', this.readonly());
                }, 50);
            } else {
                const provider = this._provider();
                if (provider) {
                    this.editor?.setValue(JSON.stringify(provider, undefined, 4));
                    this.inputInvalid = false;
                }
            }
        });
    }

    ngAfterViewInit(): void {
        this.setupEditor();
    }

    setChangedDefinition(provider: TypedDataProviderDefinition): void {
        this._provider.set(provider);
        this.changed.emit(provider);
    }

    private setupEditor(): void {
        if (!this.editor) {
            this.editor = CodeMirror.fromTextArea(this.editorRef().nativeElement, {
                lineNumbers: true,
                tabSize: 4,
                indentWithTabs: false,
                lineWrapping: true,
                lineSeparator: '\n',
                mode: 'application/json',
                smartIndent: true,
                readOnly: this.readonly(),
            });

            const provider = this._provider();
            if (provider) {
                this.editor?.setValue(JSON.stringify(provider, undefined, 4));
            }

            setTimeout(() => this.editor?.refresh(), 50);

            // add value observer
            CodeMirror.on(this.editor, 'change', (e) => {
                if (this.visible()) {
                    try {
                        this.setChangedDefinition(TypedDataProviderDefinitionFromJSON(JSON.parse(e.getValue())));
                        this.inputInvalid = false;
                    } catch (_) {
                        this.inputInvalid = true;
                    }
                }
            });
        }
    }
}
