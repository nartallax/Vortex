/*
	модуль, предоставляющий асинхронную прокси-функцию для асинхронных функций
	такая функция нужна для ленивого исполнения функций, а также кеширования результата
	ожидается, что в качестве исходной функции будет передано обещание, 
	однако в ином случае умеет оборачивать функцию в обещание самостоятельно
	каждая прокси является обещанием
	не гарантируется старый или новый результат при reset()е в процессе исполнения функции
	
	использование:
	
	var a = proxy(function(){
		console.log('invoked!'); 
		this.readyNext(154); 
	});
	
	a().then(clog); // -> invoked! 154
	a().then(clog); // -> 154
	a().then(clog); // -> 154
	a.reset()().then(clog); // -> invoked! 154
	a().then(clog); // -> 154
*/

var proxy = (function(){
	var proxy = function(prom, timeout){
	
		if(!prom.isPromise) prom = promise(prom);
	
		var result = promise(function(){
			if(result.fetchTime !== 0 && (result.timeout === 0 || timestamp() - result.fetchTime < result.timeout))
				return this.readyNext(result.cachedData);
				
			result.waiters.push(this);
			if(result.executing) return;
			
			var waiters = result.waiters;
			result.executing = true;
			prom.apply(this.context, arguments).then(function(data){
				result.executing = false;
				result.cachedData = data;
				result.fetchTime = timestamp();
				waiters.each(function(waiter){ waiter.readyNext(data); });
				result.waiters = [];
			});
		});
		
		result.reset = reset;
		result.timeout = timeout || 0;
		
		return result.reset();
	}
	
	var reset = function(){
		this.cachedData = undefined;
		this.fetchTime = 0;
		this.waiters = [];
		this.executing = false;
		return this;
	}
	
	return proxy;
	
})();