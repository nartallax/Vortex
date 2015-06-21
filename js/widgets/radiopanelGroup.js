widget.list.radiopanelGroup = (function(){

	var init = function(source){
		var i = source.children.length, len = i, rawPanel, panel;
		while(i--){
			rawPanel = source.children[i];
			panel = panelFromRaw.call(this, rawPanel);
			if(i === len - 1) this.appendChild(panel);
			else this.insertBefore(panel, this.firstChild);
		}
		if(this.firstChild) enablePanel.call(this, this.firstChild);
	}
	
	var onRadiobuttonChange = function(){
		if(this.checked)
			enablePanel.call(widget.ofTag(this), this.parentNode.parentNode);
		return true;
		//return false;
	}
	var onBlockerClick = function(){
		enablePanel.call(widget.ofTag(this), this.parentNode);
	}
	
	var panelFromRaw = function(raw){
		var params = widget.paramsOf(this);
		var result = tag("div", null, params["unactive-panel-class"]);
		var input = tag("input", {type:"radio"});
		var wrap = tag("div", null, params["radiobutton-wrapper-class"]);
		var blocker = tag("div", null, params["blocker-class"]);
		blocker.onclick = onBlockerClick;
		addClass(raw, params["content-class"]);
		input.checked = false;
		input.onchange = onRadiobuttonChange;
		wrap.appendChild(input);
		result.appendChild(wrap);
		result.appendChild(raw);
		result.appendChild(blocker);
		return result;
	}
	
	var getContentPanel = function(panel){
		return panel.children[1];
	}
	
	var getActivePanel = function(){
		var i = this.children.length, panel, params = widget.paramsOf(this);
		while(i--){
			panel = this.children[i];
			if(hasClass(panel, params["active-panel-class"])) return panel;
		}
		return undefined;
	}
	var enablePanel = function(panel){
		var params = widget.paramsOf(this), active = getActivePanel.call(this);
		removeClass(panel, params["unactive-panel-class"]);
		addClass(panel, params["active-panel-class"]);
		if(!panel.firstChild.firstChild.checked)
			panel.firstChild.firstChild.checked = true;
		if(!active) return;
		removeClass(active, params["active-panel-class"]);
		addClass(active, params["unactive-panel-class"]);
		active.firstChild.firstChild.checked = false;
	}
	
	return {
		init: init,
		className: "radiopanel-group",
		base: "genericWidget",
		methods: {
			getActivePanel: function(){ return getContentPanel(getActivePanel.call(this)); }
		},
		parameters: {
			"active-panel-class": "active",
			"unactive-panel-class": "unactive",
			"blocker-class": "blocker",
			"radiobutton-wrapper-class": "radiobutton-wrapper",
			"content-class": "content"
		}
	}
})();