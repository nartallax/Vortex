/*
	объект, описывающий в общем виде кеш обращений к серверу
	изначально ничего не кеширует; для кеширования нужно явно указать серверные функции
	требование к функции вызова сервера: 
		это должно быть обещание, 
		первым аргументом которого является строковое имя серверной функции
*/
var serverCache = (function(){

	var serverCache = function(callServer){
		
		var result = function(){
			var args = arguments;
			if(args.length < 1 || !args[0]) throw "Could not call server: function name is not supplied.";
			return (result.cacheables[args[0]] || callServer).apply(this, args);
		}
		
		result.callServer = callServer;
		result.cacheables = {};
		
		result.setCacheable = setCacheable;
		result.reset = resetCache;
		
		return result;
	}
	
	var setCacheable = function(funcName, timeout){ this.cacheables[funcName] = proxy(this.callServer, timeout || 0); }
	var resetCache = function(){ this.cacheables.each(function(v){ v.reset(); }); }
	var resetFunction = function(funcName){ this.cacheables[funcName].reset(); }
	
	return serverCache;
	
})();