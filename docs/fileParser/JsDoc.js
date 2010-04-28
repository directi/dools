dojo.provide("dools.docs.fileParser.JsDoc");

dojo.require("dools.docs.fileParser._base");

dojo.declare(
	"dools.docs.fileParser.JsDoc",
	dools.docs.fileParser._base,
	{
		getClassDocString:function(){
			return "TODO";
		},
		
		_extractDocString:function(startPosition){
			// summary:
			// 		Extract the docstring only. Which means all lines before
			// 		the line "startPosition" that are inside /** and */.
			
			// Lets trim the sourcecode so we remove empty lines, and the
			// last line should be the end of our docString comment.
			var lines = dojo.trim(this.sourceCode.substr(0, startPosition)).split("\n");
			lines.reverse();
			if (dojo.trim(lines[0])!="*/"){
				return "";
			}
			return this._getComment(lines);
		},
		
		_extractPropertyData:function(/*String*/name){
			// summary:
			// 		Extract the properties data.
			// description:
			// 		We know that the docs preceeds the property declaration
			// 		so we assume this here and extract all the preceeding lines
			// 		that start with a "//".
			
			// Case 1, the simple dojo default case: "property:..."
			var regex = new RegExp("\\*\\/\\n\\s*this\\." + name + "\\s*=[\\s\\S]+");
			var lines = this.sourceCode.replace(regex, "").split("\n").reverse();
			var docString = this._getComment(lines);
			// "lines.length" is the line number inside this.sourceCode.
			return this._preparePropertyReturnData(lines.length+1, docString);
		},
		
		_getComment:function(lines){
			// summary:
			//		Get the pure comment string.
			// lines: Array
			// 		The lines in reverse order where we will extract the comment
			// 		from.
			
			var commentStart = 0;
			var endFound = dojo.some(lines, function(line, index){
				commentStart = index;
				return dojo.trim(line)=="/**";
			});
			if (!endFound){
				return "";
			}
			var commentsOnly = dojo.map(lines.slice(1, commentStart).reverse(), 'return item.replace(/\\s*\\*\\s*/, "")');
			return commentsOnly.join("\n")
		}
	}
);