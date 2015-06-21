// функция, используемая для определения новой функции в прототипе; единственно верный метод модификации прототипа
// (имеет более широкое применение, но писалась именно для этого)
var addProp = function(obj, name, val, mutable, iterable){
	Object.defineProperty(obj, name.toString(), {
		configurable: mutable || false,
		enumerable: iterable || false,
		writable: mutable || false,
		
		value: val
	});
}

// simple math
var min, max, toBetween, abs, pow, between;
(function(){
	min = function(a,b){return a > b? b: a;}
	max = function(a,b){return a > b? a: b;}
	toBetween = function(v, low, hi){ return v < low? low: v > hi? hi: v; }
	abs = function(a){return a >= 0? a: -a;}
	pow = function(a, b){ var res = 1; while(b-->0) res *= a; return res; }
})();

// string methods
(function(){
	addProp(String.prototype, 'shortenWord', function(){ 
		var res = this.match(/^.{3}.*?(?=[eyuioaиыеэаяоёую])/);
		return (res? res[0]: this) + '';
	});
	addProp(String.prototype, 'shorten', function(){ 
		return this
			.replace(/(^|\s)[a-zа-яё]+\.*/g, ' ')
			.replace(/[a-zA-Zа-яА-ЯёЁ]+/g, function(s){ 
				var word = s.shortenWord();
				return word === s? s: word + '. ';
			})
			.replace(/(\s*,\s*)+/g, ', ')
			.replace(/(\s*,?\s*\.\s*,?\s*)+/g, '. ')
			.replace(/\s\s+/g, ' ')
			.replace(/(^[\s,.]+|[\s,]+$)/g, '');
	});
	addProp(String.prototype, 'trim', function(){ return this.replace(/(^\s+|\s+$)/g, ''); });
	addProp(String.prototype, 'startsWith', function(val){ return this.indexOf(val) === 0; });
	addProp(String.prototype, 'endsWith', function(val){ return this.indexOf(val) === this.length - val.length; });
	addProp(String.prototype, 'capitalize', function(){ return this? this.charAt(0).toUpperCase() + this.substr(1): this; });
	addProp(String.prototype, 'reverse', function(){ var res = '', l = this.length; while(l--) res += this.charAt(l); return res; });
	addProp(String.prototype, 'toUTF8Array', function(){ 
		var utf8 = [], i = -1, len = this.length, code;
		while(++i < len) {
			var code = this.charCodeAt(i);
			if (code < 0x80) 
				utf8.push(code);
			else if (code < 0x800) 
				utf8.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
			else if (code < 0xd800 || code >= 0xe000)
				utf8.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
			else
				// let's keep things simple and only handle chars up to U+FFFF...
				utf8.push(0xef, 0xbf, 0xbd); // U+FFFE "replacement character"
		}
		return utf8;
	});
	String.fromUTF8Array = function(arr){
		var result = '', i = 0, len = arr.length, code;
		while(i < len){
			code = arr[i]
			if(code < 0x80) i += 1;
			else if((code & 0xe0) === 0xc0){
				code = ((code & 0x1f) << 6) | (arr[i+1] & 0x3f);
				i += 2;
			} else if((code & 0xe0) === 0xe0){
				code = ((code & 0x1f) << 12) | ((arr[i+1] & 0x7f) << 6) | (arr[i+2] & 0x7f);
				i += 3;
			} else {
				code = 0xfffe;
				i += 3;
			}
			result += String.fromCharCode(code);
		}
		return result;
	}
})();

// функции манипуляции массивами, ассоциативными и индексными
// некоторая часть этих функций делает очень похожие вещи;
// разделять такие функции на разные следует из-за разного смысла, который они несут
(function(){
	addProp(Object.prototype,	'isEmpty', 	function()		{ for(var i in this) return false; return true; });
	addProp(Object.prototype,	'size', 	function()		{ var res = 0; for(var i in this) res++; return res; });
	addProp(Object.prototype,	'hasVal', 	function(val)	{ for(var i in this) if(this[i] === val) return true; return false; });
	addProp(Object.prototype,	'contains',	Object.prototype.hasVal); // alias
	addProp(Object.prototype,	'keyOf', 	function(val)	{ for(var i in this) if(this[i] === val) return i; return undefined; });
	addProp(Object.prototype,	'keysAssoc',function()		{ var res = {}, i; for(i in this) res[i] = true; return res; });
	addProp(Object.prototype,	'populate',	function(obj)	{ for(var i in obj) this[i]=obj[i]; return this; });
	addProp(Object.prototype,	'toArr',	function()		{ var res = [], i; for(i in this) res.push(this[i]); return res; });
	addProp(Object.prototype,	'toAssoc',	function()		{ return this.cloneFacile(); });
	addProp(Object.prototype,	'toReverseAssoc', function(val){ 
		var res = {};
		if(arguments.length > 0){
			for(var i in this)
				res[this[i]] = val;
		} else {
			for(var i in this)
				res[this[i]] = i;
		}
		return res;
	});
	addProp(Object.prototype,	'first',	function(count)	{ 
		if(arguments.length === 0){
			for(var i in this) return this[i]; 
			return undefined; 
		}
		count = count || 0;
		var result = {};
		for(var i in this){
			if(--count<0) break;
			result[i] = this[i];
		}
		return result;
	});
	addProp(Object.prototype,	'last',	function(count)	{ 
		if(arguments.length === 0){
			var val = undefined;
			for(var i in this) val = this[i]; 
			return val; 
		}
		count = count || 0;
		var result = {}, size = this.size(), passed = -1;
		for(var i in this){
			if((size - ++passed) <= count)
				result[i] = this[i];
		}
		return result;
	});
	addProp(Object.prototype,	'pop',		function()		{ 
		var res, i; 
		for(i in this) { 
			res = this[i]; 
			delete this[i]; 
			return res;
		} 
		return undefined; 
	});
	addProp(Object.prototype,	'reindex',	function(attr)	{
		attr = attr || 'id';
		var result = {}, i;
		for(i in this)
			result[this[i][attr]] = this[i];
		return result;
	});
	addProp(Object.prototype,	'divide',	function(fn)	{
		var result = {}, i, val;
		for(i in this){
			val = fn(this[i], i);
			if(!result[val]) result[val] = {};
			result[val][i] = this[i];
		}
		return result;
	});
	addProp(Object.prototype,	'divideBy',	function(attr)	{
		var result = {}, i, val;
		for(i in this){
			val = this[i][attr];
			if(!result[val]) result[val] = {};
			result[val][i] = this[i];
		}
		return result;
	});
	addProp(Object.prototype,	'flatten',	function()	{
		var i, j, result = [];
		for(i in this)
			for(j in this[i])
				result.push(this[i][j]);
		return result;
	});
	
	addProp(Object.prototype,	'each',		function(fn)	{ for(var i in this) fn.call(this, this[i], i); return this; });
	addProp(Object.prototype,	'fl',		function(fn)	{ var res = {}, i; for(i in this)if(fn(this[i],i))res[i]=this[i];return res;});
	addProp(Object.prototype,	'fleq', 	function(v)		{ var r={},i;for(i in this)if(this[i] === v)r[i] = this[i];return r;});
	addProp(Object.prototype,	'flneq', 	function(v)		{ var r={},i;for(i in this)if(this[i] !== v)r[i] = this[i];return r;});
	addProp(Object.prototype,	'flfield',	function(k, v)	{ var r={},i;for(i in this)if(this[i][k] === v)r[i] = this[i];return r;});
	addProp(Object.prototype,	'flfieldneq',function(k, v)	{ var r={},i;for(i in this)if(this[i][k] !== v)r[i] = this[i];return r;});
	addProp(Object.prototype,	'map', 		function(fn)	{ var r = {}, i; for(i in this) r[i] = fn(this[i], i); return r; });
	addProp(Object.prototype,	'spawn',	function(fn, start){ 
		for(var i in this)
			start = fn.call(this, start, this[i], i);
		return start;
	});
	addProp(Object.prototype,	'uniq',		function(){ 
		var result = {}, hashes = {}, hash, hlist;
		for(var i in this){
			if(!this[i]){
				if(hashes[this[i]]) continue;
				hashes[this[i]] = true;
				result[i] = this[i];
				continue;
			}
			hash = this[i].hash();
			if(!(hlist = hashes[hash])){
				hashes[hash] = [this[i]];
				result[i] = this[i];
				continue;
			} 
			
			var haveRepeat = false;
			for(var j in hlist) if(hlist[j].equals(this[i])) {
				haveRepeat = true;
				break;
			}
			
			if(haveRepeat) continue;
			
			hlist.push(this[i]);
			result[i] = this[i];
		}
		return result;
	});

	addProp(Array.prototype,	'add',		function(d)		{ this.push(d); return this; }); // like push, but returns 'this'
	addProp(Array.prototype,	'addAll',	function(d)		{ for(var i in d) this.push(d[i]); return this; });
	addProp(Array.prototype, 	'each',		function(fn)	{ for(var i in this) fn.call(this, this[i], parseInt(i)); return this; });
	addProp(Array.prototype,	'fl', 		function(fn)	{ var r=[],i,t=this;for(i in t)if(fn(t[i],parseInt(i)))r.push(t[i]);return r;});
	addProp(Array.prototype,	'fleq', 	function(v)		{ var r=[],i;for(i in this)if(this[i] === v)r.push(this[i]);return r;});
	addProp(Array.prototype,	'flneq', 	function(v)		{ var r=[],i;for(i in this)if(this[i] !== v)r.push(this[i]);return r;});
	addProp(Array.prototype,	'flfield',	function(k, v)	{ var r=[],i;for(i in this)if(this[i][k] === v)r.push(this[i]);return r;});
	addProp(Array.prototype,	'flfieldneq',function(k, v)	{ var r=[],i;for(i in this)if(this[i][k] !== v)r.push(this[i]);return r;});
	addProp(Array.prototype,	'map', 		function(fn)	{ var r=[], i; for(i in this) r[i] = (fn(this[i], parseInt(i))); return r; });
	addProp(Array.prototype,	'divide',	function(fn)	{
		var result = {}, i, val;
		for(i in this){
			val = fn(this[i], i);
			if(!result[val]) result[val] = [];
			result[val].push(this[i]);
		}
		return result;
	});
	addProp(Array.prototype,	'divideBy',	function(attr)	{
		var result = {}, i, val;
		for(i in this){
			val = this[i][attr];
			if(!result[val]) result[val] = [];
			result[val].push(this[i]);
		}
		return result;
	});
	addProp(Array.prototype, 	'toReverseAssoc',function(val){
		var res = {}, i = -1, l = this.length;
		if(arguments.length > 0) 
			while(++i < l) res[this[i]] = val;
		else 
			while(++i < l) res[this[i]] = i;
		return res;
	});
	addProp(Array.prototype, 	'toAssoc',	function()		{
		var res = {}, i = -1, l = this.length;
		while(++i < l) res[i] = this[i];
		return res;
	});
	addProp(Array.prototype,	'first',	function(count)	{ 
		if(arguments.length === 0){
			for(var i in this) return this[i]; 
			return undefined; 
		}
		count = count || 0;
		var result = [];
		for(var i in this){
			if(--count<0) break;
			result.push(this[i]);
		}
		return result;
	});
	addProp(Array.prototype, 	'uniq',		function()		{
		var result = [], hashes = {}, hash, hlist;
		for(var i in this){
			if(!this[i]){
				if(hashes[this[i]]) continue;
				hashes[this[i]] = true;
				result.push(this[i]);
				continue;
			}
			hash = this[i].hash();
			if(!(hlist = hashes[hash])){
				hashes[hash] = [this[i]];
				result.push(this[i]);
				continue;
			} 
			
			var haveRepeat = false;
			for(var j in hlist) if(hlist[j].equals(this[i])) {
				haveRepeat = true;
				break;
			}
			
			if(haveRepeat) continue;
			
			hlist.push(this[i]);
			result.push(this[i]);
		}
		return result;
	});
	
	var hashCompare = function(a, b){ 
		if(a === null || a === undefined) return (b === null || b === undefined)? 0: -1;
		if(b === null || b === undefined) return 1;
		a = a.hash();
		b = b.hash()
		return 	a > b? 1: a < b? -1: 0;
	}
	
	/*
		сортирует все индексные массивы, содержащихся внутри этого объекта 
		(и текущий объект, если он - индексный массив), 
		по возрастанию хеша
	*/
	addProp(Object.prototype, 'hashSort', function(){
		if(Array.isArray(this) && this.length > 1) this.sort(hashCompare);
		return this;
	});
	addProp(Object.prototype, 'hashSortRecursive', function(){
		for(var i in this)
			if(this[i] && typeof(this[i]) === 'object')
				this[i].hashSortRecursive();
		return this.hashSort();
	});
})();

// class manipulations
var addClass, removeClass, hasClass;
(function(){
	addClass = function(node, cls){ if(!hasClass(node, cls)) node.className += ' ' + cls; }
	removeClass = function(node, cls){ node.className = (' ' + node.className + ' ').replace(' ' + cls + ' ', ' ').replace('   ',' '); }
	hasClass = function(node, cls) { return (' ' + node.className + ' ').indexOf(' ' + cls + ' ') > -1; }
})();
	
// markup manipulations
var tag, el, nodeParent, elsByClass, clearTag, attrs, replaceTag;
(function(){
	tag = function(tagName, style, cls, textContent, etc){ // style, cls and textContent could be omitted
		if(style && typeof(style) === "object"){
			etc = style;
			style = undefined;
		} else if(cls && typeof(cls) === "object") {
			etc = cls;
			cls = undefined;
		} else if(textContent && typeof(textContent) === "object") {
			etc = textContent;
			textContent = undefined;
		}
		var result = document.createElement(tagName);
		if(style) result.style.cssText = style;
		if(cls) result.className = cls;
		if(textContent) result.textContent = textContent;
		if(etc)
			for(var key in etc)
				result.setAttribute(key, etc[key]);
		return result;
	}
	el = function(id){return document.getElementById(id); }
	nodeParent = function(node, parentType){
		if(!parentType) return node.parentNode;
		parentType = parentType.toLowerCase();
		while(node && node.tagName.toLowerCase() !== parentType) node = node.parentNode;
		return node;
	}
	elsByClass = document.getElementsByClassName?
		function(cls, node) {return (node || document).getElementsByClassName(cls).clarr();}:
		function(cls, node) {
			var list = (node || document).getElementsByTagName('*');
			var result = [], i,j;
			for(i = 0; i < list.length; i++)
				if(list[i].className.search('\\b' + classNameString + '\\b') !== -1)
					result.push(list[i]);
			return result;
		}
	replaceTag = function(oldTag, newTag){
		var parent = oldTag.parentNode, sibling = oldTag.nextSibling;
		if(!parent) throw 'No parent node: could not replace tag.';
		parent.removeChild(oldTag);
		if(sibling) parent.insertBefore(newTag, sibling);
		else parent.appendChild(newTag);
		return oldTag;
	}
	clearTag = function(tag){while(tag.children[0]) tag.removeChild(tag.children[0]);}
	attrs = function(tag){
		var res = {}, i = tag.attributes.length, attr;
		while(i--){
			attr = tag.attributes[i];
			if(attr.specified)
				res[attr.name] = attr.value;
		}
		return res;
	}
})();

// events
var addListener, removeListener, createEvent, fireEvent, pauseEvent;
(function(){
	addListener = document.addEventListener?
		function(eName, listener, node) { (node || document).addEventListener(eName, listener, false);		}:
		function(eName, listener, node) { (node || document).attachEvent("on" + eName, listener);			};
	removeListener = document.removeEventListener?
		function(eName, listener, node) { (node || document).removeEventListener(eName, listener, false);	}:
		function(eName, listener, node) { (node || document).detachEvent('on' + eName, listener);			};
	createEvent = document.createEvent?
		function(name) {
			var res = document.createEvent('HTMLEvents');
			res.initEvent(name, true, true);
			return res;
		}:
		function(name){
			var res = document.createEventObject();
			res.eventType = name;
			return res;
		};
	fireEvent = document.dispatchEvent?
		function(eObj, node) { (node || document).dispatchEvent(eObj); 						}:
		function(eObj, node) { (node || document).fireEvent('on' + eObj.eventType, eObj); 	};
	pauseEvent = function(e){
		if(e.stopPropagation) e.stopPropagation();
		if(e.preventDefault) e.preventDefault();
		e.cancelBubble = true;
		e.returnValue = false;
		return false;
	}
})();

// custom events for non-dom objects
(function(){
	addProp(Object.prototype, 'listen', function(eName, listener) {
		if(!this.eventObject) addProp(this, 'eventObject', tag('p','display:none'));
		
		addListener(eName, listener, this.eventObject);
	});
	addProp(Object.prototype, 'unlisten', function(eName, listener) {
		if(!this.eventObject) return;
		removeListener(eName, listener, this.eventObject);
	});
	addProp(Object.prototype, 'fire', function(eName, data) {
		if(!this.eventObject) return;
		if(!data) data = {};
		
		var evt = createEvent(eName);
		evt.data = data;
		fireEvent(evt, this.eventObject);
	});
})();

// hashing
(function(){
	addProp(Number.prototype, 'hash', function(){ return this; });
	addProp(Boolean.prototype, 'hash', function(){ return this? 0xdeadbeef: 0; });
	addProp(Function.prototype, 'hash', function(){ return this.toString().hash(); });
	addProp(String.prototype, 'hash', function(){
		var hash = 0, i = this.length;
		while(i-->0) hash = (((hash << 5) - hash) + this.charCodeAt(i)) | 0;
		return hash;
	});
	addProp(Object.prototype, 'hash', function(){ 
		var result = 0, i, k, v;
		for(i in this){
			k = i? i.hash(): 0;
			v = this[i]? this[i].hash(): 0;
			result += (k + v + (k * v)) | 0;
		}
		return result;
	});
	// функция для пре-просчета хеша
	addProp(Object.prototype, 'updateHashNumber', function(){ addProp(this, 'hashNumber', this.hash(), true); });
})();

// equals
var equals;
(function(){
	
	var recursiveEquals = function(self, other){
		var keys = {}, i;
		for(i in self) {
			if(self[i] !== other[i] && (self[i] === null || self[i] === undefined || !self[i].equals(other[i]))) 
				return false;
			keys[i] = true;
		}
		for(i in other)
			if(!keys[i] || self[i] !== other[i] && (self[i] === null || self[i] === undefined || !self[i].equals(other[i])))
				return false;
		return true;
	}
	
	addProp(Number.prototype, 'equals', function(other){ return this + 0 === other });
	addProp(Boolean.prototype, 'equals', function(other){ return (this?true:false) === other });
	addProp(Function.prototype, 'equals', function(other){ return this === other; });
	addProp(String.prototype, 'equals', function(other){ return this + '' === other; });
	addProp(Array.prototype, 'equals', function(other){ 
		return bool(other && (this === other || (this.length === other.length && recursiveEquals(this, other))));
	});
	addProp(Object.prototype, 'equals', function(other){ 
		return bool(other && (this === other || recursiveEquals(this, other)));
	});
	
	equals = function(a, b){ return a === b? true: (a !== null && a !== undefined)? a.equals(b): false; }
	
})();

// cloning
(function(){
	// клонирование любой массивоподобной структуры
	addProp(Object.prototype,	'clarr', 	function()		{ for(var i = this.length, res = []; i--;) res[i] = this[i]; return res; });
	
	var simpleClone = function(){ return this; }
	var getDeepClone = function(val){
		var type = typeof(val);
		return 	type === 'number' || 
				type === 'boolean' || 
				type === 'string' || 
				type === 'function' || 
				val === undefined || 
				val === null?
					val:
					val.cloneDeep();
	}
	
	// поверхностное клонирование
	addProp(Array.prototype, 'cloneFacile', function(){
		var i = this.length, res = [];
		while(i--) res[i] = this[i];
		return res;
	});
	addProp(Object.prototype, 'cloneFacile', function(){
		var i, res = {};
		for(i in this) res[i] = this[i];
		return res;
	});
	
	// глубокое клонирование
	addProp(Function.prototype, 'cloneDeep', function(){ return this; /* cannot clone function */ });
	addProp(Array.prototype, 'cloneDeep', function(){
		var i = this.length, res = [];
		while(i--) res[i] = getDeepClone(this[i]);
		return res;
	});
	addProp(Object.prototype, 'cloneDeep', function(){
		var i, res = {};
		for(i in this) res[i] = getDeepClone(this[i]);
		return res;
	});
})();

// misc functions
var clog, bool, formatFileSize, formatProportion, waitInputUpdate, 
	nop, timestamp, parseHtmlEntities, escapeHtmlEntities, parseHtml,
	compareByFieldFunction, compareNumbers, setCaretPosition, getCaretPosition;
(function(){
	clog = function(e){ console.log(e); }
	bool = function(v){ return v? true: false };
	nop = function(){};
	timestamp = function(){ return new Date().getTime(); }
	var kb = 1024, mb = kb * 1024, gb = mb * 1024;
	formatFileSize = function(bytes){
		if(bytes < kb) return bytes + 'б';
		if(bytes < mb) return ((~~((bytes/kb)*100))/100) + 'кб';
		if(bytes < gb) return ((~~((bytes/mb)*100))/100) + 'мб';
		else return ((~~((bytes/gb)*100))/100) + 'гб';
	}
	formatProportion = function(num){
		switch(num){
			case 0.5: return "половина";
			case 0.25: return "четверть";
			case 0.75: return "три четверти";
			default:
				if(num >= 0.33 && num < 0.34) return "треть";
				if(num > 0.66 && num <= 0.67) return "две трети";
				return (~~(num * 100)) + "%";
		}
	}
	waitInputUpdate = function(input, onUpdate){

		var iterations = 21, val = input.value, iter = function(){
			if((--iterations) === 0 || input.value !== val) return onUpdate.call(input);
			setTimeout(iter, 50);
		};
		
		iter();
	}
	parseHtmlEntities = (function(){
		var textarea = document.createElement('textarea');
		return function(input){
			textarea.innerHTML = input;
			return textarea.innerHTML.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
		}
	})();
	escapeHtmlEntities = (function(){
		var textarea = document.createElement('textarea');
		return function(html) {
			textarea.innerHTML = html;
			return textarea.innerHTML;
		}
	})();
	parseHtml = function(html){
		var root = document.implementation.createHTMLDocument('dummy document').body;
		root.innerHTML = html;
		return root.children.clarr();
	}
	compareNumbers = function(a, b){ return a > b? 1: a < b? -1: 0 }
	compareByFieldFunction = function(fieldName, reverse){
		reverse = reverse? -1: 1;
		return function(a, b){ return a[fieldName] > b[fieldName]? reverse: a[fieldName] < b[fieldName]? -reverse: 0 }
	}
	
	addProp(Function.prototype, 'curry', function(){
		var bindedArgs = arguments.clarr(), baseFunc = this;
		return function(){ return baseFunc.apply(this, bindedArgs.concat(arguments.clarr())); }
	});
	
	addProp(Function.prototype, 'bind', function(context){
		var source = this;
		var result = function(){ return source.call(context, arguments); }
		result.bind = function(context){ return source.bind(context); }
		return result;
	});
	
	setCaretPosition = function(input, pos){
		if(input.createTextRange) {
            var range = input.createTextRange();
            range.move('character', pos);
            range.select();
        } else if(input.selectionStart) {
			input.focus();
			input.setSelectionRange(pos, pos);
		} else input.focus();
	}
	
	getCaretPosition = function(input){
		var result = 0;

		if (document.selection) {
			input.focus();
			var sel = document.selection.createRange();
			sel.moveStart('character', -input.value.length);
			result = sel.text.length;
		}

		else if (typeof(input.selectionStart) === 'number')
			result = input.selectionStart;

		return parseInt(result);
	}
	
})();

var cookie = {};
(function(){
	cookie.get = function(name){
		if(!name.match(/^[\da-zA-Z_]+$/)) throw 'Incorrect cookie name: "' + name + '".';
		var matches = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
		return matches ? decodeURIComponent(matches[1]) : undefined;
	}
	cookie.set = function(name, val){
		if(!name.match(/^[\da-zA-Z_]+$/)) throw 'Incorrect cookie name: "' + name + '".';
		val = encodeURIComponent(val);
		var updatedCookie = name + "=" + val + '; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
		document.cookie = updatedCookie;
		return this;
	}
	cookie.delete = function(name){
		if(!name.match(/^[\da-zA-Z_]+$/)) throw 'Incorrect cookie name: "' + name + '".';
		document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
		return this;
	}
})();