/****************************************************************************
 Copyright (c) 2013-2014 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var Js = cc.js;

var LineCap     = require('./types').LineCap;
var LineJoin    = require('./types').LineJoin;

var Helper = require('./helper');

var CanvasRenderCmd = function (renderable) {
    _ccsg.Node.CanvasRenderCmd.call(this, renderable);
    this._needDraw = true;
    this.cmds = [];
};

var _p = CanvasRenderCmd.prototype = Object.create(_ccsg.Node.CanvasRenderCmd.prototype);
_p.constructor = CanvasRenderCmd;

_p._updateCurrentRegions = function() {
    var temp = this._currentRegion;
    this._currentRegion = this._oldRegion;
    this._oldRegion = temp;
    this._currentRegion.setTo(0,0, cc.visibleRect.width, cc.visibleRect.height);
};

_p.rendering = function (ctx, scaleX, scaleY) {
    var wrapper = ctx || cc._renderContext, context = wrapper.getContext();
    wrapper.setTransform(this._worldTransform, scaleX, scaleY);
    
    context.save();
    context.scale(1, -1);

    var endPath = true;
    var cmds = this.cmds;
    for (var i = 0, l = cmds.length; i < l; i++) {
        var cmd = cmds[i];
        var ctxCmd = cmd[0], args = cmd[1];

        if (ctxCmd === 'clear') {
            cmds.splice(0, i+1);
            i = 0;
            l = cmds.length;
            continue;
        }
        else if (ctxCmd === 'moveTo' && endPath) {
            context.beginPath();
            endPath = false;
        }
        else if (ctxCmd === 'fill' || ctxCmd === 'stroke' || ctxCmd === 'fillRect') {
            endPath = true;
        }

        if (typeof context[ctxCmd] === 'function') {
            context[ctxCmd].apply(context, args);
        }
        else {
            context[ctxCmd] = args;
        }
    }

    context.restore();
};

// draw api
Js.mixin(_p, {
    setStrokeColor: function (v) {
        var fillStyle = 'rgba(' + (0 | v.r) + ',' + (0 | v.g) + ',' + (0 | v.b) + ',' + v.a / 255 + ')';
        this.cmds.push(['strokeStyle', fillStyle]);
    },

    setFillColor: function (v) {
        var fillStyle = 'rgba(' + (0 | v.r) + ',' + (0 | v.g) + ',' + (0 | v.b) + ',' + v.a / 255 + ')';
        this.cmds.push(['fillStyle', fillStyle]);
    },

    setLineWidth: function (v) {
        this.cmds.push(['lineWidth', v]);
    },

    setLineCap: function (v) {
        if (v === LineCap.BUTT) {
            this.cmds.push(['lineCap', 'butt']);
        }
        else if (v === LineCap.ROUND) {
            this.cmds.push(['lineCap', 'round']);
        }
        else if (v === LineCap.SQUARE) {
            this.cmds.push(['lineCap', 'square']);
        }
    },

    setLineJoin: function (v) {
        if (v === LineJoin.BEVEL) {
            this.cmds.push(['lineJoin', 'bevel']);
        }
        else if (v === LineJoin.ROUND) {
            this.cmds.push(['lineJoin', 'round']);
        }
        else if (v === LineJoin.MITER) {
            this.cmds.push(['lineJoin', 'miter']);
        }
    },

    setMiterLimit: function (v) {
        this.cmds.push(['miterLimit', v]);
    },

    // draw functions
    
    beginPath: function () {
    },
    
    moveTo: function (x, y) {
        this.cmds.push(['moveTo', arguments]);
    },

    lineTo: function () {
        this.cmds.push(['lineTo', arguments]);
    },

    bezierCurveTo: function () {
        this.cmds.push(['bezierCurveTo', arguments]);
    },

    quadraticCurveTo: function () {
        this.cmds.push(['quadraticCurveTo', arguments]);
    },

    //
    arc: function (cx, cy, r, startAngle, endAngle, counterclockwise) {
        Helper.arc(this, cx, cy, r, startAngle, endAngle, counterclockwise);
    },

    ellipse: function (cx, cy, rx, ry) {
        Helper.ellipse(this, cx, cy, rx, ry);
    },

    circle: function (cx, cy, r) {
        Helper.ellipse(this, cx, cy, r, r);
    },

    rect: function (x, y, w, h) {
        this.moveTo(x, y);
        this.lineTo(x+w, y);
        this.lineTo(x+w, y+h);
        this.lineTo(x, y+h);
        this.close();
    },

    roundRect: function (x, y, w, h, r) {
        Helper.roundRect(this, x, y, w, h, r);
    },

    fillRect: function (x, y, w, h) {
        this.cmds.push(['fillRect', arguments]);
        this.setDirtyFlag(_ccsg.Node._dirtyFlags.contentDirty);
    },

    close: function () {
        this.cmds.push(['closePath', arguments]);
    },

    stroke: function () {
        this.cmds.push(['stroke', arguments]);
        this.setDirtyFlag(_ccsg.Node._dirtyFlags.contentDirty);
    },

    fill: function () {
        this.cmds.push(['fill', arguments]);
        this.setDirtyFlag(_ccsg.Node._dirtyFlags.contentDirty);
    },

    clear: function () {
        this.cmds.push(['clear']);
        this.setDirtyFlag(_ccsg.Node._dirtyFlags.contentDirty);
    }
});

var misc = require('../utils/misc');
misc.propertyDefine(CanvasRenderCmd, ['lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'strokeColor', 'fillColor'], {});

module.exports = CanvasRenderCmd;
