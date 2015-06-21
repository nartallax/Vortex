/*
	этот модуль позволяет хитро работать с хешем страницы: хранить в нем параметры итд
	через это, например, можно организовать хистори без обновления страницы
*/

var pageHash = (function(){
	
	var listenChange = function(fn){ this.listen("change", fn); }
	var unlistenChange = function(fn){ this.unlisten("change", fn); }
	
	var hashStringToObj = function(str){
		if(str.startsWith('#')) str = str.substr(1);
		return str.split('&').spawn(function(res, part){
			if(part){
				var eqPos = part.indexOf('=');
				if(eqPos > 0 && eqPos + 1 < part.length){
					res[decodeURIComponent(part.substr(0, eqPos))] = decodeURIComponent(part.substr(eqPos + 1));
				} else res[decodeURIComponent(part)] = true;
			}
			return res;
		}, {});
	}
	var objToHashString = function(obj){
		return obj.spawn(function(res, val, key){
			if(!key || val === false) return res;
			if(res.length > 1) res += '&';
			key = encodeURIComponent(key);
			if(val === true) return res + key;
			return res + key + '=' + encodeURIComponent(val);
		}, "#");
	}
	
	var setHashParams = function(obj){ window.location.hash = objToHashString(obj || {}); }
	var getHashParams = function(){ return hashStringToObj(window.location.hash || ''); }
	var setParamVal = function(name, val){
		var params = getHashParams();
		params[name] = val;
		setHashParams(params);
	}
	var getParamVal = function(name){ return getHashParams()[name]; }
	
	addEventListener('hashchange', function(){ pageHash.fire('change', getHashParams()); }, window);
	
	return {
		listenChange: listenChange,
		unlistenChange: unlistenChange,
		getParams: getHashParams,
		setParams: setHashParams,
		getParam: getParamVal,
		setParam: setParamVal
	};
	
})();