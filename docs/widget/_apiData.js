dojo.provide("dools.docs.widget._apiData");

dools.docs.widget._apiData = {
	
	dataCache:{},
	
	load:function(/*Array*/urls){
		// summary: Load the given files.
		// description: Each URL in the array should point to a JSON file, which
		// 		contains a tree-like structure as in
		// 		[dojoApi-dojo.json](`dojo.moduleUrl("dools.docs.widget.resources", "dojoApi-dojo.json")`)
		//
		var url, ret = [];
		for (var i=0, l=urls.length; i<l; i++){
			url = urls[i];
			if (!this.dataCache[url]){
				dojo.xhrGet({
					url:url,
					sync:true,
					handleAs:"json",
					preventCache:true,
					load:dojo.hitch(this, function(data){
						this.dataCache[url] = data;
					})
				});
			}
			ret = ret.concat(this.dataCache[url]);
		}
		return ret;
	},
	
	toStoreData:function(data){
		// summary: Convert the data we retreive from e.g. dojoApi.json into data that the
		// 		ItemFileReadStore understands.
		this._idCounter = 0;
		var ret = [], el, d,
			childEls = null;
		for (var i=0, l=data.length; i<l; i++){
			this._idCounter++;
			d = data[i];
			el = {id:this._idCounter, name:d.name, type:d.type, isRoot:true, moduleName:d.moduleName || d.name};
			ret.push(el);
			if (d.children && d.children.length>0){
				this._convertChildren(ret, el, d.children, d.name);
			}
		}
		return ret;
	},
	
	_convertChildren:function(allItems, parentItem, children, moduleName){
		// summary: Add the items to allItems and to the children key in parentItem.
		var d;
		for (var i=0, l=children.length; i<l; i++){
			this._idCounter++;
			d = children[i];
			if(typeof d!="undefined"){
				if (typeof parentItem.children=="undefined") parentItem.children = [];
				parentItem.children.push({_reference:this._idCounter});
				var el = {id:this._idCounter, name:d.name, type:d.type, moduleName:d.moduleName || (moduleName+"."+d.name)};
				allItems.push(el);
				if (d.children && d.children.length>0){
					this._convertChildren(allItems, el, d.children, moduleName+"."+d.name);
				}
			}
		}
	}
};
