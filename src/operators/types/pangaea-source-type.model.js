"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var operator_type_model_1 = require('../operator-type.model');
/**
 * The Pangaea source type.
 */
var PangaeaSourceType = (function (_super) {
    __extends(PangaeaSourceType, _super);
    function PangaeaSourceType(config) {
        _super.call(this);
        this.dataLink = config.dataLink;
    }
    Object.defineProperty(PangaeaSourceType, "TYPE", {
        get: function () { return PangaeaSourceType._TYPE; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PangaeaSourceType, "ICON_URL", {
        get: function () { return PangaeaSourceType._ICON_URL; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PangaeaSourceType, "NAME", {
        get: function () { return PangaeaSourceType._NAME; },
        enumerable: true,
        configurable: true
    });
    PangaeaSourceType.fromDict = function (dict) {
        return new PangaeaSourceType({
            dataLink: dict.dataLink,
        });
    };
    PangaeaSourceType.prototype.getMappingName = function () {
        return PangaeaSourceType.TYPE;
    };
    PangaeaSourceType.prototype.getIconUrl = function () {
        return PangaeaSourceType.ICON_URL;
    };
    PangaeaSourceType.prototype.toString = function () {
        return PangaeaSourceType.NAME;
    };
    PangaeaSourceType.prototype.getParametersAsStrings = function () {
        return [
            ['dataLink', this.dataLink],
        ];
    };
    PangaeaSourceType.prototype.toMappingDict = function () {
        return {
            dataLink: this.dataLink,
        };
    };
    PangaeaSourceType.prototype.toDict = function () {
        return {
            operatorType: PangaeaSourceType.TYPE,
            dataLink: this.dataLink,
        };
    };
    PangaeaSourceType._TYPE = 'pangaea_source';
    PangaeaSourceType._ICON_URL = operator_type_model_1.OperatorType.createIconDataUrl(PangaeaSourceType._TYPE);
    PangaeaSourceType._NAME = 'Pangaea Source';
    return PangaeaSourceType;
}(operator_type_model_1.OperatorType));
exports.PangaeaSourceType = PangaeaSourceType;
