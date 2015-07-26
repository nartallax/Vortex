/*
	структура данных, сущность. управляет синхронизацией с сервером
	после каждого завершенного действия с данными кидает событие change
	...но подписываться напрямую на это событие не надо, т.к. его обрабатывает класс db
	если вы будете его обрабатывать, то иногда будете попадать на старые данные, а иногда - на новые
	лучше подпишитесь на событие dataUpdated, которое вызывается на этом же entity 
	 - его кидает db после того, как должным образом обновит все данные
*/
var entity = (function(){
	
	
	var entity = function(serverCache, pkey){
		if(!(this instanceof entity)) return new entity(serverCache, pkey);
		
		this.cache = serverCache;
		this.pkey = pkey;
	}
	
	entity.prototype.registerFetch = function(promise){ this.fetchPromise = promise; return this; }
	entity.prototype.registerUpdate = function(promise){ this.updatePromise = promise; return this; }
	entity.prototype.registerDelete = function(promise){ this.deletePromise = promise; return this; }
	entity.prototype.registerCreate = function(promise){ this.createPromise = promise; return this; } // assuming returned pkey
	entity.prototype.registerSet = function(promise){ this.setPromise = promise; return this; }
	entity.prototype.registerArgUpdate = function(promise){ this.argUpdatePromise = promise; return this; }
	
	// retuns promise with all the entities fetched
	entity.prototype.fetch = function(){ 
		if(!this.fetchPromise) throw "Could not fetch entity without fetch function!";
		return this.fetchPromise.apply(this, arguments)
				.then(reindex)
				.then(function(data){
					this.context.fireChange(data, 'fetch'); 
					this.readyNext(data); 
				});
	}
	// returns promise with array of keys of entities that was deleted
	entity.prototype.delete = function(arg){
		if(!this.pkey) throw "Could not delete entity without pkey!";
		if(!this.deletePromise) throw "Could not delete entity without delete function!";
		var pkey = this.pkey;
		
		if(!Array.isArray(arg)) arg = [arg];
			
		var self = this,
			resultPromise = promise(nop).call(this),
			deleteWaiter = new waiter(1, function(){ self.fireChange(keys, 'delete'); resultPromise.readyNext(keys); }),
			tickDeleteWaiter = function(){ deleteWaiter.tick(); },
			keys = arg.map(function(arg){
				var key;
				if(typeof(arg) !== 'object') key = arg;
				else {
					key = arg[pkey];
					var type = typeof(key);
					if(type === 'undefined' || type === 'object' || type === 'function')
						throw "Could not delete entity with absent or composite key!";
				}
				
				deleteWaiter.untick();
				self.deletePromise(key).then(tickDeleteWaiter);
				
				return key;
			});
			
		tickDeleteWaiter();
		
		return resultPromise;
	}
	// returns promise with assoc array {id => new ent, id => new ent}; entities have ids as well
	entity.prototype.create = function(arg){
		if(!this.pkey) throw "Could not create entity without pkey!";
		if(!this.createPromise) throw "Could not create entity without create function!";
		var pkey = this.pkey;
		
		if(!Array.isArray(arg)) arg = [arg];
			
		var self = this,
			resultPromise = promise(nop).call(this),
			createWaiter = new waiter(1, function(){ self.fireChange(ents, 'create'); resultPromise.readyNext(ents); }),
			ents = {};
		arg.each(function(ent){
			createWaiter.untick();
			if(typeof(ent) !== 'object') throw "Could not create non-composite entity!"
			self.createPromise(ent).then(function(key){
				ent[pkey] = key;
				ents[key] = ent;
				createWaiter.tick();
			});
		});
			
		createWaiter.tick();
		
		return resultPromise;
	}
	// returns promise with assoc array {id => updated ent, id => updated ent}
	entity.prototype.update = function(arg){
		if(!this.pkey) throw "Could not update entity without pkey!";
		if(!this.updatePromise) throw "Could not update entity without update function!";
		var pkey = this.pkey;
		
		if(!Array.isArray(arg)) arg = [arg];
		var self = this,
			resultPromise = promise(nop).call(this),
			updateWaiter = new waiter(1, function(){ 
				self.fireChange(ents, 'update'); 
				resultPromise.readyNext(ents); 
			}), ents = {};
			
		arg.each(function(ent){
			updateWaiter.untick();
			if(typeof(ent) !== 'object') throw "Could not update non-composite entity!"
			var type = typeof(ent[pkey]);
			if(type === 'undefined' || type === 'object' || type === 'function')
				throw "Could not update entity with absent or composite key!";
			self.updatePromise(ent).then(function(){
				ents[ent[pkey]] = ent;
				updateWaiter.tick();
			});
		});
		
		updateWaiter.tick();
		
		return resultPromise;
	}
	// returns array of all the entities (if there is no pkey) or assoc array of entities (if there is)
	entity.prototype.set = function(arg){
		if(!this.setPromise) throw "Could not set entity without update function!";
		var pkey = this.pkey;
		
		if(!Array.isArray(arg)) arg = arg.toArr();
		var self = this, ents = arg;
		arg.each(function(ent){ if(typeof(ent) !== 'object') throw "Could not set non-composite entity!"; });
		
		return this.setPromise(arg).then(reindex).then(function(data){
			self.fireChange(data, 'set');
			this.readyNext(data);
		});
	}
	/* returns {args: args, values: values}
		предполагается, что при вызове этой функции сущности на сервере, указанные в args поля которой равны указанным в args значениям,
		в поля, указанные в values, будет проставлены значения, указанные в values
		такая сущность может быть не одна
	*/
	entity.prototype.argUpdate = function(args, values){
		if(!this.argUpdatePromise) throw "Could not argupdate entity without update function!";
		
		var self = this;
		
		return this.argUpdatePromise(args, values).then(function(){	
			var data = {args: args, values: values};
			self.fireChange(data, 'argupdate');
			this.readyNext(data);
		});
	}
	
	entity.prototype.fireChange = function(data, type){ this.fire('change', {type: type, data: data, entity: this}); }
	var reindex = function(data){ this.readyNext(this.context.pkey? data.reindex(this.context.pkey): data); }
	
	return entity;
	
})();

/*

var delp = promise(function(arg){ clog('deleting by' + arg); this.readyNext(arg); });
var cache = serverCache(promise(nop));
var ent = entity(cache, 'id');
ent.registerDelete(delp);
ent.delete(5).then(clog);
ent.delete([6, 10]).then(clog);
ent.delete({id:7}).then(clog);
ent.delete([{id:8},{id:9}]).then(clog);

*/