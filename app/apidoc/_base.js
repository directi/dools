dojo.provide("dools.app.apidoc._base");

dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dojox.layout.ExpandoPane");
dojo.require("dijit.layout.TabContainer");
dojo.require("dools.docs.widget.ApiTree");
dojo.require("dools.docs.widget.ApiList");
dojo.require("dools.docs.widget.ClassView");
dojo.require("dools.docs.widget.MethodView");

dojo.provide("dools.app");
dojo.declare(
	"dools.app",
	null,
	{
		constructor:function(){
			dojo.addOnLoad(dojo.hitch(this, "onPageLoaded"));
		},
		
		onPageLoaded:function(){
			// summary: Extend this method to do something after the page was loaded.
		}
	}
);


dojo.declare(
	"dools.app.apidoc",
	dools.app,
	{
		onPageLoaded:function(){
			dijit.registry.byClass("dools.docs.widget.ApiTree").forEach(dojo.hitch(this, function(w){
				dojo.connect(w, "onNodeClick", dojo.hitch(this, "onModuleClick"));
			}));
			dijit.registry.byClass("dools.docs.widget.ApiList").forEach(dojo.hitch(this, function(w){
				dojo.connect(w, "onClick", dojo.hitch(this, "onModuleClick"));
			}));
			
			// Connect the search input box and make it filter on every keystroke.
			dojo.query(".searchInput").connect("onkeyup", dojo.hitch(this, "filterApiList"));
			//
			dojo.query(".apiVersion").forEach("item.innerHTML = dojo.version");
		},
		
		filterApiList:function(evt){
			dijit.byId("apiListSearchWidget").filter(evt.target.value);
		},

		onModuleClick:function(el, moduleName, moduleType, name){
			if ("dijit._TreeNode"==el.declaredClass && !moduleType){ // If there is no module type, skip loading something.
				el.isExpanded ? el.collapse() : el.expand();
			} else {
				this.openTab(moduleName, moduleType);
			}
		},
		
		// _openTabs: Object
		// 		The key is the moduleName the value a ref to the tab.
		_openTabs:{},
		openTab:function(moduleName, moduleType, name){
			if (this._openTabs[moduleName]){
				dijit.byId("tabContainer").selectChild(this._openTabs[moduleName]);
			} else {
				this._openTabs[moduleName] = this.addTab(moduleName, moduleType, name);
			}
		},
		
		addTab:function(moduleName, moduleType, name){
			// Cut the tab title short, so we dont have sooo long names like "dojox.atom.io.model.Bla"
			var tabTitle;
			if (name){
				tabTitle = name;
			} else {
				var tabTitle = moduleName;
				if (tabTitle.length>15){
					var parts = tabTitle.split(".");
					if (parts.length>2){
						tabTitle = parts[0]+"..."+parts[parts.length-1];
					}
				}
			}
			var w = dijit.byId("tabContainer"),
				bc = new dijit.layout.BorderContainer({moduleName: moduleName, moduleType: moduleType, closable: true, title: tabTitle, gutters: false}),
				cp = new dijit.layout.ContentPane({region: "center", "class": "contentContainer"});
			w.addChild(bc);
			w.selectChild(bc);
			
			// create a node, in which we want to create our widget and append it to the contentpane
			// we cannot use the contentpane.domNode directly (it would be rendered twice)
			cp.attr("content", dojo.create("div"));
			bc.addChild(cp);
			var useClassViewFor = ["class", "object", "module", "mixin"];
			if (dojo.indexOf(useClassViewFor, moduleType)!=-1){
				new dools.docs.widget.ClassView({className:moduleName, docSyntax:"dojo"}, cp.domNode.firstChild);
			} else {
				var parts = moduleName.split(".");
				new dools.docs.widget.MethodView({methodName:parts.pop(), objectName:parts.join("."), docSyntax:"dojo"}, cp.domNode.firstChild);
			}
			return bc;
		}
	}
);


new dools.app.apidoc();
















/*
dojo.provide("dools.app.apidoc");
dojo.declare(
	"dools.app.apidoc",
	dools.app,
	{
		// summary: This property contains a reference to the tab container where the
		// 		actual content is shown, on the right.
		_contentTabContainer:null,
		
		constructor:function(){
			// Connect all the dojo.require() to show them in the loading dialog.
			this._loaderConn = dojo.connect(dojo, "require", function(e){
				dojo.query(".loadingModule").attr("innerHTML", e);
			});
		},
		
		onPageLoaded:function(){
			dojo.parser.parse();
			this.hideLoader();
			dojo.disconnect(this._loaderConn);
			// Set the dojo version.
			dojo.query(".apiVersion").attr("innerHTML", dojo.version);
			this.initApiTree();
			this.initTopicsTree();
			this.initLegend();



			// tab setup
			this._contentTabContainer = dijit.byId("docContent");
			
// TODO all from here looks wicked, i dont understand it (wolfram)
			// The this._contentTabContainer informs our viewer widgets, if they are currently shown.
			this._contentTabContainer.connect(this._contentTabContainer, "selectChild", function(child){
				// we need to send the hide-event for this child-pane
				// because no viewer is selected
				if(child.id == "mainPane"){
// TODO what is this global "uxebu.docs._currentViewer" here????
					if(uxebu.docs._currentViewer){
						uxebu.docs._hideCurrentViewer();
					}
					return;
				}
				var interval = window.setInterval(function(){
					var node = dojo.query(".apiDoc", child.domNode);
					if(node.length > 0){
						for(var i=0; i<node.length; i++){
							dijit.byNode(node[i])._onShow();
						}
						window.clearInterval(interval);
					}
				}, 100);
			}); 
			
			// Connect the searchbox stuff.
			var w = this._searchInputWidget = dijit.byId("apiNavSearch");
			dojo.connect(w.focusNode, "onkeyup", dojo.hitch(this, "renderApiSearch"));
			dojo.connect(w, "onChangeFilter", dojo.hitch(this, "renderApiSearch"));
			dojo.connect(w, "onClearInput", dojo.hitch(this, "renderApiSearch"));

		},

		hideLoader:function(){
			dojo.fadeOut({
				node:"preloader",
				duration:700,
				onEnd: function(){
					dojo.style("preloader", "display", "none");
				}
			}).play();
		},
		
		
		initLegend:function(){
			// summary: Set up legend wiper.
			var legendContainer = dojo.byId("apiLegendContainer");
			var legendWidth = dojo.marginBox(legendContainer).w;
			dojo.query(".legendHide").connect("onclick", function(){
				dojox.fx.wipeTo({
					node: legendContainer,
					width: 1,
					beforeBegin: function(){
						dojo.query(".apiLegendGroup").fadeOut({duration: 100}).play();
						dojo.query(".legendShow, .legendHide").toggleClass("displayNone");
					}
				}).play();	
			});
			
			dojo.query(".legendShow").connect("onclick", function(){
				dojox.fx.wipeTo({
					node: legendContainer,
					width: legendWidth+2,
					onEnd: function(){
						dojo.query(".apiLegendGroup").fadeIn().play();
						dojo.query(".legendShow, .legendHide").toggleClass("displayNone");
					}
				}).play();
			});
		},
		
		_currentRawModuleName:null,
		loadDocContent:function(treeNode, rawModuleName, moduleType){
			if (treeNode && !moduleType){ // If there is no module type, skip loading something.
				if (treeNode.isExpanded) treeNode.collapse(); else treeNode.expand();
				return;
			}
			this._currentRawModuleName = rawModuleName;
	//TODO get anchor name, the diff between rawModuleName and moduleName
			var moduleName = uxebu.docs.setup.getLoadableModuleName(rawModuleName);
			dojo.publish("uxebu.docs.Viewer.loadDocContent", [moduleName, moduleType, rawModuleName]);
			var existingTab = this.getTab(moduleName);
			// we just create a new tab, when it doesn't exist
			if(existingTab == null){
				// Cut the tab title short, so we dont have sooo long names like "dojox.atom.io.model.Bla"
				var tabTitle = moduleName;
				if (tabTitle.length>15){
					var parts = tabTitle.split(".");
					if (parts.length>2){
						tabTitle = parts[0]+"..."+parts[parts.length-1];
					}
				}
				var bc = new dijit.layout.BorderContainer({moduleName: moduleName, moduleType: moduleType, closable: true, title: tabTitle, gutters: false});
				this._contentTabContainer.addChild(bc);
				this._contentTabContainer.selectChild(bc);
				
				// VIEWER
				var container = new dijit.layout.ContentPane({region: "center", "class": "contentContainer"});
				// create a node, in which we want to create our widget and append it to the contentpane
				// we cannot use the contentpane.domNode directly (it would be rendered twice)
				container.attr("content", dojo.create("div"));
				bc.addChild(container);
				var viewer = new uxebu.docs.Viewer({moduleType:moduleType, moduleName:moduleName}, container.domNode.firstChild);
	// TODO: REVIEW THIS FUNCTIONALITY!
				viewer.connect(viewer, "onShow", function(){
	// ADDING-DOJO-BACK-FUNCTIONALITY
					if(viewer.moduleName != this._currentRawModuleName){
						window.location.href = "#" + this._currentRawModuleName;
					}
				});
				
				// TOOLBAR FOR THE VIEWER
				var search = new uxebu.docs.Viewer.Toolbar({
					viewer:viewer, // the toolbar knows about the viewer
					region:"top"
				});
				bc.addChild(search);
				
				// make sure it all renders correctly
				bc.layout();
			}
			// otherwise we just select it
			else {
				this._contentTabContainer.selectChild(existingTab);
			}
			//if(rawModuleName != moduleName){
			//	window.location.href = "#" + rawModuleName;
			//}
		},
		
	}
);
*/