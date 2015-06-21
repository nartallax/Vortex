var widget = (function(){

	// constants: tag attribute names
	var tagAttrName = "data-widget-name";
	var tagAttrParamStart = "data-widget-param-";
	
	// method wrappers manipulation
	var methodId = 1;
	var methodWrappers = {};
	var createMethodWrapper = function(method){ return function(){ return method.apply(this, arguments); } }
	var getMethodWrapper = function(method){
		if(!method.id) method.id = methodId++;
		return methodWrappers[method.id] || (methodWrappers[method.id] = createMethodWrapper(method)); 
	}
	
	// parametrisation functions
	var extractParams = function(tag){
		var ats = attrs(tag), res = {};
		for(var i in ats)
			if(i.startsWith(tagAttrParamStart) && i.length > tagAttrParamStart.length)
				res[i.substring(tagAttrParamStart.length)] = ats[i];
		return res;
	}
	var getWidgetParams = function(wrapper){
		return (wrapper.widget.parameters.cloneDeep() || {}).populate(extractParams(wrapper));
	}
	
	// tag manipulations 
	var replaceTag = function(tag, wrapper){ tag.parentNode.insertBefore(wrapper, tag); tag.parentNode.removeChild(tag); return wrapper; }
	var getWrapper = function(tag){
		var attr, result = document.createElement("div"), i = -1;
		while(attr = tag.attributes[++i]){
			if(attr.name === "class" || attr.name === "style" || attr.name === tagAttrName) continue;
			result.setAttribute(attr.name, attr.value);
		}
		if(tag.style.cssText) result.style.cssText = tag.style.cssText;
		if(tag.className) result.className = tag.className;
		return result;
	}
	var parentWidget = function(tag){
		while(tag && tag.nodeName.toUpperCase() !== "BODY" && !tag.widget) tag = tag.parentNode;
		return (tag && tag.nodeName.toUpperCase() !== "BODY")? tag: undefined;
	}
	
	// widget from tag creation functions
	var populateWrapper = function(wrapper, tag, target){
		if(target.base){
			var base = widget.list[target.base];
			if(!base) throw "Unknown base widget name: \"" + target.base + "\".";
			wrapper = populateWrapper(wrapper, tag, base);
		}
		target.init.call(wrapper, tag);
		if(target.className) addClass(wrapper, target.className)
		for(var methodName in target.methods) wrapper[methodName] = getMethodWrapper(target.methods[methodName]);
		return wrapper;
	}
	
	var initWidget = function(tag){
		var wrapper = getWrapper(tag), target, name;
		if(!(name = tag.getAttribute(tagAttrName)) || !(target = widget.list[name])) throw "Unknown widget: \"" + name + "\".";
		wrapper.widget = target;
		return populateWrapper(wrapper, tag, target);
	}
	
	// result
	widget = function(tag){
		if(!tag) tag = document.body;
		var i = -1, tagList = tag.querySelectorAll("*[" + tagAttrName + "]"), widgetTag;
		while(widgetTag = tagList[++i]) replaceTag(widgetTag, initWidget(widgetTag));
		return tag.getAttribute(tagAttrName)? tag.parentNode? replaceTag(tag, initWidget(tag)): initWidget(tag): tag;
	}

	widget.list = {};
	widget.paramsOf = getWidgetParams;
	widget.ofTag = parentWidget;
	
	return widget;
	
})();