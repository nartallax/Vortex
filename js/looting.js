/* в этом файле собраны функции-обертки вокруг сбора*/
var looting = (function(){
	
	var sessionId = undefined;
	var shardsBuffer = [];
	var result = undefined;
	
	var descriptions = [];
	var failedDescriptors = [];
	var descriptorIndex = undefined;
	
	var paused = undefined;
	/*
		это все нужно немного переписать
		добавить взаимодействие с клиентским кешем базы даных, например
	*/
	
	var setDescriptors = function(desc){
		descriptions = desc;
		descriptorIndex = -1;
	}
	
	var setDescriptorsFromString = function(str){
		var descs = str.split('|'), i = -1;
		while(descs.length < ++i)
			descs[i] = decodeURI(descs[i]);
		setDescriptors(descs);
		shardsBuffer = [];
	}
	
	var getNextDescriptor = function(){
		return descriptions[++descriptorIndex];
	}

	var unprocessedDescriptorsToString = function(){
		var encoded = [], i = descriptorIndex;
		while(descriptions.length > ++i)
			encoded.push(encodeURI(descriptions[i]));
		i = -1;
		while(failedDescriptors.length > ++i)
			encoded.push(encodeURI(failedDescriptors[i]));
		return encoded.join('|');
	}
	
	var syncWithServer = function(callback){
		conjure('updateLootingSession', {id:sessionId, unprocessed_data:unprocessedDescriptorsToString(), shards:shardsBuffer}, function(resp){
			if(resp.status != 'ok'){
				result.onError("Не удалось отослать данные на сервер: " + errorCodeToString(resp.status));
				callback();
			}
			shardsBuffer = [];
			result.onNotice("Данные отосланы на сервер.");
			callback();
		});
	}
	
	var processRemainingDescriptors = function(){
		var descriptor, processingStart;
		var processResponse = function(resp){
			if(!resp){
				result.onError("Не удалось обработать часть: " + descriptor);
				failedDescriptors.push(descriptor);
			} else {
				result.onNotice("Успешно обработана часть: " + descriptor);
				var i = -1, shard;
				while(shard = resp[++i]){
					shard.source = descriptor;
					shardsBuffer.push(shard);
				}
			}
			
			if((descriptorIndex + 1) % result.syncFreq == 0)
				syncWithServer(balancedLaunchNext);
			else
				balancedLaunchNext();
		}
		
		var balancedLaunchNext = function(){
			processingStart = timestamp() - processingStart;
			if(processingStart < result.timeForDescriptor)
				setTimeout(launchNext, result.timeForDescriptor - processingStart);
			else
				launchNext();
		}
	
		var launchNext = function(){
			if(paused) return result.onNotice("Сбор приостановлен.");
			descriptor = getNextDescriptor()
			if(typeof(descriptor) === "string"){
				processingStart = timestamp();
				miner.lootShards(descriptor, processResponse);
			} else {
				if(failedDescriptors.length > 0){
					setDescriptors(failedDescriptors);
					failedDescriptors = [];
					result.onNotice("Попытка повторно обработать части, обработка которых ранее привела к ошибке...");
					launchNext();
				} else 
					shardsBuffer.length > 0? syncWithServer(result.onFinish): result.onFinish();
			}
		}
		
		paused = false;
		launchNext();
	}
	
	var start = function(){
		miner.getShardsDescription(function(desc){
			if(!desc)
				return result.onFail("Не удалось начать сбор");
			setDescriptors(desc);
			conjure('startLootingSession', {unprocessed_data:unprocessedDescriptorsToString()}, function(resp){
				if(resp.status != 'ok')
					return result.onFail("Не получилось начать сбор: " + errorCodeToString(resp.status));
				sessionId = resp.data;
				result.onStart();
				processRemainingDescriptors();
			});
		});
		
	}
	
	var pauseCurrent = function(){
		result.onNotice("Приостановка сбора...");
		paused = true;
	}
	
	var getSessionData = function(id, callback){
		conjure('getLootingSession', {id:id}, function(r){
			if(r.status !== 'ok') return callback(r.status);
			var parsedShards = [], portion;
			for(var i in r.data.shards){
				portion = miner.parseShard(r.data.shards[i]);
				for(var j in portion)
					parsedShards.push(portion[j]);
			}
			callback(parsedShards);
		});
	}
	
	var continueCurrent = function(){
		result.onNotice("Сбор продолжается.");
		processRemainingDescriptors();
	}
	
	var continueSelected = function(id){
		result.onNotice("Загрузка необработанных данных...");
		conjure('getLootingSessionUnprocessedData', {id:id}, function(resp){
			if(resp.status != 'ok')
				return result.onFail("Не получилось загрузить данные: " + errorCodeToString(resp.status));
			sessionId = id;
			result.onNotice("Данные загружены. Сбор продолжается.");
			setDescriptorsFromString(resp.data);
			processRemainingDescriptors();
		});
	}
	
	result = {
		start:start,
		pauseCurrent:pauseCurrent,
		continueCurrent:continueCurrent,
		continueSelected:continueSelected,
		getSessionData:getSessionData,
		parseSession: function(s){ 
			s = s.cloneDeep();  
			s.shards = s.shards.spawn(function(res, shard){
				miner.parseShard(shard).each(function(r){ res.push(r); })
				return res;
			}, []);
			return s;
		},
		getCurrentSessionId: function(){ return sessionId },
		onError: function(msg){console.log('Error: ' + msg);}, // error == could continue execution
		onFail: function(msg){console.log('Fatal error: ' + msg);}, // fail == could NOT continue execution
		onNotice: function(msg){console.log('Notice: ' + msg);}, // something user have to know
		onStart: function(){console.log('Started successfully!');},
		onFinish: function(){console.log('Finished successfully!');},
		timeForDescriptor: 1000, // expects miner.lootShards to make one or less requests
		syncFreq: 10 // every %syncFreq% processed descriptors data will be sent to server
	};
	return result;
	
})();