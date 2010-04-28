dojo.provide("dools.docs.fileParser.Dojo");

dojo.require("dools.docs.fileParser._base");

dojo.declare(
	"dools.docs.fileParser.Dojo",
	dools.docs.fileParser._base,
	{
		//
		// getMethodData()
		//
		// example:
		// 		>>> // Return an array from this method, if class was instanciated without a method name.
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dojo");
		// 		>>> typeof fp.getMethodData(["isArray"]).isArray
		// 		"object"
		// 		>>> // Instanciated with one method name it only returns those data.
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dojo", "isArray");
		// 		>>> typeof fp.getMethodData().docString
		// 		"string"
		// 		>>> // Even passing a parameter to the method returns only the data for this one method.
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dojo", "isArray");
		// 		>>> typeof fp.getMethodData().docString
		// 		"string"
		
		
		getClassDocString:function(){
			// summary: Extract the docstring for the class.
			
			var src = this.sourceCode,
				moduleNameEscaped = (this.moduleName.replace(/\./g, "\\.")),
				regexps = [
					// Case 1, the standard dojo case, which is a class defined by dojo.declare.
					// e.g.: dojo.declare("dojox.form.Rating",
					new RegExp("dojo\\.declare\\s*\\(\\s*['\"]\\s*" + moduleNameEscaped + "['\"][^{]+{"),
					// Case 2, The simplest object definition.
					// e.g.: dojo.number = {
					new RegExp(moduleNameEscaped + "\\s*=\\s*\\{"),
					// Case 3, "new function(){}" and "function(){}"
					// e.g.: dojo.parser = new function(){
					// e.g.: dojo.cookie = function(/*String*/name, /*String?*/value, /*dojo.__cookieProps?*/props){
					new RegExp(moduleNameEscaped + "\\s*=\\s*(new\\s*)?function\\([^)]*\\)\\s*\\{"),
				];
			// We are executing the regexps after one another, in the hope they
			// are faster, since they fail sooner and the regexp is less complex.
			// Maybe worth profiling.
			for (var i=0, l=regexps.length; i<l; i++){
				matchResult = src.match(regexps[i]);
				if (matchResult!=null){
					// The docstring starts after the matchResult start (.index) and the matched string
					// itself, matchResult[0].length.
					return this._extractDocString(matchResult.index + matchResult[0].length);
				}
			}
// TODO put the cases 2 and 3 into one regex ... maybe
			return "";
		},
		
		_extractDocString:function(startPosition){
			// summary:
			// 		Extract the docstring only. Which means all lines after the "function(){" that start with double slashes.
			
			// Go through the lines, until the "){" was found, which marks the end of the parameters and the
			// start of the function body, where the docstring should be the first thing in.
			var lines = this.sourceCode.substr(startPosition).split("\n"),
				endOfParameterLine = 0;
			//if (startAtLine==undefined){
				dojo.some(lines, function(item, index){ // dojo.some stops when return is true, which is "){" was found, and the index is the line we need. Good stuff :-)
					endOfParameterLine = index;
					return item.match(/\)\s*\{/)!=null;
				});
			//}
			var docString = [];
			for (var i=endOfParameterLine+1, l=lines.length; i<l && lines[i].match(/\s*\/\//)!=null; i++){
				docString.push(lines[i].replace(/\s*\/\//, ""));
			}
			return docString.join("\n");
		},
		
		_extractPropertyData:function(/*String*/name){
			// summary:
			// 		Extract the properties data.
			// description:
			// 		We know that the docs preceeds the property declaration
			// 		so we assume this here and extract all the preceeding lines
			// 		that start with a "//".
			
			// Case 1, the simple dojo default case: "property:..."
			var regex = new RegExp("\\n\\s*" + name + "\\s*:[\\s\\S]+");
			var lines = this.sourceCode.replace(regex, "").split("\n").slice(1).reverse();
			var docString = [];
			for (var i=0, l=lines.length; i<l && lines[i].match(/\s*\/\//)!=null; i++){
				docString.push(lines[i].replace(/\s*\/\//, ""));
			}
			// "lines.length" is the line number inside this.sourceCode.
			return this._preparePropertyReturnData(lines.length, docString.reverse().join("\n"));
		},
		
		_extractMethodParameters:function(name){
			// summary:
			// 		Extract the function parameters.
			
			// Find the end of the method parameters, some like to spread them over multiple lines.
			// E.g. dojo.data.api.Read.getValue()
			var paramsRegex = new RegExp(name + "\\s*[:=]\\s*function\\s*\\(([^)]*)\\)\\s*\\{"),
				ret = [],
				src = this.sourceCode,
				search = src.match(paramsRegex);
			if (search!=null){
				var paramsLine = search[1];
				// Instanciate a "new Function()" using the params we had found and parse the
				// toString() result of it, which has any kind of comments removed :-).
				// Split the result and return it as the param names ... elegant imho, but
				// I hope that some day there is an easier more obvious way :-).
				var paramNames = new Function("anonymous", "var ret = (arguments.callee.toString().match(/function anonymous\\((.*)\\)/)[1]); return ret ? ret.split(',') : [];")();
				//var paramNames = function(paramsLine){}
				if (paramNames.length>0){
					// Parse a parameter string properly, split up the parameter names and the comments, which contain the
					// type information. Parse strings like this: "/*evt, value*/name,id,/*mucho|straing|nada[]? , bla*/ varname ,letzter".
					// (?:...) - this first part finds the optional comment leading a variable name, it must not contain * and / ... which is actually wrong - improve!
					// \w... - is the parameter name itself, which may start with [a-z_] but may continue with numbers in the name too, so \w is not sufficient
					// (?:,|$) - each parameter may end with a comma or is the end of the string itself (here we are actually ignoring that the /**/ kinda comment could also be here).
					var regex = /(?:\/\*([^\*\/]*)\*\/)?\s*(\w[0-9a-zA-Z_]*)\s*(?:,|$)/g;
					dojox.string.tokenize(paramsLine, regex, function(comment, variableName){
						ret.push({name:variableName, datatype:dojo.string.trim(comment || "")});
					});
				}
			}
			return ret;
		}
		
	}
);