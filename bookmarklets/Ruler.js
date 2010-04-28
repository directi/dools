(function(){
	if(!window['dojo'] || !window['dools'] || !window['dools_ruler']){
		var dojoTag = document.createElement('script');
		dojoTag.setAttribute('type', 'text/javascript');
		dojoTag.setAttribute('djConfig', 'parseOnLoad:true');
		dojoTag.setAttribute('src', '_testRuler.js');
		
		dojoTag.onload = function(){
			window['dools_ruler'] = new dools.widget.Ruler();
		};
		
		dojoTag.onreadystatechange = function(){
			/loaded|complete/.test(script.readyState) && (window['dools_ruler'] = new dools.widget.Ruler());
		};

		document.body.appendChild(dojoTag);
		
		var styleTag = document.createElement('style');
		styleTag.setAttribute('type', 'text/css');
		styleTag.innerHTML = '@import \'../resources/Widget.css\';	@import \'../resources/Ruler.css\'; body{background: #aaa;}';
		document.body.appendChild(styleTag);
	} else {
		window['dools_ruler'].toggle();
	}
})();
