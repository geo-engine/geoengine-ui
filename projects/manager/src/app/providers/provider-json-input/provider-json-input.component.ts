import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {TypedDataProviderDefinition, TypedDataProviderDefinitionFromJSON} from '@geoengine/openapi-client';
import CodeMirror from 'codemirror';

@Component({
    selector: 'geoengine-manager-provider-json-input',
    templateUrl: './provider-json-input.component.html',
    styleUrl: './provider-json-input.component.scss',
})
export class ProviderJsonInputComponent implements OnChanges, AfterViewInit {
    @ViewChild('editor') editorRef!: ElementRef;
    @Output() changed = new EventEmitter<TypedDataProviderDefinition>();
    @Input() provider: TypedDataProviderDefinition | undefined;
    @Input() visible: boolean = false;
    @Input() readonly: boolean = false;
    editor?: CodeMirror.Editor;

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
            }
        }
    }

    setChangedDefinition(provider: TypedDataProviderDefinition): void {
        this.provider = provider;
        this.changed.emit(provider);
    }

    private setupEditor(): void {
        if (!this.editor) {
            this.editor = CodeMirror.fromTextArea(this.editorRef.nativeElement, {
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
                    } catch (_) {
                        // Do nothing, the JSON is not a valid provider definition.
                    }
                }
            });
        }
    }
}
