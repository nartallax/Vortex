/*
	шаблонизатор
	штука, которая принимает на вход шаблон (произвольную html-разметку с плейсхолдерами),
	позволяет заменить эти плейсхолдеры на еще какие-либо значения,
	после чего обрабатывает виджеты и подшаблоны в шаблоне и выдает его как набор dom-объектов
	
	плейсхолдер: {{placeholderName}} (или {{placeholderName:raw}}, если текст должен быть вставлен ровно таким, какой он есть)
	ссылка на шаблон из разметки: [[my_template]]
	в такие ссылки можно передавать данные через ссылающийся шаблон: достаточно передать в шаблон объект вида
		{... my_template:{ ... passed_data ... } ...}
		
	var t = template.register('myTemplate', '<div>{{ greeting }}</div><div>{{ greeting:raw }}</div><div data-widget-name="deletableItemList" id="test-widget"></div>[[ mySecondTemplate ]]').populate({greeting:'<a>hi man</a>', mySecondTemplate:{message:'alarm!'}});
	template.register('mySecondTemplate', '<u>{{message}}</u>').bind({message:'pew-pew-pew'});
	document.body.appendChild(t.toTag());
	
*/
var template = (function(){
	var template = function(text){
		if(!(this instanceof template)) return new template(text);
		this.shards = breakTemplateText(text || '');
	}
	
	var breakTemplateText = function(text){ return text.split(/(\{\{.+?\}\}|\[\[.+?\]\])/).map(rawShardMapper); }
	var rawShardMapper = function(shard){ // функция, делающая из строкового представления шарда шард-объект
		if(shard.startsWith('{{') && shard.endsWith('}}')){
			var name = shard.substring(2, shard.length - 2).trim();
			if(name.length === 0) return {data:shard};
			name = name.split(':');
			var raw = false;
			if(name.length > 1 && name[1].trim() === 'raw') raw = true;
			return {data:'', name: name[0].trim(), raw: raw};
		} else if(shard.startsWith('[[') && shard.endsWith(']]')) {
			var name = shard.substring(2, shard.length - 2).trim();
			return {template: name};
		} else return {data: shard};
		
	}
	var bindDataToShard = function(data, shard){
		if(shard.name && typeof(data[shard.name]) !== 'undefined'){
			shard.data = shard.raw? 
							(data[shard.name]).toString(): 
							escapeHtmlEntities((data[shard.name]).toString());
		} else if(shard.template && typeof(data[shard.template]) !== 'undefined'){
			shard.data = data[shard.template];
		}
		return shard;
	}
	
	// привязка к данным: возвращает новый шаблон на базе старого
	template.prototype.populate = function(data){
		var result = new template();
		result.shards = this.shards.map(function(shard){
			return bindDataToShard(data, shard.cloneFacile());
		});
		return result;
	}
	// привязка к данным: модифицирует исходный шаблон
	template.prototype.bind = function(data){
		this.shards.each(bindDataToShard.curry(data));
	}
	template.prototype.getMarkup = function(){
		var markup = '';
		this.shards.each(function(shard){ 
			if(!shard.template) return markup += shard.data;
			if(!template.list[shard.template]) 
				throw 'Have no template with name "' + shard.template + '": could not expand template link.';
			return markup += template.list[shard.template].populate(shard.data || {}).getMarkup();
		});
		return markup;
	}
	template.prototype.toTag = function(){
		var tags = parseHtml(this.getMarkup()), result;
		if(tags.length > 1){
			result = tag('span');
			tags.each(function(tag){ result.appendChild(tag); });
		} else result = tags[0];
		return widget(result);
	}
	
	template.list = {};
	template.register = function(name, text, data){
		if(template.list[name]) throw 'Could not register template "' + name + '": there is template with same name.';
		return template.list[name] = new template(text).bind(data || {});
	}
	template.get = function(id){ return template.list[id]; }
	
	return template;
})();