/*

var data = db.data.room.flfield('building', 9).map(function(r){ return r.name; });
var input = widget(tag('div', {'data-widget-name':'commaDomainInput'}));
document.body.insertBefore(input,document.body.children[0]);
input.data(data);

*/


widget.list.commaDomainInput = (function(){

	var separator = ', ';

	var init = function(){
		this.appendChild(this.select = tag('select', 'display:none'));
		this.appendChild(this.input = tag('input', {type:'text', value: ''}));
		
		this._data = {};
		this.revdata = {};
		
		this.input.onkeydown = onKeyPress;
		this.input.onblur = onBlur;
		this.input.onfocus = onFocus;
		
		this.params = widget.paramsOf(this);
	}
	
	var onFocus = function(){
		var self = widget.ofTag(this);
		updateSuggest(self);
	}
	
	var onBlur = function(){
		var self = widget.ofTag(this);
		self.input.value = namesToString(self, getRawInputs(self));
		hideSuggest(self);
		self.fire('change');
	}
	
	var namesToString = function(self, names){
		return idsToString(self, names.map(function(item){
			return self.revdata[item]? parseInt(self.revdata[item]): undefined;
		}));
	}
	var idsToString = function(self, ids){
		return ids.spawn(function(res, item){
			var add = self._data[item] || '';
			if(add){
				if(res) res += separator;
				res += add;
			}
			return res;
		}, '');
	}
	var findSuggested = function(self, str){
		if(!str) return self._data.cloneFacile();
		switch(self.params['matching-mode']){
			case 'starts-with': return self._data.fl(function(v){ return v.startsWith(str) });
			case 'contains': return self._data.fl(function(v){ return v.contains(str) });
			default: throw 'Unknown matching mode: "' + self.params['matching-mode'] + '".';
		}
	}
	
	var onKeyPress = function(e){
		e = e || window.event;
		var self = widget.ofTag(this);
		if(e.keyCode === 40) { moveSelectionDown(self); return false; } // arrow down
		if(e.keyCode === 38) { moveSelectionUp(self); return false; } // arrow up
		if(e.keyCode === 13) { takeSelectedValue(self); return false; } // enter
		waitUpdate(self);
		return true;
	}
	
	var getSelectedInputNumber = function(self, inputs){
		var pos = getCaretPosition(self.input), i = 0, res = 0;
		while(res < inputs.length){
			i += inputs[res].length;
			if(i >= pos) return res;
			res += 1;
			i += separator.length;
		}
		return -1;
	}
	var getRawInputs = function(self){
		return self.input.value.split(',').map(function(s){ return s.trim() });
	}
	
	var getSelectedOptionTag = function(self){ return self.select.options[self.select.selectedIndex]; }
	var moveSelectionUp = function(self){
		var opt = getSelectedOptionTag(self);
		if(!opt && self.select.options[0]) self.select.options[0].selected = true;
		if(opt && opt.previousSibling) opt.previousSibling.selected = true;
	}
	var moveSelectionDown = function(self){
		var opt = getSelectedOptionTag(self);
		if(!opt && self.select.options.length > 0) self.select.options[self.select.options.length - 1].selected = true;
		if(opt && opt.nextSibling) opt.nextSibling.selected = true;
	}
	
	var onItemClick = function(){ takeSelectedValue(widget.ofTag(this)) }
	var onItemMouseOver = function(){ widget.ofTag(this).select.value = this.getAttribute('value'); }
	
	var showSuggest = function(self){ self.select.style.display = 'block' }
	var hideSuggest = function(self){ self.select.style.display = 'none' }
	var updateSuggest = function(self){
		var oldVal = parseInt(self.select.value),
			inputs = getRawInputs(self),
			activePartNum = getSelectedInputNumber(self, inputs),
			activePart = inputs[activePartNum],
			suggested;
		
		self.select.innerHTML = '';
		
		if(activePartNum < 0 || typeof(activePart) !== 'string' || (suggested = findSuggested(self, activePart)).isEmpty()){
			self.select.appendChild(tag('option', '', '', self.params['no-result-string']));
			self.select.setAttribute('size', '1');
			return;
		}
		
		var limit = parseInt(self.params['showed-entries-number']);
		(suggested = suggested.first(limit)).each(function(v, k){ 
			var opt = tag('option', '', '', v, {value: k});
			opt.onmouseover = onItemMouseOver;
			opt.onclick = onItemClick;
			self.select.appendChild(opt); 
			if(parseInt(k) === oldVal) self.select.value = oldVal;
		});
		self.select.setAttribute('size', suggested.size());
		showSuggest(self);
	}
	var takeSelectedValue = function(self){
		var inputs = getRawInputs(self),
			activePartNum = getSelectedInputNumber(self, inputs),
			valName = self._data[self.select.value];
			
		if(activePartNum < 0 || !inputs[activePartNum]) inputs.push(valName);
		else inputs[activePartNum] = valName;
		
		self.input.value = namesToString(self, inputs);
		hideSuggest(self);
		
		self.fire('change');
	}
	
	var setData = function(self, data){
		self._data = data;
		self.revdata = data.toReverseAssoc();
	}
	var getData = function(self){ return this._data; }
	
	var waitUpdate = function(self){
		if(self._updateHandle) return;
		var val = self.input.value;
		self._updateIterations = 20;
		self._updateHandle = setInterval(function(){
			if(!(self._updateIterations--) || self.input.value !== val)
				stopWaitUpdate(self);
			if(self.input.value !== val)
				updateSuggest(self);
		}, 50);
	}
	var stopWaitUpdate = function(self){
		if(self._updateHandle){
			clearInterval(self._updateHandle);
			self._updateHandle = undefined;
		}
	}
	
	var setValue = function(self, val){
		self.input.value = idsToString(self, val);
	}
	var getValue = function(self){
		return getRawInputs(self)
			.fl(function(item){ return bool(self.revdata[item]); })
			.map(function(item){ return parseInt(self.revdata[item]); });
	}
	
	return {
		init: init,
		className: "comma-domain-input",
		base: "genericWidget",
		methods: {
			data: function(data){				
				if(arguments.length) {
					setData(this, data);
					return this;
				} else return getData(this);
			},
			value: function(arg){
				if(arguments.length) {
					setValue(this, arg);
					return this;
				} else return getValue(this);
			}
		},
		parameters: {
			"no-result-string": "нет вариантов",
			"showed-entries-number": "7",
			'matching-mode':'starts-with'
		}
	}
})();