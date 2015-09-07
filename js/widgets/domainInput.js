widget.list.domainInput = (function(){
	
	// event listeners. applied to inner tags
	var onKeyPress = function(e){ 
		e = e || window.event;
		var self = this.parentNode;
		if(e.keyCode === 40) { moveSelectionDown.call(self); return false; } // arrow down
		if(e.keyCode === 38) { moveSelectionUp.call(self); return false; } // arrow up
		if(e.keyCode === 13) { takeSelectedValue.call(self); return false; } // enter
		waitUpdate.call(self);
		return true;
	}
	var onTextInputFocus = function(e){ updateDropdownEntries.call(widget.ofTag(this)); }
	var onOptionMouseOver = function(e){ this.setAttribute("selected", "selected"); return false; }
	var onOptionMouseDown = function(e){ setValue.call(this.parentNode.parentNode, this.value); /*return false;*/ }
	var onTextInputBlur = function(e) {
		var self = this.parentNode;
		takeSelectedValue.call(self);
		stopWaitUpdate.call(self);
		hideDropdown.call(self);
		return false; 
	}
	
	// markup generation
	var init = function(){
		this._data = {};
		this._value = undefined;
		
		this.appendChild(this._textInput = tag("input", {type:"text"}));
		this.appendChild(this._dropdown = tag("select", "display:none;z-index:1", {size:"0"}));
		
		this._textInput.onkeydown = onKeyPress;
		this._textInput.onblur = onTextInputBlur;
		this._textInput.onfocus = onTextInputFocus;
	}
	var setDropdownEntries = function(values){
		var opt, params = widget.paramsOf(this);
		values = values.first(parseInt(params["showed-entries-number"]));
		clearTag(this._dropdown);
		if(values.isEmpty()){
			opt = tag("option", null, null, params["no-result-string"], {value:""});
			opt.emptyOption = true;
			this._dropdown.appendChild(opt);
			this._dropdown.setAttribute("size", "1");
		} else {
			var count = 0;
			for(var i in values){
				i = values[i];
				opt = tag("option", null, null, i.text, {value:i.key});
				opt.onmouseover = onOptionMouseOver;
				opt.onmousedown = onOptionMouseDown;
				if(count++ === 0) opt.setAttribute("selected", "selected");
				this._dropdown.appendChild(opt);
			}
			this._dropdown.setAttribute("size", count);
		}
	}
	
	// markup ruling function
	var hideDropdown = function(){ this._dropdown.style.display = "none"; }
	var showDropdown = function(){ this._dropdown.style.display = "block"; }
	
	var moveSelectionUp = function(){
		var tag = getSelectedOption.call(this);
		if(tag && tag.previousSibling)
			tag.previousSibling.selected = true;
	}
	var moveSelectionDown = function(){
		var tag = getSelectedOption.call(this);
		if(tag && tag.nextSibling)
			tag.nextSibling.selected = true;
	}
	
	var takeSelectedValue = function(){
		var tag = getSelectedOption.call(this);
		setValue.call(this, (tag && !tag.emptyOption)? tag.value: undefined);
		hideDropdown.call(this);
	}
	var updateDropdownEntries = function(){ 
		var params = widget.paramsOf(this);
		setDropdownEntries.call(this, getRelatedEntries.call(this, this._textInput.value, params['matching-mode']));
		showDropdown.call(this);
	}
	
	// update scheduling functions
	var waitUpdate = function(){
		if(this._updateHandle) return;
		var self = this;
		var input = this._textInput, val = input.value;
		this._updateIterations = 20;
		this._updateHandle = setInterval(function(){
			if(!(self._updateIterations--) || input.value != val)
				stopWaitUpdate.call(self);
			if(input.value != val)
				updateDropdownEntries.call(self);
		}, 50);
	}
	var stopWaitUpdate = function(){
		if(this._updateHandle){
			clearInterval(this._updateHandle);
			this._updateHandle = undefined;
		}
	}
	
	// data management functions
	var setValue = function(val){
		this._textInput.value = val? this._data[this._dropdown.value = this._value = val]: ""; 
		fireEvent(createEvent('change'), this);
	}
	var getSelectedOption = function(){ return this._dropdown.options[this._dropdown.selectedIndex]; }
		
	var getRelatedEntries = function(text, matchingMode){
		var result = {}, data = this._data.spawn(function(res, v, k){
			if(Array.isArray(v)) v.each(function(v){ res.push({text:v, key:k}) });
			else res.push({text:v, key:k});
			return res;
		}, []);
		text = text.toLowerCase();
		switch(matchingMode){
			case 'starts-with':	return data.fl(function(e){ return e.text.toLowerCase().indexOf(text) === 0});
			case 'contains': 	return data.fl(function(e){return e.text.toLowerCase().indexOf(text) >= 0});
			default: throw 'Unknown matching mode: "' + matchingMode + '".';
		}
	}
	
	// result
	return {
		init: init,
		className: "domain-input",
		base: "genericWidget",
		methods: {
			data: function(arg){
				if(arguments.length > 0){
					this._data = arg;
					setValue.call(this, undefined);
					return this;
				} else return this._data;
			},
			value: function(arg){
				if(arguments.length > 0){
					setValue.call(this, arg);
					return this;
				} else return this._value;
			},
			listenChange: function(listener){
				addListener('change', listener, this);
			},
			unlistenChange: function(listener){
				removeListener('change', listener, this);
			}
		},
		parameters: {
			"no-result-string": "нет вариантов",
			"showed-entries-number": "7",
			'matching-mode':'starts-with'
		}
	}
	
})();