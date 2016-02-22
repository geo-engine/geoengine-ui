System.register(['angular2/core'], function(exports_1) {
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var core_1;
    var AppComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            AppComponent = (function () {
                function AppComponent() {
                    this.title = "Hello World!";
                    this.people = [
                        { "name": "Bob" },
                        { "name": "Tim" },
                        { "name": "Mike" }
                    ];
                    this.tabNr = 1;
                }
                AppComponent.prototype.traverse = function () {
                    this.tabNr = (this.tabNr + 1) % 3;
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'wave-app',
                        template: "\n    <div layout=\"column\" style=\"height:500px;\">\n\t\t\t\t<md-toolbar>\n\t\t\t\t  <paper-icon-button icon=\"menu\"></paper-icon-button>\n\t\t\t\t  <div class=\"title\">{{title}}</div>\n\t\t\t\t  <paper-icon-button icon=\"more-vert\"></paper-icon-button>\n\t\t\t\t</md-toolbar>\n\t\t\t\t<paper-toolbar>\n\t\t\t\t\t<paper-tabs [selected]=\"tabNr\" (selected-changed)=\"tabNr=$event.detail.value\">\n\t\t\t\t\t\t<paper-tab>Tab 1</paper-tab>\n\t\t\t\t\t\t<paper-tab>Tab 2</paper-tab>\n\t\t\t\t\t\t<paper-tab>Tab 3</paper-tab>\n\t\t\t\t\t</paper-tabs>\n\t\t\t\t\t<br />\n\t\t\t\t\t<iron-pages [selected]=\"tabNr\">\n\t\t\t\t\t\t<div>Page 1</div>\n\t\t\t\t\t\t<div>Page 2</div>\n\t\t\t\t\t\t<div>Page 3</div>\n\t\t\t\t\t</iron-pages>\n\t\t\t\t\t<br />\n\t\t\t\t\t<div (click)=\"traverse()\">Page {{tabNr + 1}}</div>\n\t\t\t\t</paper-toolbar>\n    </div>\n    "
                    }), 
                    __metadata('design:paramtypes', [])
                ], AppComponent);
                return AppComponent;
            })();
            exports_1("AppComponent", AppComponent);
        }
    }
});
/*
                <iron-list [items]="people" as="item">
                    <template>
                        <div>Name: [[item.name]]</div>
                    </template>
                </iron-list>
*/ 
//# sourceMappingURL=app.component.js.map