widget.list.tabGroup = (function(){

	var init = function(source){
		this.appendChild(this._tabWrap = tag("p","white-space:pre"));
		this.appendChild(this._bodyWrap = tag("div"));
		this.tabs = {};
		
		var i = source.children.length, active, isActive, tabName, raw;
		while(i--){
			raw = source.children[i];
			tabName = raw.getAttribute("data-name");
			createTab.call(this, source.children[i], {
				title: raw.getAttribute("data-title"), 
				name: tabName
			});
			if(!active || raw.getAttribute("data-default-active") === "true") active = tabName;
		}
		checkTabsVisibility.call(this);
		if(active) activateTab.call(this, active);
	}
	
	var createTab = function(contentTag, args){
		var name = args.name || '';
		tabHeader = generateTabMarkup.call(this, contentTag, args.title, name);
		if(this._tabWrap.firstChild) this._tabWrap.insertBefore(tabHeader, this._tabWrap.firstChild);
		else this._tabWrap.appendChild(tabHeader);
		this._bodyWrap.appendChild(contentTag);
		this.tabs[name] = {header: tabHeader, body: contentTag};
		checkTabsVisibility.call(this);
		return this;
	}
	
	var removeTab = function(tabName){
		var desc = this.tabs[tabName];
		desc.header.parentNode.removeChild(desc.header);
		desc.body.parentNode.removeChild(desc.body);
		delete this.tabs[tabName];
		checkTabsVisibility.call(this);
	}
	
	var activateTab = function(tabName){
		var active = this.activeTabName, params = widget.paramsOf(this), tab = this.tabs[tabName];
		if(active && active !== tabName && (active = this.tabs[active])){
			removeClass(active.header, params["active-tab-header-class"]);
			removeClass(active.body, params["active-tab-body-class"]);
			addClass(active.header, params["unactive-tab-header-class"]);
			addClass(active.body, params["unactive-tab-body-class"]);
		}
		removeClass(tab.header, params["unactive-tab-header-class"]);
		removeClass(tab.body, params["unactive-tab-body-class"]);
		addClass(tab.header, params["active-tab-header-class"]);
		addClass(tab.body, params["active-tab-body-class"]);
		
		this.activeTabName = tabName;
		this.fire('switch');
	}
	
	var onTabClick = function(){ activateTab.call(widget.ofTag(this), this.getAttribute('data-tab-name')); return false; }
	
	var generateTabMarkup = function(raw, tabText, name){
		var params = widget.paramsOf(this);
		var result = tag("div", raw.getAttribute('data-header-style') || '', params["tab-header-class"] + " " + params["unactive-tab-header-class"], tabText || "");
		addClass(raw, params["tab-body-class"]);
		addClass(raw, params["unactive-tab-body-class"]);
		result.onclick = onTabClick;
		result.setAttribute("data-hidden", raw.style.display === "none"? "true": "false");
		result.setAttribute("data-tab-name", name);
		raw.style.display = "";
		return result;
	}
	
	var checkTabsVisibility = function(){
		var i = this._tabWrap.children.length, tab;
		while(i--){
			tab = this._tabWrap.children[i];
			if(tab.getAttribute("data-hidden") !== "true") {
				this._tabWrap.style.display = "block";
				this._tabWrap.style.visibility = "visible";
				return;
			};
		}
		this._tabWrap.style.display = "none";
		this._tabWrap.style.visibility = "hidden";
	}
	
	
	var hideTab = function(tabName){
		this.tabs[tabName].header.setAttribute("data-hidden", "true");
		checkTabsVisibility.call(this);
	}
	
	var showTab = function(tabName){
		this.tabs[tabName].header.setAttribute("data-hidden", "false");
		checkTabsVisibility.call(this);
	}
	
	return {
		init: init,
		className: "tab-group",
		base: "genericWidget",
		methods: {
			showTab: function(tabName){ showTab.call(this, tabName); return this; },
			hideTab: function(tabName){ hideTab.call(this, tabName); return this; },
			haveTab: function(tabName){ return bool(this.tabs[tabName]); },
			activate: function(tabName){ activateTab.call(this, tabName); return this; },
			addTab: function(tag, args){ createTab.call(this, tag, args); return this; },
			removeTab: function(tabName){ removeTab.call(this, tabName); return this; },
			clearTabs: function(){ var self = this; this.tabs.each(function(v,k){ self.removeTab(k); }); return this; },
			isActive: function(tabName){ return this.activeTabName === tabName; },
			isShown: function(tabName){ return this.tabs[tabName].header.getAttribute('data-hidden') === 'false'; },
			getActiveTabName: function(){ return this.activeTabName; },
		},
		parameters: {
			"tab-header-class": "tab-header",
			"active-tab-header-class": "active",
			"unactive-tab-header-class": "unactive",
			"tab-body-class": "tab-body",
			"active-tab-body-class": "active",
			"unactive-tab-body-class": "unactive"
		}
	}
})();