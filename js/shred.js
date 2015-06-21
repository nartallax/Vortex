/*
	модуль управления шредами
	
	подразумевается, что:
	шред - кусок приложения, разметки; каждый шред определяет внешний вид какой-либо части приложения
	фактически, все шреды вместе составляют внешний вид этого самого приложения
	
	шред состоит из методов, разметки и функции получения родительской для этого шреда ноды
	подразумевается, что разметка вызывает методы этого шреда и только их (но это не контролируется)
	
	define({name:str, requirements:[string], methods:{name:function}, init:function(tag), markup:string, priority:number = 0})
	приоритет: чем больше это число, тем раньше относительно остальных шредов будет инициализирован этот шред
		(приоритет важен только в том случае, когда несколько шредов инициализируются одновременно; 
		такое может случиться только в том случае, если у них был в зависимостях один и тот же шред)
	вызов метода шреда из разметки: shreds.myShred.myMethod()
*/
var shreds = {};
var shred = (function(){
	
	var notInvokedShreds = {}, shred = {};
	
	shred.define = function(args){
		if(!args.name) throw 'No shred name specified (attribute "name").';
		var result = {markup: args.markup, methods: args.methods, init: args.init, name: args.name, priority: args.priority || 0};
		if(!Array.isArray(args.requirements) || args.requirements.length === 0) {
			result.reqCount = -1;
			result.reqs = {};
		}
		else {
			result.reqCount = args.requirements.length;
			result.reqs = args.requirements.toReverseAssoc(true);
		}
		notInvokedShreds[args.name] = result;
	}
	
	var invokeShred = function(v){ shred.invoke(v.name); }
	shred.invoke = function(name){	
		if(notInvokedShreds[name] === null) throw 'Shred "' + name + '" was already invoked. No duplicate invocation is allowed.';
		if(!notInvokedShreds[name]) throw "No such shred: \"" + name + '". Could not invoke.';
		
		shreds[name] = notInvokedShreds[name].methods;
		notInvokedShreds[name].init(new template(notInvokedShreds[name].markup).toTag());
		notInvokedShreds[name] = null;
		
		invokeList = [];
		notInvokedShreds.each(function(shred){
			if(!shred) return;
			if(shred.reqs[name]){
				delete shred.reqs[name];
				shred.reqCount--;
				if(shred.reqCount === 0) 
					invokeList.push(shred);
			}
		});
		invokeList.sort(compareByFieldFunction('priority', true)).each(invokeShred);
	}
	
	return shred;
	
})();