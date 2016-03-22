/*
 */
"use strict";

goog.provide("Entry.FieldBlock");

goog.require("Entry.Field");
/*
 *
 */
Entry.FieldBlock = function(content, blockView, index, mode) {
    this._blockView = blockView;
    this._block = blockView.block;
    this._valueBlock = null;

    var box = new Entry.BoxModel();
    this.box = box;

    this.changeEvent = new Entry.Event(this);

    this._index = index;
    this._content = content;

    this.acceptType = content.accept;
    this._restoreCurrent = content.restore;

    this.view = this;

    this.svgGroup = null;

    this._position = content.position;

    this.box.observe(blockView, "alignContent", ["width", "height"]);

    this.renderStart(blockView.getBoard(), mode);
};

Entry.Utils.inherit(Entry.Field, Entry.FieldBlock);

(function(p) {
    p.renderStart = function(board, mode) {
        this.svgGroup = this._blockView.contentSvgGroup.elem("g");
        this.view = this;
        this._nextGroup = this.svgGroup;
        this.box.set({
            x: 0,
            y: 0,
            width: 0,
            height: 20
        });
        var block = this.getValue();
        if (block && !block.view) {
            block.setThread(this);
            block.createView(board, mode);
            block.getThread().view.setParent(this);
        }
        this.updateValueBlock(block);

        if (this._blockView.getBoard().constructor == Entry.BlockMenu)
            this._valueBlock.view.removeControl();

    };

    p.align = function(x, y, animate) {
        animate = animate === undefined ? true : animate;
        var svgGroup = this.svgGroup;
        if (this._position) {
            if (this._position.x)
                x = this._position.x;
            if (this._position.y)
                y = this._position.y;
        }

        var block = this._valueBlock;

        if (block) {
            y = block.view.height * -0.5;
        }
        var transform = "translate(" + x + "," + y + ")";

        if (animate)
            svgGroup.animate({
                transform: transform
            }, 300, mina.easeinout);
        else
            svgGroup.attr({
                transform: transform
            });

        this.box.set({
            x: x,
            y: y
        });
    };

    p.calcWH = function() {
        var block = this._valueBlock;

        if (block) {
            var blockView = block.view;
            this.box.set({
                width: blockView.width,
                height: blockView.height
            });
        } else {
            this.box.set({
                width: 15,
                height: 20
            });
        }
    };

    p.calcHeight = p.calcWH;

    p.destroy = function() {};

    p.inspectBlock = function() {
        if (!this._valueBlock) {
            var blockType = null;
            if (this._originBlock) {
                blockType = this._originBlock.type;
                delete this._originBlock;
            } else {
                switch (this.acceptType) {
                    case "booleanMagnet":
                        blockType = "True";
                        break;
                    case "stringMagnet":
                        blockType = "text";
                        break;
                    case "basic_param":
                        blockType = "function_field_label";
                        break;
                }
            }
            var block = this._createBlockByType(blockType);
            return this._setValueBlock(block);
        }
    };

    p._setValueBlock = function(block) {
        if (block != this._valueBlock || !this._valueBlock) {

            if (this._restoreCurrent)
                this._originBlock = this._valueBlock;
            this._valueBlock = block;
            this.setValue(block);
            if (!this._valueBlock)
                return this.inspectBlock();

            block.setThread(this);
            block.getThread().view.setParent(this);

            return this._valueBlock;
        }
    };

    p._getValueBlock = function() {return this._valueBlock;};

    p.updateValueBlock = function(block) {
        if (!(block instanceof Entry.Block)) block = undefined;
        if (this._sizeObserver) this._sizeObserver.destroy();
        if (this._posObserver) this._posObserver.destroy();

        var view = this._setValueBlock(block).view;
        view.bindPrev();
        this._blockView.alignContent();
        this._posObserver = view.observe(this, "updateValueBlock", ["x", "y"], false);
        this._sizeObserver = view.observe(this, "calcWH", ["width", "height"]);
        var board = this._blockView.getBoard();// performance issue
        if (board.constructor === Entry.Board)
            board.generateCodeMagnetMap();
    };

    p.getPrevBlock = function(block) {
        if (this._valueBlock === block) return this;
        else return null;
    };

    p.getNextBlock = function() {
        return null;
    };

    p.requestAbsoluteCoordinate = function(blockView) {
        var blockView = this._blockView;
        var contentPos = blockView.contentPos;
        var pos = blockView.getAbsoluteCoordinate();
        pos.x += this.box.x + contentPos.x;
        pos.y += this.box.y + contentPos.y;
        return pos;
    };

    p.dominate = function() {
        this._blockView.dominate();
    };

    p.isGlobal = function() {
        return false;
    };

    p.separate = function(block) {
        this.getCode().createThread([block]);
        this.changeEvent.notify();
    };

    p.getCode = function() {
        return this._block.thread.getCode();
    };

    p.cut = function(block) {
        if (this._valueBlock === block) return [block];
        else return null;
    };

    p.replace = function(block) {
        if (typeof block === "string")
            block = this._createBlockByType(block);
        var valueBlock = this._valueBlock;
        var valueBlockType = valueBlock.type;
        if (Entry.block[valueBlockType].isPrimitive) {
            valueBlock.destroy();
        }
        else {
            valueBlock.view._toGlobalCoordinate();
            this.separate(valueBlock);
            valueBlock.view.bumpAway(30, 150);
        }
        this.updateValueBlock(block);
        block.view._toLocalCoordinate(this.svgGroup);
        this.calcWH();
    };

    p.setParent = function(parent) {
        this._parent = parent;
    };

    p.getParent = function() {
        return this._parent;
    };

    p._createBlockByType = function(blockType) {
        var thread = this._block.getThread();
        var board = this._blockView.getBoard();

        var block = new Entry.Block({type: blockType}, this);
        var workspace = board.workspace;
        var mode;
        if (workspace)
            mode = workspace.getMode();

        block.createView(board, mode);
        return block;
    };

})(Entry.FieldBlock.prototype);
