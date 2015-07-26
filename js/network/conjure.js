/* 
	conjure - функция вызова сервера через XHR
	функции обработки ошибок: 
		defaultOnFail - назначаемое свойство; эта функция вызывается при ошибке http-статуса
		defaultPreprocessor - назначаемое свойство, функция, передающаяся в обещание;
			эта функция вызывается каждый раз после успешного завершения запроса, но до передачи данных в колбек
*/
var conjure = (function(){
	
	var getXHR = function(){ return new XMLHttpRequest(); }
	
	var debugOutputLimit = 1280 * 2;
	
	var sendRequestPromise = undefined;
	var defineSendRequestPromise = function(){
		sendRequestPromise = promise(function(apiFunctionName, data, onFail){
		
			data = JSON.stringify(data);
			var request = getXHR(),
				self = this,
				
				listener = function(){
					if(request.readyState !== 4) return; // запрос не завершился, пока
					sendRequest.fire('end', {name: apiFunctionName, data: data, status: request.status});
					if(parseInt(request.status) !== 200) return onFail.call(request, apiFunctionName, data);
					var resultData, logged = false;
					try {
						resultData = JSON.parse(request.responseText);
					} catch(e){ // пришла хрень (возможно, серверный стектрейс?)
						
						console.log(apiFunctionName + ' >> ' + this.responseText.substr(0, debugOutputLimit));
						console.log('request data: ' + data);
						/*
						logged = true;
						*/
						resultData = JSON.parse(request.responseText.match(/^(.*?)[\n\r]/)[1]);
					}
					/*
					if(!logged) console.log(apiFunctionName + ' >> ' + resultData.status + ' ' + this.responseText.length);
					*/
					
					self.readyNext(resultData);
				};
				
			request.onreadystatechange = listener;
			request.open('POST', './backend.php?f=' + apiFunctionName, true);
			request.send(data);
			sendRequest.fire('start', {name: apiFunctionName, data: data});
			
			/*
			console.log(apiFunctionName + ' << ' + data.length);
			*/
		});
	}
	var sendRequest = function(apiFunctionName, data, callback, onFail){
		if(!sendRequestPromise) defineSendRequestPromise(); // поздняя инициализация, строго после объекта promise
	
		if(typeof(data) === 'function'){
			onFail = callback;
			callback = data;
			data = {};
		} 
		
		if(!data) data = {};
		if(!onFail) onFail = sendRequest.defaultOnFail;
		if(!callback) return sendRequestPromise.call(this, apiFunctionName, data, onFail).then(sendRequest.defaultPreprocessor);
		
		return sendRequestPromise.call(this, apiFunctionName, data, onFail).then(sendRequest.defaultPreprocessor).then(callback);
	}
	
	sendRequest.isPossible = function(){ return bool(getXHR()); }
	sendRequest.defaultOnFail = function(apiName, data){
		console.log(apiName + " >> Unexpected response code! (not 200 OK).");
	}
	sendRequest.defaultPreprocessor = function(data){ this.readyNext(data); }
	
	sendRequest.isPromise = true; // функция ведет себя как обещание => можно считать обещанием
	
	return sendRequest;
	
})();