dojo.provide("dools.widget.NodeHighlighter");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("dools.widget.NodeHighlighter", [dijit._Widget, dijit._Templated], {
	// summary:
	//		This widget can highlight nodes, by outlining their dimension and
	//		by default also the padding and margin areas.
	// description:
	//		Note that the highlighter overlays the node that it highlights and
	//		makes it unusable thereby. So be sure to hide the highlighter
	//		when you want to use this node again.
	// example:
	//		h = new uxebu.tools.NodeHighlighter();
	//		h.setNode(dojo.byId("nodeName"));
	//		h.hide();
	//		h.show();


	templateString: dojo.cache(dojo.moduleUrl("dools.widget","templates/NodeHighlighter.html")),

	postCreate: function(/*Object?*/ params, /*DomNode|String?*/ srcNodeRef){
		// summary:
		//	
		dojo.body().appendChild(this.domNode);
	},

	setNode: function(/*DomNode|String*/ srcNodeRef){
		// summary:
		//		Set the node to be highlighted and highlight it right away.
		// tags:
		//		public
	},
	
	show: function(){
		// summary:
		//		Makes the NodeHiglighter visible.
		// tags:
		//		public
		dojo.style(this.domNode, "display", "block");
	},
	
	hide: function(){
		// summary:
		//		Makes the NodeHiglighter invisible.
		// tags:
		//		public
		dojo.style(this.domNode, "display", "none");
	}
});
