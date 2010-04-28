dojo.provide("dools.widget.Ruler");

dojo.require("dojo.fx");
dojo.require("dojo.dnd.move");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.HorizontalSlider");
dojo.require("dijit.form.NumberTextBox");

dojo.require("dools.util");

// Not Implemented:
//		dojo.require("dools.widget.NodeHighlighter");
//		dojo.require("dools.widget.Crosshair");

// TODO: change this to use: dools.util.getNodeByZIndex()

dojo.dnd.isFormElement = function(e){
	// summary:
	//		returns true if user clicked on a form element or a dijit form element.
	// tags:
	//		override
	
	var t = e.target;
	if(t.nodeType == 3 /*TEXT_NODE*/ || dojo.attr(t, "style") == "overflow: hidden;"){
		t = t.parentNode;
	}
	
	return dojo.hasClass(t, "dijitTextBox") || " button textarea input select option ".indexOf(" " + t.tagName.toLowerCase() + " ") >= 0;
};

dojo.declare("dools.widget.Ruler", [dijit._Widget, dijit._Templated], {
	
	snapToNodes: true,
	snapRadius: 20,
	// opacity: int
	// 		The opacity of the ruler widget, sometimes you want to see the bg shine through.
	// 		Ranges from 0..1, just like in CSS.
	opacity: 1,
	width: 300,
	
	widgetsInTemplate: true,
	templateString: dojo.cache("dools.widget","templates/Ruler.html"),
	_maxScale: 0,
	
	postscript: function(/*Object?*/params, /*DomNode|String?*/srcNodeRef){
		this.create(params, srcNodeRef || dojo.create("div", null, dojo.body()));
	},
	
	postCreate: function(){
		// Setup inital input control values:
		var position = dojo.position(this.domNode, true);
		this.displayInputX.attr("value", position.x);
		this.displayInputY.attr("value", position.y);
		this.displayInputSize.attr("value", this.width);
		this.opacityInput.attr("value", this.opacity*100);
		this.snapToNodesInput._setValueAttr(this.snapToNodes);
		this.snapRadiusInput._setValueAttr(this.snapRadius);
		
		// Various Interface Events:
		this.connect(this.hideButton, "onclick", dojo.hitch(this, "hide"));
		
		// The resize handle, and associated callbacks:
		this.resizable = new dojo.dnd.Moveable(this.resizeHandle, {skip: true});
		this.resizable.onMove = dojo.hitch(this, "_onResizableMove");
		this.connect(this.resizable, "onMoveStop", dojo.hitch(this, "_onResizableStop"));
		this.connect(this.resizable, "onFirstMove", dojo.hitch(this, "_onResizableFirstMove"));
		
		// The widget moveability:
		this.moveable = new dojo.dnd.Moveable(this.domNode, {skip: true});
		this.moveable.onMove = dojo.hitch(this, "_onWidgetMove");
		
		// The Scale / Scale Indicator:
		this.connect(this.scale, "onmousemove", dojo.hitch(this, "_onScaleMouseMove"));
		this.connect(this.scale, "onmouseout", dojo.hitch(this, "_onScaleMouseOut"));
		this.connect(this.scale, "onmouseover", dojo.hitch(this, "_onScaleMouseOver"));
		this.connect(this.scaleIndicator, "onmouseout", dojo.hitch(this, "_onScaleMouseOut"));
		this.connect(this.scaleIndicator, "onmouseover", dojo.hitch(this, "_onScaleMouseOver"));
		
		// The Options:
		this.connect(this.optionsToggleButton, "onclick", dojo.hitch(this, "_onToggleOptions"));
		this.connect(this.opacityInput, "onChange", dojo.hitch(this, "_onChangeOpacity"));
		
		this.connect(this.displayInputX, "onChange", dojo.hitch(this, "_onChangeDisplayX"));
		this.connect(this.displayInputY, "onChange", dojo.hitch(this, "_onChangeDisplayY"));
		this.connect(this.displayInputSize, "onChange", dojo.hitch(this, "_onChangeDisplaySize"));
		
		this.connect(this.displayInputX, "onBlur", dojo.hitch(this, "_onBlurDisplayX"));
		this.connect(this.displayInputY, "onBlur", dojo.hitch(this, "_onBlurDisplayY"));
		this.connect(this.displayInputSize, "onBlur", dojo.hitch(this, "_onBlurDisplaySize"));
		this.connect(this.snapToNodesInput, "onChange", dojo.hitch(this, "_onChangeSnapToNodes"));
		this.connect(this.snapRadiusInput, "onChange", dojo.hitch(this, "_onChangeSnapRadius"));
		
		// The Finale:
		this.connect(this, "destroy", dojo.hitch(this, "_destroy"));
		dojo.addOnWindowUnload(this, "destroy");
		
		// Fast Implementation of Scale Resizing:
// What are those three steps good for????
		// 1) Hide & Set the ruler to be the width to that of the document body:
		dojo.style(this.domNode, {opacity: 0, width: dojo.position(dojo.body()).w+"px"});
		// 2) Draw the scale:
		this._drawScale();
		// 3) Reshow the ruler & set the width to the width given in the options:
		dojo.style(this.domNode, {opacity: this.opacity, width: this.width-2+"px"});
		
		this.onReady();
	},
	
	_destroy: function(){
		// tags:
		// 	protected
		dojo.style(this.domNode, "display", "none");
		this.onDestroy();
	},
	
	show: function(){
		// summary:
		// 	Changes the visibility of the ruler to visible.
		dojo.style(this.domNode, "display", "block");
		this.onShow();
	},
	
	hide: function(){
		// summary:
		// 	Changes the visibility of the ruler to hidden.
		dojo.style(this.domNode, "display", "none");
		this.onHide();
	},
	
	toggle: function(){
		// summary:
		// 	Toggles the visibility of the ruler between hidden and visible.
		if(dojo.style(this.domNode, "display") == "none"){
			this.show();
		}else{
			this.hide();
		}
	},
	
	//===========================
	//	Resizable Callbacks:
	_onResizableFirstMove: function(/*Object*/ mover){
		// summary:
		// 	Handles the first move event of the resize handle for the ruler, this makes sure that the handle has an left position and sets 
		// tags:
		// 	private
		dojo.style(mover.node, "right", "");
		dojo.style(mover.node, "left", dojo.position(this.domNode, true).x+"px");
		
		dojo.addClass(dojo.doc.body, "doolsResizingEast");
		dojo.addClass(this.domNode, "doolsResizing");
	},
	
	_onResizableMove: function(/*Object*/ mover, /*Object*/ position){
		var left = (position.l > 293 ? position.l-2 : 293), width = left+5;
		
		if(dojo.position(this.scaleIndicator, true).x-dojo.position(this.domNode, true).x > left){
			dojo.style(this.scaleIndicator, "left", left+4+"px");
		}
		dojo.style(this.domNode, "width", width+"px");
		dojo.style(mover.node, {top: "0px", left: left+"px"});
		this.displayInputSize.attr("value", width+2);
		
// this is done three times within the code, the IF check
		if(width > this._maxScale){
			setTimeout(dojo.hitch(this, "_drawScale"), 1);
		}
		this.onResize(width);
	},
	
	_onResizableStop: function(/*Object*/ mover){
		var moverLeft = dojo.style(mover.node, "left"), newWidth = moverLeft + 5;
		
		dojo.style(mover.node, "left", moverLeft + "px");
		dojo.style(this.domNode, "width", newWidth + "px");
		
		dojo.removeClass(dojo.doc.body, "doolsResizingEast");
		dojo.removeClass(this.domNode, "doolsResizing");
		
		this.onChangeSize(newWidth);
	},
	
	//===========================
	//	Moveable Callbacks:
	_onWidgetMove: function(/*Object*/ mover, /*Object*/ position){
		var moverStyle = mover.node.style;
		var size = dojo.position(this.domNode, true);
		var bodyNode = dojo.body();
		
		//var focusedNode = dools.util.getNodeByPosition(position.l, position.t, [this.domNode, dojo_body], dojo_body) ||
		//  dools.util.getNodeByPosition(position.l + size.w, position.t, [this.domNode, dojo_body], dojo_body);
		
		var focusedNode = dools.util.getNodeByPosition(position.l, position.t, [this.domNode], bodyNode);
		
		if(focusedNode === bodyNode || focusedNode === null){
			focusedNode = dools.util.getNodeByPosition(position.l + size.w, position.t, [this.domNode], bodyNode);
		}
		
		if(focusedNode === bodyNode || focusedNode === null){
			focusedNode = dools.util.getNodeByPosition(position.l, position.t - (this.snapRadius / 2), [this.domNode], bodyNode);
		}
		
		if(focusedNode === bodyNode || focusedNode === null){
			focusedNode = dools.util.getNodeByPosition(position.l + size.w, position.t - (this.snapRadius / 2), [this.domNode], bodyNode);
		}
	
		if(this.snapToNodes && focusedNode !== bodyNode && focusedNode !== null){
			var node = dojo.position(focusedNode, true);
			
			if(Math.abs(position.l - node.x) < this.snapRadius){
				position.l = node.x + 1;
			} else if(Math.abs(position.l - (node.x + node.w - size.w)) < this.snapRadius){
				position.l = node.x + node.w - size.w - 1;
			}
			
			if(Math.abs(position.t - node.y) < this.snapRadius){
				position.t = node.y + 1;
			}
			
		/*	if(Math.abs((position.l) - node.x) < this.snapRadius){
				position.l = node.x;
				//console.log("(position.l + size.w) - node.x");
			}
			if(Math.abs(position.l - node.x) < this.snapRadius){
				position.l = node.x;
				//console.log("(position.l + size.w) - node.x");
			}
			*/
			//console.log("Has focusedNode");
		} else {
			//console.log("Noooo focusedNode");
		}
		
		
/*======================================================
	Broken Snapping:

		var originalPosition = dojo.position(this.domNode);		
		var maxDiff = Math.floor(this.snapRadius);
		var focusedNodes = [ 
			// top left
			dojo.filter(dools.util.getNodeByPosition(widgetPosition.x-maxDiff, widgetPosition.y-maxDiff, [this.domNode]), "this==dojo.doc.body"),
			// top right 
			dojo.filter(dools.util.getNodeByPosition(widgetPosition.x+widgetPosition.w+maxDiff, widgetPosition.y-maxDiff, [this.domNode]), "this==dojo.doc.body"),
			// bottom left
			dojo.filter(dools.util.getNodeByPosition(widgetPosition.x-maxDiff, widgetPosition.y+widgetPosition.h+maxDiff, [this.domNode]), "this==dojo.doc.body"),
			// Bottom right
			dojo.filter(dools.util.getNodeByPosition(widgetPosition.x+widgetPosition.w+maxDiff, widgetPosition.y+widgetPosition.h+maxDiff, [this.domNode]), "this==dojo.doc.body")
		];
		
		var focusedNode;

		for(var i=0, fnL = focusedNodes.length-1; i<fnL; i++){
			if(focusedNodes[i].length > 0){
				focusedNode = focusedNodes[i];
				break;
			}
		}
	
		if(this.snapToNodes && focusedNode !== null && focusedNode !== dojo.doc.body){
			var target = dojo.position(focusedNode);
				// Add/subtract 1 so we always stay inside the focusNode and prevent jumping.

				if (Math.abs(position.t-target.y) < maxDiff){
					position.t  = target.y;
				}
				
				// right side.
				if (Math.abs(position.l-(target.x+target.w)) < maxDiff){
					position.l  = target.x + target.w;
				}
				
				if (Math.abs(position.t-(target.y+target.h)) < maxDiff){
					position.t  = target.y + target.h;
				}
				
				if (Math.abs((position.l+widgetPosition.w)-target.x) < maxDiff){
					position.l  = target.x-widgetPosition.w;
				}
				
// TODO: Implement right-hand-side snapping.
//				if (Math.abs(position.l-(target.r-c.w))<maxDiff){ newPos.l  = c.r-c.w - 1; }
//				if (Math.abs(position.l-c.r)<maxDiff){ newPos.l  = c.r + 1; }
		}
		
======================================================*/
		
		position.l = position.l > 0 ? position.l : 0;
		position.t = position.t > 0 ? position.t : 0;
		
		moverStyle.left = position.l+"px";
		moverStyle.top = position.t+"px";
		
		this.displayInputX.attr("value", position.l);
		this.displayInputY.attr("value", position.t);
		
		this.onMove(position);
	},	

	//===========================
	//	Scale / ScaleIndicator Callbacks:
	_onScaleMouseOver: function(/*Object*/ event){
		// Don't move the marker if we're resizing:
		if(dojo.hasClass(this.domNode, "doolsResizing")){
			return;
		}
		
		dojo.style(this.scaleIndicator, "top", "-20px");
		dojo.style(this.scaleIndicator, "height", "32px");
	},
	
	_onScaleMouseOut: function(/*Object*/ event){
		// Don't move the marker if we're resizing:
		if(dojo.hasClass(this.domNode, "doolsResizing")){
			return;
		}
		
		dojo.style(this.scaleIndicator, "top", "0px");
		dojo.style(this.scaleIndicator, "height", "12px");
	},
	
	_onScaleMouseMove: function(/*Object*/ event){
		// Don't move the marker if we're resizing:
		if(dojo.hasClass(this.domNode, "doolsResizing")){
			return;
		}
		
		dojo.style(this.scaleIndicator, "left", (event.clientX - dojo.position(this.domNode, true).x)+"px");
	},

	//===========================
	// The Options:
	_onToggleOptions: function(){
		var node = this.optionsPanel;
		if(dojo.style(node, "display") == "none"){
			dojo.fx.wipeIn({node: node}).play();
		}else{
			dojo.fx.wipeOut({node: node}).play();
		}
	},

	_onChangeSnapToNodes: function(/*Boolean*/ newValue){
		this.snapToNodes = newValue;
		this.onSnapToNodesChange(newValue);
	},
	
	_onChangeSnapRadius: function(/*Float*/ newValue){
		this.snapRadius = Math.round(newValue);
		this.snapRadiusText.innerHTML = Math.round(newValue) + "px";
		this.onSnapRadiusChange(newValue);
	},
	
	_onChangeOpacity: function(/*Float*/ newValue){
		this.opacity = newValue/100;
		dojo.style(this.domNode, "opacity", this.opacity);
		this.onChangeOpacity(this.opacity);
	},
	
	_onChangeDisplayX: function(){
		var value = this.displayInputX.attr("value");
		
		if(value < 0 || isNaN(value) ){
			return false;
		}
		
		value = value < 1 ? value : value-1;
		
		dojo.style(this.domNode, "left", value+"px");
		this.onMove();
	},
	
	_onChangeDisplayY: function(){
		var value = this.displayInputY.attr("value");
		
		if(value < 0 || isNaN(value) ){
			return false;
		}
		
		value = value < 1 ? value : value-1;
			 
		dojo.style(this.domNode, "top", value+"px");
		this.onMove();
	},
	
	_onChangeDisplaySize: function(){
		if(this.displayInputSize.attr("value") < 298 || isNaN(this.displayInputSize.attr("value")) ){
			return false;
		}
		
		var width = (this.displayInputSize.attr("value") > 298 ? this.displayInputSize.attr("value")-2 : 298);
		this.displayInputSize.attr("value", width+2);

		if(dojo.position(this.scaleIndicator, true).x-dojo.position(this.domNode, true).x > width-5){
			dojo.style(this.scaleIndicator, "left", width-4+"px");
		}
		
		dojo.style(this.domNode, "width", width+"px");
		dojo.style(this.resizeHandle, "left", width-5+"px");
		
		if(width > this._maxScale){
			setTimeout(dojo.hitch(this, "_drawScale"), 1);
		}
		
		this.onResize(this.domNode, width);
	},
	
	_onBlurDisplayX: function(){
		if(this.displayInputX.attr("value") < 0 || isNaN(this.displayInputX.attr("value"))){
			this.displayInputX.attr("value", 0);
		}
	},
	
	_onBlurDisplayY: function(){
		if(this.displayInputY.attr("value") < 0 || isNaN(this.displayInputY.attr("value"))){
			this.displayInputY.attr("value", 0);
		}
	},
	
	_onBlurDisplaySize: function(){
		if(this.displayInputSize.attr("value") < 300 || isNaN(this.displayInputSize.attr("value"))){
			this.displayInputSize.attr("value", 300);
		}
	},
	
	//===========================
	//	Private Methods:
	_drawScale: function(){
		// summary:
		// 	Determines and creates the values for the markers along the ruler, if required.
		// tags:
		// 	private
		var size = dojo.position(this.domNode, true).w - 2; // subtract off the border width, which I know is 2px.
		if(size > this._maxScale){
			var fragment = document.createDocumentFragment(),
				 newScaleSize = this._maxScale;
			
			for(;newScaleSize < size; newScaleSize+=20){
				fragment.appendChild(dojo.create("div", {innerHTML:newScaleSize}));
			}
			this._maxScale = newScaleSize;
			this.scale.appendChild(fragment);
		}
	},
	
	onReady: function(){
		// summary:
		// 	Called once the ruler has loaded and been initialised.
		// tags:
		// 	callback
	},
	
	onDestroy: function(){
		// tags:
		// 	callback
	},
	
	onShow: function(){
		// tags:
		// 	callback
	},
	
	onHide: function(){
		// tags:
		// 	callback
	},
	
	onResize: function(/*int*/ width){
		// tags:
		// 	callback
	},
	
	onMove: function(/*Object*/ position){
		// tags:
		// 	callback
	},
	
	onChangeOpacity: function(value){
		// summary:
		// 	Called when the slider for the rulers opacity is changed. Changes the 
		// 	opacity style of the ruler.
		// 	Use dojo.connect(ruler, "onChangeOpacity", fnc)
		// tags:
		// 	callback
	},
	
	onChangeSize: function(/*int*/ width){
		// summary:
		// 	Called when the ruler is resized, via either the use of a text input 
		//	or resize handle.
		// tags:
		// 	callback
	},
	
	onSnapToNodesChange: function(){
		// summary:
		//	Called when the ruler's snapping is turned on or off.
		// tags:
		//	callback
	},
	
	onSnapRadiusChange: function(){
		// summary:
		//	Called when the slider for the rulers snap radius is changed.
		// tags:
		//	callback
	}
});
