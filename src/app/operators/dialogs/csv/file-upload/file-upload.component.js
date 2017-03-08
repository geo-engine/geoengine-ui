"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Created by Julian on 24.02.2017.
 */
var core_1 = require('@angular/core');
var FileUploadComponent = (function () {
    function FileUploadComponent() {
        this.data = null;
    }
    FileUploadComponent.prototype.changeListener = function ($event) {
        if ($event.target.files.length > 0) {
            this.data = { file: $event.target.files[0], content: '', progress: 0, configured: false };
            $event.target.value = '';
        }
        else
            this.data = null;
    };
    FileUploadComponent.prototype.upload = function () {
        var _this = this;
        var reader = new FileReader();
        reader.onload = (function (e) {
            _this.data.content = reader.result;
            _this.data.progress = 100;
        });
        reader.onerror = (function (e) {
            console.log('Error encountered file upload - Error type:' + e.error);
        });
        reader.onprogress = (function (e) {
            _this.data.progress = e.loaded / e.total * 100;
            console.log('progressed: ' + e.loaded / e.total * 100 + '% on file');
        });
        reader.onloadstart = (function (e) {
            console.log('Reader started reading ' + _this.data.file.name);
        });
        reader.readAsText(this.data.file);
    };
    FileUploadComponent.prototype.configure = function () {
        if (this.data === null)
            return;
        /*Load Dialog with <csv-config [content]="cutContent" [fileName]="data.file.name" [linesToParse]="15" [cellSpacing]="10">
        where cutContent is this.data.content cutted down to 15+csv-config.headerRow lines.
         */
        this.editing = true;
        //this.data.configured = true; AFTER EDITING
    };
    FileUploadComponent.prototype.delete = function () {
        this.editing = false;
        this.data = null;
    };
    FileUploadComponent.prototype.submit = function () {
    };
    /**This method generates an number array containing all integers i with n <= i < m
     *
     * @param n lowest integer. !Warning: This integer is still contained in array.
     * @param m highest integer. !Warning: This integer is not contained in array.
     * @returns {number[]} Array {n,..,m-1}
     */
    FileUploadComponent.prototype.range = function (n, m) {
        var res = [];
        for (var i = n; i < m; i++) {
            res.push(i);
        }
        return res;
    };
    FileUploadComponent = __decorate([
        core_1.Component({
            selector: 'file-upload',
            templateUrl: 'file-upload-template.component.html',
            styleUrls: ['file-upload-style.component.css']
        })
    ], FileUploadComponent);
    return FileUploadComponent;
}());
exports.FileUploadComponent = FileUploadComponent;
//# sourceMappingURL=file-upload.component.js.map