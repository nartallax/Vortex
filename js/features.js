/* модуль для проверки возможностей браузера, с пачкой этих самых проверок */
var features = (function(){
	
	var flist = {};
	
	var getAbsentFeatures = function(){
		var result = [], i, hasFeature;
		for(i in flist){
			hasFeature = false;
			try {
				hasFeature = flist[i]();
			} catch(e){
				hasFeature = false;
			}
			if(!hasFeature) result.push(i);
		}
		return result;
	}
	
	var registerFeature = function(name, testFunc){ flist[name] = testFunc; }
	
	return {
		getAbsent: getAbsentFeatures,
		register: registerFeature
	}
})();

/*
	вообще, тут содержатся не только тесты, проверяющие возможности браузера,
	но и тесты на совместимость кода с движком яваскрипта, 
	а также некоторые тесты на общие функции.
	больше - не меньше, так что пусть будут
*/

features.register('typeof-number', 		function(){ return typeof(0) === 'number' && typeof(1.5) === 'number'; });
features.register('typeof-object', 		function(){ return typeof({})==='object'&&typeof(null)==='object'&&typeof([])==='object';});
features.register('typeof-string',		function(){ return typeof('123') === 'string' && typeof('') === 'string'; });
features.register('typeof-boolean',		function(){ return typeof(false) === 'boolean' && typeof(true) === 'boolean'; });
features.register('typeof-function',	function(){ return typeof(function(){}) === 'function'; });
features.register('typeof-undefined',	function(){ return typeof(undefined) === 'undefined'; });

features.register('str-indexof',		function(){ return ("abc").indexOf('b') === 1 && ('abc').indexOf('d') < 0; });
features.register('str-charat',			function(){ return ("abc").charAt(1) === 'b'; });
features.register('str-charcodeat', 	function(){ return ('abc').charCodeAt(1) === 98 });
features.register('str-replace', 		function(){ return ('a1b2c45').replace(/\d/g, '') === 'abc'; });
features.register('str-tolower', 		function(){ return ('aBcDeF').toLowerCase() === 'abcdef'; });
features.register('str-toupper', 		function(){ return ('aBcDeF').toUpperCase() === 'ABCDEF'; });
features.register('str-substr', 		function(){ return ('aBcDeF').substr(3) === "DeF" && ('aBcDeF').substr(3, 2) === "De"; });
features.register('str-substring', 		function(){ return ('aBcDeF').substring(3) === "DeF" && ('aBcDeF').substring(3, 5) === "De"; });

features.register('has-json',			function(){ return bool(JSON); });
features.register('json-arr',			function(){ return JSON.parse('[1,2,3]').length === 3; });
features.register('json-obj',			function(){ return JSON.parse('{"length":3}').length === 3; });

features.register('has-add-event',		function(){ return bool(document.addEventListener) || bool(document.attachEvent); });
features.register('has-remove-event',	function(){ return bool(document.removeEventListener) || bool(document.detachEvent); });
features.register('has-create-event',	function(){ return bool(document.createEvent) || bool(document.createEventObject); });
features.register('has-fire-event',		function(){ return bool(document.dispatchEvent) || bool(document.fireEvent); });

features.register('has-create-tag',		function(){ return bool(document.createElement); });
features.register('has-el-by-id',		function(){ return bool(document.getElementById); });
features.register('has-el-by-tagname',	function(){ return bool(document.getElementsByTagName); });
features.register('has-el-by-class',	function(){ return bool(document.getElementsByClassName); });
features.register('has-tag-attrs',		function(){ return bool(tag().attributes); });
features.register('has-tag-classname',	function(){ return typeof(tag().className) === 'string'; });
features.register('has-query-selector',	function(){ return bool(document.querySelector) && bool(document.querySelectorAll); });
features.register('has-client-rect',	function(){ return bool(document.body.getBoundingClientRect); });
features.register('client-rect-tblr',	function(){
	var rect = document.body.getBoundingClientRect();
	return 	typeof(rect.left) === 'number' && typeof(rect.right) === 'number' && 
			typeof(rect.top) === 'number' && typeof(rect.bottom) === 'number';
});

features.register('has-define-prop', 	function(){ return typeof(Object.defineProperty) === 'function'; });
features.register('clear-obj-proto',	function(){ var o = {}, i; for(i in o) return false; return true; });
features.register('clear-arr-proto',	function(){ var o = [], i; for(i in o) return false; return true; });
features.register('delete-prop-name',	function(){ var o = {}; o.delete = 5; return o.delete === 5; });
features.register('array-is-array',		function(){ return Array.isArray([]) && !Array.isArray({}); });
features.register('array-concat',		function(){ return ([1,3,5]).concat([2,4,6]).equals([1,3,5,2,4,6]); });
features.register('sparse-iteration',	function(){ 
	var a = [1,2,3];
	delete a[1];
	var count = 0;
	for(var i in a) count++;
	return count === 2;
});
features.register('non-enum-prop',		function(){
	var testObj = {};
	addProp(testObj, 'testMethod', function(){ return 153; })
	if(testObj.testMethod() !== 153) return false;
	for(var i in testObj) return false;
	return true;
});
features.register('mutable-prop',		function(){
	var testObj = {};
	addProp(testObj, 'someProp', 12345, true);
	addProp(testObj, 'someProp', 54321, true);
	if(testObj.someProp !== 54321) return false;
	for(var i in testObj) return false;
	return true;
});
features.register('object-hash-equals',	function(){
	var a = {number: 100500, bool: false, str: "abcdef", arr:[1,6,9,0]};
	var b = {str: "abcdef", number: 100500, arr:[1,6,9,0], bool: false};
	
	return a.hash() === b.hash();
});
features.register('array-hash-unequals',function(){
	var a = [{num: 1},{num: 2},{num: 3},{num: 4}];
	var b = [{num: 4},{num: 3},{num: 2},{num: 1}];
	
	return a.hash() !== b.hash();
});
features.register('object-equals',		function(){
	var a = {number: 100500, bool: false, str: "abcdef", arr:[1,6,9,0]};
	var b = {str: "abcdef", number: 100500, arr:[1,6,9,0], bool: false};
	
	return a.equals(b);
});
features.register('array-unequals',		function(){
	var a = [{num: 1},{num: 2},{num: 3},{num: 4}];
	var b = [{num: 4},{num: 3},{num: 2},{num: 1}];
	
	return !a.equals(b);
});

features.register('func-args-list',		function(){
	var func = function(){return arguments.length;}
	return func(5,7,"test") === 3 && func() === 0 && func([1,3,4]) === 1;
});
features.register('func-call-apply', 	function(){
	var func = function(){return arguments.length;}
	return func.call(this, [1,3,4]) === 1 && func.call(this) === 0 && func.apply(this, [1,3,4]) === 3;
});
features.register('html-ent-parser',	function(){ return parseHtmlEntities("&lt;&gt;&amp;&quot;&copy;&reg;") === '<>&"©®'; });
features.register('operator-mod',		function(){ return ((-1%5)===-1) && ((-9%5)===-4) && ((4%5)===4) && ((9%5)===4); });
features.register('parseint',			function(){ return parseInt('0xdeadbeef') === 0xdeadbeef && parseInt('-54') === -54; });
features.register('has-xhr',			function(){ return conjure.isPossible(); });
features.register('could-parse-html',	function(){ return parseHtml('<div><p></p></div><a></a>').length === 2; });
features.register('parse-html-script',	function(){ 
	parseHtml('<script type="text/javascript">throw "injected";<\/script>');
	return true;
});
//features.register('packer',				function(){ return packer.test() });
features.register('utf8-en',			function(){
	var source = "Brown fox jumped over lasy dog.";
	return String.fromUTF8Array(source.toUTF8Array()) === source;
});
features.register('utf8-ru',			function(){
	var source = "Сорок тысяч обезьян! Щачло! ёЁъЪиИйЙ";
	return String.fromUTF8Array(source.toUTF8Array()) === source;
});
features.register('utf8-jp',			function(){
	var source = "スラッシュドット・ジャパン -- アレゲなニュースと雑談サイト";
	return String.fromUTF8Array(source.toUTF8Array()) === source;
});