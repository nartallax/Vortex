/*
	класс, обобщающий общение с базой данных. все данные хранятся в нем (описания сущностей, кстати, тоже).
	нужен для того, чтобы на изменение этих данных можно было подписаться
	при изменении данных у соответствующей сущности вызывается событие dataUpdated
*/

var database = (function(){

	var db = function(serverCache){
		if(!(this instanceof db)) return new db(serverCache);
		
		this.cache = serverCache;
		this.onChange = getChangeHandler(this);
		this.ents = {}; // описания сущностей
		this.data = {}; // данные из базы, соответствующие описаниям
		this.user = {}; // данные о пользователе; автоматически не назначаются
		this.misc = {}; // всякая остальная фигня; автоматически не назначаются
		this.role = '';
	}
	
	var onChange = function(data, type, ent){
		switch(type){
			case 'set':
				this.data[ent.name] = data;
				break;
			case 'argupdate':
				var vals = data.values, i;
				this.getMatchedRows(ent.name, data.args).each(function(ent){
					for(i in vals) ent[i] = vals[i];
				});
				break;
			default:
				if(ent.pkey){
					switch(type){
						case 'fetch':
						case 'create':
						case 'update':
							this.data[ent.name].populate(data);
							break;
						case 'delete':
							var oldData = this.data[ent.name];
							data.each(function(val){
								delete oldData[val];
							});
							break;
						case 'set':
							
						case 'argupdate':
							break;
						default: throw "Unknown change type: " + type;
					}
				} else {
					switch(type){
						case 'fetch':
							var updateHashOf = function(o){o.updateHashNumber();}

							/*
								немного хитрой логики кластеризации данных
								здесь, нам нужно склеить одинаковые сущности 
								(подразумевается, что двух абсолютно одинаковых сущностей в базе не бывает;
								т.е такие сущности считаются одной сущностью)
								для этой склейки мы сравниваем каждые сущности сначала по хешу, а затем - через equals.
								не встречающиеся в старых данных сущности - подмешиваем в них
								
								сортировать перед склейкой нужно потому, что хеш (и метод equals) учитывают порядок
								следования элементов в массивах, а мы считаем, что он нам не важен
							*/
							oldData = this.data[ent.name].cloneDeep().hashSortRecursive().each(updateHashOf).reindex('hashNumber');
							newData = data.hashSortRecursive().each(updateHashOf).reindex('hashNumber');
							newArr = [];
							newData.each(function(v,k){
								if(oldData[k] && oldData[k].equals(v)) return;
								newArr.push(v)
							});
							this.data[ent.name] = oldData.toArr().concat(newArr);
							
							break;
						case 'create': throw "Could not create data without pkey!";
						case 'update': throw "Could not update data without pkey!";
						case 'delete': throw "Could not delete data without pkey!";
						default: throw "Unknown change type: " + type;
					}
				}
				break;
		}
		
		// it's LAGGY even on intermediate amounts of data
		// of course, sometimes it's better be sorted, but now I have no explicit need of it
		//this.data[ent.name].hashSortRecursive();
		
		ent.fire('dataUpdated');
	}
	
	var getChangeHandler = function(db){ return function(arg){ return onChange.call(db, arg.data.data, arg.data.type, arg.data.entity);} }
	
	db.prototype.getMatchedRows = function(entName, args){
		var args = data.args, i;
		return this.data[entName].toAssoc().fl(function(ent){
			for(i in args) 
				if(ent[i] !== args[i])
					return false;
			return true;
		});
	}
	
	db.prototype.defineEntity = function(name, pkey, roles){ 
		var ent = new entity(this.cache, pkey); 
		ent.listen('change', this.onChange);
		ent.name = name;
		this.ents[name] = ent;
		this.data[name] = {};
		
		ent.roles = roles || [];
		
		return ent;
	}
	
	db.prototype.getRole = function(){ return this.role; }
	db.prototype.setRole = function(role){
		if(this.role === role) return;
		
		this.role = role;
		this.cache.reset();
		
		this.ents.each(function(ent){ 
			if(!ent.roles.hasVal(role)) return;
			ent.fetch();
		});
		
		this.fire('roleChanged');
	}
	
	return db;

})();