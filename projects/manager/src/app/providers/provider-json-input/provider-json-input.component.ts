import {AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, viewChild, output} from '@angular/core';
import {TypedDataProviderDefinition, TypedDataProviderDefinitionFromJSON} from '@geoengine/openapi-client';
import CodeMirror from 'codemirror';
import {MatError} from '@angular/material/form-field';

@Component({
    selector: 'geoengine-manager-provider-json-input',
    templateUrl: './provider-json-input.component.html',
    styleUrl: './provider-json-input.component.scss',
    imports: [MatError],
})
export class ProviderJsonInputComponent implements OnChanges, AfterViewInit {
    readonly editorRef = viewChild.required<ElementRef>('editor');
    readonly changed = output<TypedDataProviderDefinition>();
    @Input() provider: TypedDataProviderDefinition | undefined;
    @Input() visible: boolean = false;
    @Input() readonly: boolean = false;
    editor?: CodeMirror.Editor;
    inputInvalid: boolean = false;

    ngAfterViewInit(): void {
        this.setupEditor();
    }

    ngOnChanges(_: SimpleChanges): void {
        if (this.visible) {
            setTimeout(() => {
                this.editor?.refresh();
                this.editor?.setOption('readOnly', this.readonly);
            }, 50);
        } else {
            if (this.provider) {
                this.editor?.setValue(JSON.stringify(this.provider, undefined, 4));
                this.inputInvalid = false;
            }
        }
    }

    setChangedDefinition(provider: TypedDataProviderDefinition): void {
        this.provider = provider;
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
                readOnly: this.readonly,
            });

            if (this.provider) {
                this.editor?.setValue(JSON.stringify(this.provider, undefined, 4));
            }

            setTimeout(() => this.editor?.refresh(), 50);

            // add value observer
            CodeMirror.on(this.editor, 'change', (e) => {
                if (this.visible) {
                    this.provider = undefined;
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
