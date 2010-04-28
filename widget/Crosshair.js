dojo.provide("dools.widget.Crosshair");

dojo.require("dools.util");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("dools.widget.Crosshair", [dijit._Widget, dijit._Templated], {
	// summary:
	//		This widget is a simple crosshair, which can be snapped to any position.
	// description:
	//		Note, this is a utility widget, and probably wouldn't be of much use standalone.
	// example:
	//		crosshair = new dools.widget.Crosshair();
	// example:
	//		crosshair = new dools.widget.Crosshair({visible: true, staticVisible: false});
		
	
	// Options:
	visible: true,
	staticVisible: true,
	
	// Template:
	templateString: dojo.cache("dools.widget","templates/Crosshair.html"),
	
	postCreate: function(/*Object?*/ params, /*DomNode|String?*/ srcNodeRef){
		// summary:
		//	
		dojo.body().appendChild(this.domNode);
		
		this._eventOnClick = dojo.connect(dojo.doc, "onclick", this, "_handleClickAnywhere");
		this._eventOnMouseMove = dojo.connect(dojo.doc, "onmousemove", this, "handleMouseMove");
		
		if(this.visible){
			this.show();
		}else{
			this.hide();
		}
		
		if(this.staticVisible){
			this.showStatic();
		}else{
			this.hideStatic();
		}
		
		this.inherited(arguments);
		
		dojo.addOnWindowUnload(this, "destroy");
	},	
	
	_getNodeByPosition: function(x, y){
		// summary:
		//		Wrapper for dools.util.getNodeByPosition();
		return dools.util.getNodeByPosition(x, y, [this.domNode, this.movingCrosshairHorizontal, this.movingCrosshairVertical, this.staticCrosshairHorizontal, this.staticCrosshairVertical]) || dojo.body();
	},
	
	_handleClickAnywhere: function(evt){
		// summary:
		//		
		if(dojo.style(this.domNode, "display") == "block"){
			this.onClick(evt, this._getNodeByPosition(evt.clientX, evt.clientY));
			
			if(dojo.style(this.staticCrosshairVertical, "display") == "block" && dojo.style(this.staticCrosshairHorizontal, "display") == "block"){
				dojo.style(this.staticCrosshairVertical, {display: "block", left: evt.clientX+"px"});
				dojo.style(this.staticCrosshairHorizontal, {display: "block", top: evt.clientY+"px"});
			}
		}
	},
	
	handleMouseMove: function(evt){
		// summary:
		//		
		if(dojo.style(this.movingCrosshairVertical, "display") == "block" && dojo.style(this.movingCrosshairHorizontal, "display") == "block"){
			dojo.style(this.movingCrosshairVertical, {left: evt.clientX+"px"});
			dojo.style(this.movingCrosshairHorizontal, {top: evt.clientY+"px"});
			
			this.onMouseMove(evt);
		}
	},
	
	show: function(){
		// summary:
		//		Makes the Crosshair visible.
		// tags:
		//		public
		dojo.style(this.domNode, "display", "block");
		dojo.style(this.movingCrosshairVertical, "display", "block");
		dojo.style(this.movingCrosshairHorizontal, "display", "block");
		
		if(this.staticVisible){
			dojo.style(this.staticCrosshairVertical, "display", "block");
			dojo.style(this.staticCrosshairHorizontal, "display", "block");
		}
		
		this.onShow();
	},
	
	hide: function(){
		// summary:
		//		Makes the NodeHiglighter invisible.
		// tags:
		//		public
		dojo.style(this.domNode, "display", "none");
		dojo.style(this.movingCrosshairVertical, "display", "none");
		dojo.style(this.movingCrosshairHorizontal, "display", "none");
		dojo.style(this.staticCrosshairVertical, "display", "none");
		dojo.style(this.staticCrosshairHorizontal, "display", "none");
		
		this.onHide();
	},
	
	showStatic: function(){
		// summary:
		//		
		this.staticVisible = true;
		dojo.style(this.staticCrosshairVertical, "display", "block");
		dojo.style(this.staticCrosshairHorizontal, "display", "block");
		
		this.onShowStatic();
	},
	
	hideStatic: function(){
		// summary:
		//		
		this.staticVisible = false;
		dojo.style(this.staticCrosshairVertical, "display", "none");
		dojo.style(this.staticCrosshairHorizontal, "display", "none");
		
		this.onHideStatic();
	},

	
	destroy: function(){
		// summary:
		//		
		dojo.style(this.domNode, "display", "none");
		
		dojo.disconnect(this._eventOnClick);
		dojo.disconnect(this._eventOnMouseMove);
		
		this.onDestroy();
		
		this.inherited(arguments);
	},

/////////////////////////////// CALLBACKS /////////////////

	onShow: function(){
		// Summary:
		//		Called when the crosshair is made visible.
		// tags:
		//		callback
	},
	
	onHide: function(){
		// Summary:
		//		Called when the crosshair is made invisible.
		// tags:
		//		callback
	},
	
	onShowStatic: function(){
		// Summary:
		//		Called when the static crosshair is made visible.
		// tags:
		//		callback
	},
	
	onHideStatic: function(){
		// Summary:
		//		Called when the static crosshair is made invisible.
		// tags:
		//		callback
	},
	
	onDestroy: function(){
		// Summary:
		//		Called when the crosshair is destroyed.
		// tags:
		//		callback		
	},
	
	onClick: function(evt, targetNode){
		// Summary:
		//		Called something is clicked on while the crosshair is active.
		// tags:
		//		callback
	},
	
	onMouseMove: function(evt){
		// Summary:
		//		Called when the crosshair is visible and the mouse is moved.
		// Description:
		//		Note, if you need to find out which node was really underneath the pointer from within this callback, use:
		//			{{{ this._getNodeByPosition(evt.clientX, evt.clientY) }}}
		// tags:
		//		callback
	}
});
