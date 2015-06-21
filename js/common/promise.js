/* 
	модуль, реализующий объект Обещания
	позволяет неограниченно продолжать цепочки асинхронных (не обязательно) функций, не наращивая при этом лексической вложенности
	функции исполняются в контексте объекта обещания
	на момент исполнения, объект имеет свойство context - это контекст, из которого он был вызван
	это свойство наследуется, т.е. передается от одной функции из цепочки к другой (автоматически)
	вы можете передавать обещанию аргументы при вызове, и они будут переданы функции;
	также вы можете передавать в readyNext аргументы, и они будут переданы следующей функции в цепочке
	
	использование: 
	
	var a = promise(function(){
		console.log("first");
		this.readyNext();
	});
	
	a().then(function(){
		console.log("second");
		this.readyNext();
	}).then(function(){
		console.log("third");
		this.readyNext();
	});
	
	
	var fun = function(prefix){
		if(prefix !== this.context.val) throw prefix + " !== " + this.context.val;
		console.log(this.context.val + ".pro('" + prefix + "')");
		this.readyNext(prefix);
	};

	var a = promise(fun);

	var b = {pro: a, val: "b"};
	var c = {pro: a, val: "c"};

	b.pro('b').then(fun).then(fun);
	c.pro('c').then(fun).then(fun);
	c.pro('c').then(fun).then(fun);
	b.pro('b').then(fun).then(fun);
	c.pro('c').then(fun).then(fun);
	
 */
var promise = (function(){

	var promise = function(callback){
		// важно формировать новое обещание при каждом новом вызове
		// т.к. иначе при одновременном вызове с разными последующими функциями, сохраняется только последняя
		var result = function(){
			var newPromise = promise(result.callback);
			newPromise.context = this;
			newPromise.waitInvoke(arguments, this);
			return newPromise;
		}
		
		result.then = then; // these properties could be placed in prototype
		result.waitInvoke = waitInvoke;
		result.readyNext = readyNext;
		result.toString = toString;
		
		result.callback = callback;
		result.isPromise = true; // just easy way to distinguish promise function
		
		return result;
	}
	
	var then = function(callback) {
		this.after = promise(callback); 
		this.after.context = this.context;
		return this.after;
	}
	var readyNext = function(){
		if(typeof(this.after) !== 'function') return;
		this.after.waitInvoke(arguments);
		this.after = undefined; // one or zero invocations allowed
	}
	var waitInvoke = function(args, context){
		var self = this;
		if(context) self.context = context;
		setTimeout(function(){ 
			if(context) self.context = context;
			self.callback.apply(self, args); 
		}, 1);
	}
	var toString = function(){ return "[promise function]";}

	return promise;
})();
