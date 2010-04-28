dojo.provide("dools.docs.fileParser.tests.JsDoc");

dojo.require("dools.docs.fileParser.JsDoc");
tests.registerDocTests("dools.docs.fileParser.JsDoc");





(function(){
	var d = function(){
		/**
		 * The prop with nix in it.
		 */
		this.prop = "nix";
	};
	
	/**
	 * A JsDoc style comment.
	 *
	 */
	d.query = function(){
		
		
		
	}
})();

tests.register("dools.docs.tests.fileParser.JsDoc", 
	[
		//
		//	getMethodData() tests
		//
		function test_docString(t){
			// summary:
			// 		Verify that we find a docString.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			t.assertEqual("A JsDoc style comment.", fp.getMethodData(["query"]).query.docString.split("\n")[0]);
		},
		function test_lineNumber(t){
			// summary: Verify the line number where the d.query() method
			// 		above is defined.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			t.assertEqual(22, fp.getMethodData(["query"]).query.lineNumber);
		},
		function test_numLines(t){
			// summary: Test that the length of the method is returned properly.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			t.assertEqual(5, fp.getMethodData(["query"]).query.numLines);
		},
		
		//
		//	getPropertyData() tests
		//
		function test_props_all(t){
			// summary:
			// 		Verify that we find the prop and all its data properly.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			var p = fp.getPropertyData(["prop"]).prop;
			var expected = '{"lineNumber":15,"fileName":"../../dools/docs/fileParser/tests/JsDoc.js","docString":"The prop with nix in it."}';
			t.assertEqual(expected, dojo.toJson(p));
		},
	]
);
//*/