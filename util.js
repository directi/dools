dojo.provide("dools.util");


// Used in most widgets, so probably wise to load here:
dojo.require("dojo.cache");



dools.util = {
	// summary:
	//		A set of utility methods shared amongst various Dools Widgets.
	//
	
	
	_unique: function(/*Array*/ src){
		// summary:
		//		Remove duplicates from a array.
		// example:
		//		dools.util._unique(['test','test','test1', 'test', 'test2']);
		//		=> ["test", "test1", "test2"]
		// tags:
		//		private
		var include;
		return dojo.filter(src, function(item, idx){
			include = true;
			for(var x=0, len=src.length-1; x<len; x++){
				if(src[idx]==src[x]){
					include = false;
				}
				include = (x == idx) || include;
			}
			return include;
		});
	},
	
	getNodeByPosition: function(/*Int*/ x, /*Int*/ y, /*Nodes[]?*/ ignoredNodes, /*Node*/ parent){
		// summary:
		//		Helper to getNodesByPosition, only returns the first node from the returned NodeList.
		// returns:
		//		Node
		// tags:
		//		public helper
		var nodes = this.getNodesByPosition(x, y, ignoredNodes, parent);
		
		if(nodes.length > 0){
			return nodes[0];
		}
		
		return null;
	},
	
	getNodesByPosition: function(/*Int*/ x, /*Int*/ y, /*Nodes[]?*/ ignoredNodes, /*Node*/ parent){
		// summary:
		//		Determine the node at a given coordinate, excluding any nodes in 'ignoredNodes'.
		// returns:
		//		Array|NodeList
		// tags: 
		//		public
		var result = this._getNodesByPosition(parent||dojo.body(), ignoredNodes || [], x, y, dojo._docScroll());
		return result;
	},
	
	_getNodesByPosition: function(/*Node*/ node, /*Nodes[]*/ignoredNodes, /*Int*/x, /*Int*/y, /*Int*/ scroll){
		// summary:
		//		Determine the node at a given coordinate, within a parent,
		//		excluding any nodes within ignoredNodes. 
		// tags:
		//		private helper
		// todo:
		//		remove usage of dreprecated dojo.coords, use dojo.position and such instead.
		var rNodeList = new dojo.NodeList();
		
		// Create a "worker" to do all our recursive tasks.
		// The Worker should never return anything, but rather add items to the "rNodeList" NodeList.
		var worker = function(node, ignoredNodes, x, y, scroll){
			var children = node.childNodes;
			
			// If we have no children, we must be as deep as we can be, so return out of this worker.
			if(children.length==0){
				return;
				// End of worker life cycle
			}
			
			// remove the hidden nodes:
			children = dojo.filter(children, function(child){
				if(child.nodeType == 1){
					return dojo.style(child, "display") != "none";
				}
				return true;
			});
			
			// remove the empty textNodes & other nodes which aren't text or elements:
			children = dojo.filter(children, function(child){
				if(child.nodeType == 3 && dojo.trim(child.textContent) == "" || child.nodeType == 2 || child.nodeType > 3){
					return false;
				}
				return true;
			});
			
			// remove nodes which are in the ignoredNodes list.
			children = dojo.filter(children, function(child){
				return !dojo.some(ignoredNodes, "return item==this", child);
			});
			
			// Loop backwards through the list of nodes we now have, as the top-most
			// element is likely to be the last node added to the document, unless 
			// there's a zIndex set on it, in which case we'll have to handle it specially
			//	using code that can be written later.
			for(var i=children.length-1, n; i>=0; i--){
				n = children[i];
				
				// If it's not an element, it must be a textnode, in which case it won't have 
				//	any coords, so skip it.
				if(n.nodeType != 1){
					continue;
				}
				
				// Get the position of the node, and check that they are within the positions we have given.
				// 	- DO NOT ever include the scroll values, as we include the scroll offsets manually.
				var c = dojo.position(n, true);
				
				if (c.x <= x+scroll.x && c.x+c.w >= x+scroll.x && c.y <= y+scroll.y && c.y+c.h >= y+scroll.y){
					// Add the current node to the rNodeList, and then recurse into it's children.
					rNodeList.push(n);
					
					worker(n, ignoredNodes, x, y, scroll)
				}
			}
			
			// push the node we were given into the rNodeList NodeList
			rNodeList.push(node);
			
			// End of worker life cycle
		};
		
		worker(node, ignoredNodes, x, y, scroll);
		return this._unique(rNodeList);
	},
	
	getNodeByZIndex: function(/*Node*/ parent, /*Nodes[]*/ ignoredNodes){
		// summary:
		//		Determine the node within a parent which has the highest z-index value, 
		//		excluding any nodes within ignoredNodes.
		// TODO: Include option to pass in a zIndex.
	}
	
	// TODO: Possibly rewrite & include requireStyle for loading of CSS.
};
