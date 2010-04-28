dojo.provide("dools.docs.widget.ApiTree");

dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dijit.Tree");
dojo.require("dijit.tree.ForestStoreModel");
dojo.require("dools.docs.widget._apiData");

dojo.declare(
	"dools.docs.widget.ApiTree",
	dijit.Tree,
	{
		// summary: Build an API tree from the JSON files given by the parameter "urls".
		// example:
		// 	|	<div dojoType="dools.docs.widget.ApiTree" urls="../resources/dojoApi-dojo.json,../resources/dojoApi-dijit.json,../resources/dojoApi-dojox.json">
		// 	|		<script type="dojo/method" event="onNodeClick" args="treeNode,name,type">
		// 	|			dojo.byId("clicked").innerHTML = name + " (" + type + ")";
		// 	|		</script>
		// 	|	</div>

		
		// summary: 
		urls:[],
		
		// summary: We don't want no root to be shown here, the JSON files contain the entire structure.
		// 		So we don't need no virtual root node.
		showRoot:false,
		
		postCreate:function(){
			// summary: Setup the tree, read the JSON files and convert them so they are useable in the tree.
			var d = dools.docs.widget._apiData;
			this.store = new dojo.data.ItemFileReadStore({
				data:{identifier:"id", label:"name", items:d.toStoreData(d.load(this.urls))},
				onComplete:function(){}
			});
			this.model = new dijit.tree.ForestStoreModel({
				store: this.store, query: {isRoot:true}, rootId: "root", childrenAttrs: ["children"]});
			this.inherited(arguments);
			
			var v = dojo.hitch(this.store, "getValue");
			dojo.connect(this, "onClick", dojo.hitch(this, function(item, treeNode){
				var i = treeNode.item;
				this.onNodeClick(treeNode, v(i, "moduleName"), v(i, "type"), v(i, "name"));
			}));
			
			// Add a CSS class, so we can nicer style the tree.
			dojo.addClass(this.domNode, "apiTree");
		},
		
		getIconClass: function(item, opened){
			// The following is probably quite slow, since it's executed for every item.
			var type = this.store.isItem(item) ? this.store.getValue(item, "type") : null;
			if (type){
				return "_type_" + item.type;
			} else {
				return opened ? "dijitFolderOpened" : "dijitFolderClosed";
			}
		},
		
		onNodeClick:function(treeNode, moduleName, moduleType, name){
			// summary: Connect onto this method to hook onto a node click in the tree.
			// description: E.g. dojo.connect(tree, "onNodeClick", function(moduleName, moduleType){...and your code here...})
		}
	}
);
