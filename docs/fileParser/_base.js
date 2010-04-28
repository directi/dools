dojo.provide("dools.docs.fileParser._base");

//TODO: WE NEED TO REMOVE THAT DEPENDENCY!!!!!!!!
dojo.require("dools.docs.setup");
dojo.require("dools.docs.Reflection");
dojo.require("dojox.string.tokenize");

dojo.declare(
	"dools.docs.fileParser._base",
	null,
	{
		// summary:
		// 		The parser for analyzing JS files and extracting the doc strings.
		//
		
		// summary:
		// 		Stores the info about where in «this.sourceCode« the file's content starts and how many lines it has.
		// fileInfo: Array
		// description:
		// 		Its content is strucutred as followed:
		// 		[
		// 			{start:0, numLines:999, file:"dojo.js"},
		//			{start:1000, numLines:500, file:"dojo/_base/xhr.js"},
		//			...
		//		]
		fileInfo:null,
		
		// summary: The source code of all the sourceFiles loaded and concatenated.
		sourceCode:"",
		
		constructor:function(/*String*/moduleName, /*String?*/methodName){
			// summary: Returns an instance which allows parsing the given module. Be sure to call load() next.
			// description:
			// 		By passing the second parameter the method «getMethodDocString()«
			// 		can be used too, and will return exactly the info about this
			// 		very method given as the second parameter to the constructor,
			// 		in the following example it would be "query" of "dojo.query".
			// 			fp = new dools.docs.FileParser("dojo", "query")
			this.moduleName = moduleName;
			this.methodName = methodName;
			this.sourceFiles = dools.docs.setup.getSourceFiles(moduleName, methodName);
			this.fileInfo = [];
		},
		
		load:function(){
			// summary: Trigger the source code loading.
			if (this.sourceCode!=""){ // Don't reload the source code unnecessarily, just makes it slow.
				return;
			}
			var sourceCodes = dools.docs.setup.getSourceCode(this.moduleName, this.methodName),
				s,
				fs = this.fileInfo;
			for (var i in sourceCodes){
				s = sourceCodes[i];
				last = fs.length>0 ? fs[fs.length-1] : {start:0, numLines:0};
				this.fileInfo.push({
					start:last.start + last.numLines,
					numLines:s.split("\n").length,
					file:i
				});
				this.sourceCode += s+"\n";
			}
		},
		
		parseAsClass:function(){
			// summary: Get the doc blocks for the parts of the class (properties, functions, etc.).
			// description: We do it simpler by using reflection so we don't need
			// 		to be parsing the file that explicit. We find out the properties
			// 		and methods and try to find the according doc blocks.
			// 		E.g. for properties we know that properties have the doc block
			// 		above it.
			// returns: An object with the keys "class", "methods" and "properties" where
			// 		each contains the according properties read from the file.
			// 		See getClassDocString(), getMethodData() and getPropertyDocStrings()
			// 		for more details on the structure of each value.
			this.load(this.moduleName);
			var reflect = new dools.docs.Reflection(this.moduleName),
				methodNames = [], propertyNames = [];
			for (var i in reflect.getMethods()) methodNames.push(i);
			for (var i in reflect.getProperties()) propertyNames.push(i);
			return {
				"class":this.getClassDocString(),
				methods:this.getMethodData(methodNames),
				properties:this.getPropertyData(propertyNames)
			};
		},
		
		parseAsMethod:function(){
			// summary: Get the doc blocks for the parts of the class (properties, functions, etc.).
			var parts = this.moduleName.split(".");
			return this._extractMethodData(parts[parts.length-1]);
		},
		
		getClassDocString:function(){
			// summary: Extract the docstring for the class.
			// description: Must be overridden to server the fileParser specific
			// 		implementation.
			throw new Error(this.declaredClass + ".getClassDocString() not implemented.");
		},
		
		getMethodData:function(methods){
			// summary:
			// 		Get the doc string for all given methods.
			// methods: Array|undefined
			// 		Either a list of methods or in case this class was instanciated
			// 		with a methodName no parameter is required.
			// description:
			// 		This method returns the methods' data. In case the class
			// 		was instanciated with a method name, like so:
			// 			fp = new dools.docs.FileParser("dojo", "query");
			//		only the data set for the one method dojo.query is returned.
			// 		If it was instanciated without the second paramter, this
			// 		method returns the data for all methods which's names were
			// 		passed to this method.
			if (typeof methods=="undefined" && this.methodName){
				return this._extractMethodData(this.methodName);
			}
			var ret = {};
			for (var i=0, l=methods.length; i<l; i++){
				ret[methods[i]] = this._extractMethodData(methods[i]);
			}
			return ret;
		},
		
		getPropertyData:function(props){
			// summary:
			// 		Get the doc string for all given properties.
			var ret = {};
			for (var i=0, l=props.length; i<l; i++){
				ret[props[i]] = this._extractPropertyData(props[i]);
			}
			return ret;
		},
		
		_extractMethodData:function(/*String*/name){
			// summary:
			// 		Extract all the available method data for the given method's name.
			// description:
			// 		This method find the given function in the current source code.
			// 		The method _prepareMethodReturnData() will extract the docString,
			// 		parameters and sourcecode, so this method is basically JS generic.
			
			// >>> // Case 1, the simple dojo default case: "name:function(/*String*/name, /*Whatever|Nothing*/params){}".
			// >>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser._base"); fp.load();
			// >>> d = fp.getMethodData(["_extractMethodData"])._extractMethodData.docString
			// >>> d && d.length>0
			// true
			var src = this.sourceCode,
				regex = new RegExp(name + "\\s*:\\s*function\\s*\\("), // Simple regex to fail fast, if this string is not in there, it's not this case.
				search = src.match(regex);
			if (search!=null){ // If the method can be found parse the parameters. Sometimes the introspection is not perfect :-)
				return this._prepareMethodReturnData(name, search, search.index + search[0].length);
			}
			// Case 2, the straight forward method declaration, such as:
			// 		dijit._Templated.getCachedTemplate = function(templatePath, templateString, alwaysUseString){
			// and also
			// 		dojo["eval"] = function(/*String*/ scriptFragment){
			// The method name is always preceeded by the complete module name.
			
			// >>> // Find: dojo.string.trim = function(str){}
			// >>> var fp = new dools.docs.fileParser.Dojo("dojo.string"); fp.load();
			// >>> d = fp.getMethodData(["trim"]).trim.docString
			// >>> d && d.length>0
			// true
			// >>> // Find: "dijit._Templated.getCachedTemplate".
			// >>> var fp = new dools.docs.fileParser.Dojo("dijit._Templated"); fp.load();
			// >>> d = fp.getMethodData(["getCachedTemplate"]).getCachedTemplate.docString
			// >>> d && d.length>0
			// true
			// >>> // Find: dojo["eval"] = function(){}
			// >>> var fp = new dools.docs.fileParser.Dojo("dojo"); fp.load();
			// >>> d = fp.getMethodData(["eval"]).eval.docString
			// >>> d && d.length>0
			// true
			var escapedModuleName = this.moduleName.replace(/\./g, "\\."),
				completeMethodName = "(" + escapedModuleName + "\\." + name + "|" + escapedModuleName + "\\[['\"]" + name + "['\"]\\])",
				regex = new RegExp(completeMethodName + "\\s*=\\s*function\\s*\\("), // Fail fast.
				search = src.match(regex);
			if (search!=null){
				return this._prepareMethodReturnData(name, search, search.index);
			}
			// Case 3, a bit less accurate but working way, works e.g. when using (function(){}) constructs.
			// 		e.g. d.query = function(/*String*/ query, /*String|DOMNode?*/ root){
			// Since there is some namespace mangling sometimes, like in dojo.query we only check for
			// "something that looks like a valid namespace identifier" before the actual function name.
			// See tests/FileParser.js for tests for this case, "test_lineNumber".
			var regex = new RegExp("\\w[.a-zA-Z0-9_]*\\." + name + "\\s*=\\s*function\\s*\\("), // Fail fast.
				search = src.match(regex);
			if (search!=null){
				return this._prepareMethodReturnData(name, search, search.index);
			}
			
			var ret = {docString:"", params:[], lineNumber:-1, numLines:0, fileName:"", sourceCode:""};
			return ret;
		},
		
		_extractMethodParameters:function(name){
			return [];
		},
		
		_extractMethodSourceCode:function(startPosition){
			// summary: Extract the sourcecode of a method.
			
			// >>> // Get the sourcecode from this method, eat our own dog food.
			// >>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser._base"); fp.load();
			// >>> d = fp.getMethodData(["_extractMethodSourceCode"])._extractMethodSourceCode.sourceCode
			// >>> d.length>0
			// true
			// >>> // Get the sourcecode for "_extractMethodSourceCode".
			// >>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser._base"); fp.load();
			// >>> d = fp.getMethodData(["_extractMethodSourceCode"])._extractMethodSourceCode.sourceCode
			// >>> d.length>0
			// true
			
//FIXXXME needs either a tokenizer or use the lineNumbers from the method inspections
			var lines = this.sourceCode.substr(startPosition).split("\n"),
				openMatches, closeMatches, 
				retLines = "", amountOpenBraces = 0, amountCloseBraces = 0;
			for(var i=0, l=lines.length; i<l; i++){
				retLines += lines[i] + "\n";
				// count the { and }
				openMatches = lines[i].match(/{/g);
				closeMatches = lines[i].match(/}/g)
				amountOpenBraces += openMatches ? openMatches.length : 0;
				amountCloseBraces += closeMatches ? closeMatches.length : 0;
				if(amountOpenBraces == amountCloseBraces && amountOpenBraces > 0){
					return retLines;
				}
			}
			return "";
		},
		
		_extractPropertyData:function(/*String*/name){
			// summary:
			// 		Collect the info (see return data) about the given property.
			// returns: Object
			// 		Structure like this:
			// 		{lineNumber:47 ,fileName:"whatever.js", docString:"multiline string with the doc string"}
			
			// Use _preparePropertyReturnData() to return the proper data.
			throw new Error(this.declaredClass + "._extractPropertyData() not implemented.");
		},
		
		_prepareMethodReturnData:function(name, search, /*int*/startPosition){
			// summary:
			// 		Prepare all the method's data for further processing.
			// name: String
			// 		The method name.
			// search: RegExpResult
			// 		The regexp search result.
			// startPosition: int
			// 		The position in the file that the method starts at.
			
			// Find out the line number by mapping the actual line in this.sourceCode to the real line number,
			// using this.fileInfo.
			// 
			// >>> // Test that dojo.fadeIn's lineNumber form inside its original file is properly found.
			// >>> var fp = new dools.docs.fileParser.Dojo("dojo"); fp.load();
			// >>> var lines = dojo._getText(dojo.moduleUrl("dojo._base", "fx.js")).split("\n"), l = lines.length;
			// >>> for (var i=0; !lines[i].match(/dojo\.fadeIn\s*=\s*function\(/) && i<l-1; i++){};
			// >>> i+1 == fp.getMethodData(["fadeIn"]).fadeIn.lineNumber
			// true
			// 
			// >>> // Make sure we return the proper filename.
			// >>> var fp = new dools.docs.fileParser.Dojo("dojo"); fp.load();
			// >>> dojo.moduleUrl("dojo._base", "fx.js") == fp.getMethodData(["fadeIn"]).fadeIn.fileName
			// true
			// 
			// >>> // Make sure we return the proper filename for dojo.query.
			// >>> var fp = new dools.docs.fileParser.Dojo("dojo"); fp.load();
			// >>> dojo.moduleUrl("dojo._base", "query.js") == fp.getMethodData(["query"]).query.fileName
			// true
			var src = this.sourceCode,
				lineNumber = src.substr(0, search.index).split("\n").length, // The line number inside this.sourceCode.
				f = this.fileInfo;
			for (var i=0, l=this.fileInfo.length; !(f[i].start<lineNumber && f[i].start+f[i].numLines>lineNumber) && i<l; i++){};
			lineNumber -= f[i].start;
			
			ret = {
				lineNumber:lineNumber,
				numLines:0,
				fileName:f[i].file,
				docString:this._extractDocString(startPosition),
				parameters:this._extractMethodParameters(name),
				sourceCode:this._extractMethodSourceCode(startPosition)
			}
			ret.numLines = ret.sourceCode.split("\n").length-1;
			return ret;
		},
		
		_preparePropertyReturnData:function(/*int*/lineNumber, /*String*/docString){
			// summary:
			// 		Calculate the real info for the property after the docString
			// 		had been found.
			
			// >>> // Check that the line number is correct.
			// >>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser._base"); fp.load();
			// >>> fp.getPropertyData(["fileInfo"]).fileInfo.lineNumber>0
			// true
			// 
			// >>> // Check that the line number of "declaredClass" can not be found, since it's in the parent class.
			// >>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo"); fp.load();
			// >>> fp.getPropertyData(["declaredClass"]).declaredClass.lineNumber==-1
			// true
			var f = this.fileInfo;
			// Find the file where the 'lineNumber' is in.
			for (var i=0, l=this.fileInfo.length; i<l && !(f[i].start<lineNumber && f[i].start+f[i].numLines>lineNumber); i++){};
			var ret = {
				lineNumber:i<l ? lineNumber - f[i].start : -1,
				fileName:i<l ? f[i].file : "",
				docString:docString
			};
			return ret;
		}

	}
);
