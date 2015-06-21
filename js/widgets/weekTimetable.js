widget.list.weekTimetable = (function(){

	var init = function(source){
		this.innerHTML = '';
		var params = widget.paramsOf(this);
		
		var splitSwitchWrap = tag('div','width:100%;height:100%', 'split-switch-wrap');
		splitSwitchWrap.appendChild(this._splitButton = tag('div', null, 'split-switch-button', params['split-text']));
		splitSwitchWrap.appendChild(this._splitHint = tag('div', null, 'split-hint', params['split-hint']));
		this.appendChild(splitSwitchWrap);
		this._splitButton.onclick = onToggleSplittingStateClick;
		
		this._weekTabContainer = tag('div', 'display:none', 'week-tab-group');
		this._weekTabContainer.appendChild(this._evenWeekTab = tag('div', null, 'week-tab active-tab', params['even-week']));
		this._weekTabContainer.appendChild(this._oddWeekTab = tag('div', null, 'week-tab', params['odd-week']));
		this.appendChild(this._weekTabContainer);
		this._oddWeekTab.onclick = onOddWeekTabClick;
		this._evenWeekTab.onclick = onEvenWeekTabClick;
		
		this._innerContainer = tag('div','width:100%;height:100%;position:relative');
		this.appendChild(this._innerContainer);
		
		setDayNames.call(this, JSON.parse(params['day-names']));
		setTimeGaps.call(this, JSON.parse(params['time-gaps']));
	}
	
	var onToggleSplittingStateClick = function(){
		toggleSplittingState.call(widget.ofTag(this));
		return false;
	}
	var onEvenWeekTabClick = function(){
		setDisplayedWeek.call(widget.ofTag(this), false);
		return false;
	}
	var onOddWeekTabClick = function(){
		setDisplayedWeek.call(widget.ofTag(this), true);
		return false;
	}
	var onTableClick = function(){
		clearSelection.call(widget.ofTag(this));
		return false;
	}
	var onCellMouseDown = function(){
		var self = widget.ofTag(this);
		
		var onSelectionFinish = function(e){
			e = e || window.event;
			removeListener('mousemove', onCellMouseMove, self._innerContainer);
			removeListener('mouseup', onSelectionFinish);
			if(getSelectedCells.call(self).length > 0)
				showSelector.call(self, e.clientX, e.clientY);
		}
		
		addListener('mousemove', onCellMouseMove, self._innerContainer);
		addListener('mouseup', onSelectionFinish);
		addClass(this, 'cell-selected');
		return false;
	}
	var onCellMouseMove = function(e){
		e = e || window.event;
		target = e.target;
		if(target.getAttribute('data-day-gap-odd'))
			addClass(target, 'cell-selected');
		return false;
	}
	var onSelectorClick = function(){
		var self = widget.ofTag(this),
			selection = getSelectedCells.call(self), 
			val = this.getAttribute('data-value'), i;
			
		clearSelection.call(self);
		
		var data = getData.call(self), 
			isSplit = isSplittedWeek.call(self),
			newData = [], i, dayGapOdd, cell;
			
		for(i in selection){
			cell = selection[i];
			dayGapOdd = JSON.parse(cell.getAttribute('data-day-gap-odd'));
			newData.push({day: dayGapOdd[0], gap: dayGapOdd[1], odd: dayGapOdd[2], value:val});
			if(!isSplit)
				newData.push({day: dayGapOdd[0], gap: dayGapOdd[1], odd: !dayGapOdd[2], value:val});
		}
			
		data = data.fl(function(d){
			for(i in newData){
				cell = newData[i];
				if(d.day === cell.day && d.gap === cell.gap && d.odd === cell.odd)
					return false;
			}
			return true;
		}).concat(newData);
			
		setData.call(self, data);
		fireEvent(createEvent('change'), self._innerContainer);
	}
	
	var hideSelector = function(){
		if(!this._selector) return;
		this._selector.parentNode.removeChild(this._selector);
		delete this._selector;
	}
	var createSelector = function(){
		var wrap = tag('div', 'position:absolute', 'value-selector-wrap'),
			params = widget.paramsOf(this), val, selector, i,
			values = JSON.parse(params['value-list']);
		for(i in values){
			selector = tag('div', null, 'value-selector-cell', {'data-value': values[i]});
			selector.onclick = onSelectorClick;
			wrap.appendChild(selector);
		}
		this._selector = wrap;
	}
	var showSelector = function(x, y){
		var rect = this._innerContainer.getBoundingClientRect();
		if(!this._selector) createSelector.call(this);
		
		this._selector.style.left = (x - rect.left) + 'px';
		this._selector.style.top = (y - rect.top) + 'px';
		if(!this._selector.parentNode)
			this._innerContainer.appendChild(this._selector);
	}
	
	var setDayNames = function(data){
		this._dayNames = data;
		regenerateGrid.call(this);
	}
	var setTimeGaps = function(data){
		this._timeGaps = data;
		regenerateGrid.call(this);
	}
	var getData = function(){
		var tds = this.getElementsByTagName("td").clarr(), dayGapOdd, val, td, result = [];
		for(td in tds){
			td = tds[td];
			val = td.getAttribute('data-value');
			dayGapOdd = JSON.parse(td.getAttribute('data-day-gap-odd'));
			result.push({day: dayGapOdd[0], gap: dayGapOdd[1], odd: dayGapOdd[2], value:val});
		}
		return result;
	}
	
	var getSelectedCells = function(){
		return elsByClass("cell-selected", this);
	}
	var clearSelection = function(){
		var cells = getSelectedCells.call(this);
		for(var i in cells)
			removeClass(cells[i], "cell-selected");
			
		hideSelector.call(this);
	}
	
	var getValueByDayGapOdd = function(data, dayGapOdd){
		var day = dayGapOdd[0], gap = dayGapOdd[1], odd = dayGapOdd[2], slot;
		for(var i in data){
			slot = data[i];
			if(slot.day === day && slot.gap === gap && slot.odd === odd)
				return slot.value;
		}
		return undefined;
	}
	var setData = function(data){
		var tds = this.getElementsByTagName("td").clarr(), td, defVal = widget.paramsOf(this)['default-value'], val;
		for(td in tds){
			td = tds[td];
			val = getValueByDayGapOdd(data, JSON.parse(td.getAttribute('data-day-gap-odd')));
			td.setAttribute('data-value', val === undefined? defVal: val);
		}
		updateSplittingState.call(this);
	}
	
	var weekIncludedInWeek = function(sup, sub){
		var i, j, subArr, supArr;
		for(i in sup){
			if(!(subArr = sub[i])) return false;
			supArr = sup[i];
			for(j in supArr) if(supArr[j] !== subArr[j]) return false;
		}
		return true;
	}
	var weeksIsSymmetrical = function(data){
		var odd = {}, even = {}, row, targetArr, dayArr;
		
		for(var i in data){
			row = data[i];
			targetArr = row.odd? odd: even;
			if(!(dayArr = targetArr[row.day])) dayArr = targetArr[row.day] = {};
			dayArr[row.gap] = row.value;
		}
		
		return weekIncludedInWeek(odd, even) && weekIncludedInWeek(even, odd);
	}
	
	var equalizeWeeks = function(){
		var data = getData.call(this), row, newData = [];
		for(var i in data){	
			row = data[i];
			if(row.odd) continue;
			newData.push(row);
			newData.push({odd: true, day: row.day, gap: row.gap, value: row.value});
		}
		setData.call(this, newData);
	}
	
	var isSplittedWeek = function(){
		return this._weekTabContainer.style.display !== 'none';
	}
	var forceDisableSplitting = function(){
		var params = widget.paramsOf(this);
		equalizeWeeks.call(this);
		setDisplayedWeek.call(this, false);
		this._weekTabContainer.style.display = 'none';
		this._splitButton.textContent = params['split-text'];
		this._splitHint.textContent = params['split-hint'];
	}
	var toggleSplittingState = function(){
		var params = widget.paramsOf(this), self = this;
		
		if(!isSplittedWeek.call(this)){
			this._splitButton.textContent = params['unite-text'];
			this._splitHint.textContent = params['unite-hint'];
			return this._weekTabContainer.style.display = 'block';
		}
		
		if(!weeksIsSymmetrical(getData.call(this))){
			popup.confirm(params['uniting-alert-text'], function(){
				forceDisableSplitting.call(self);
				fireEvent(createEvent('change'), self._innerContainer);
			});
		} else forceDisableSplitting.call(this);
	}
	var setDisplayedWeek = function(odd){
		var targetTab = odd? this._oddWeekTab: this._evenWeekTab,
			unactiveTab = odd? this._evenWeekTab: this._oddWeekTab,
			targetTable = odd? this._oddTable: this._evenTable,
			unactiveTable = odd? this._evenTable: this._oddTable;
			
		addClass(targetTab, 'active-tab');
		removeClass(unactiveTab, 'active-tab');
		targetTable.style.display = '';
		unactiveTable.style.display = 'none';
		
		clearSelection.call(this);
	}
	var getDisplayedWeek = function(){ return hasClass(this._oddWeekTab, 'active-tab'); }
	var updateSplittingState = function(){
		if(weeksIsSymmetrical(getData.call(this))) return;
		if(!isSplittedWeek.call(this)) toggleSplittingState.call(this);
		else setDisplayedWeek.call(this, getDisplayedWeek.call(this));
	}
	
	var getGridTag = function(days, gaps, odd, editable){
		var wrap = tag('table','width:100%;height:100%'), tr = tag('tr'), i, j, cell;
		
		tr.appendChild(tag('th'));
		for(i in gaps)
			tr.appendChild(tag('th', null, null, gaps[i].toString()));
		wrap.appendChild(tr);
		
		for(i in days){
			tr = tag('tr');
			tr.appendChild(tag('th', null, null, days[i].toString()));
			for(j in gaps){
				cell = tag('td', {'data-day-gap-odd':JSON.stringify([i, j, odd])});
				if(editable)
					cell.onmousedown = onCellMouseDown;
				tr.appendChild(cell);
			}
			wrap.appendChild(tr);
		}
		
		wrap.onmousedown = onTableClick;
		
		return wrap;
	}
	var regenerateGrid = function(){
		var data = getData.call(this),
			editable = widget.paramsOf(this).editable === 'true',
			oddTable = getGridTag(this._dayNames, this._timeGaps, true, editable),
			evenTable = getGridTag(this._dayNames, this._timeGaps, false, editable);
			
		oddTable.style.display = 'none';
		
		this._innerContainer.innerHTML = '';
		this._innerContainer.appendChild(oddTable);
		this._innerContainer.appendChild(evenTable);
		
		this._oddTable = oddTable;
		this._evenTable = evenTable;
		
		setData.call(this, data);
	}
	
	return {
		init: init,
		className: "week-timetable",
		base: "genericWidget",
		methods: {
			dayNames: function(data){
				if(arguments.length){ 
					setDayNames.call(this, data);
					return this;
				}
				else return this._dayNames;
			},
			timeGaps: function(data){
				if(arguments.length){
					setTimeGaps.call(this, data);
					return this;
				}
				else return this._timeGaps;
			},
			valueList: function(data){
				if(arguments.length) {
					this.setAttribute('data-widget-param-value-list', JSON.stringify(data));
					return this;
				} else return JSON.parse(widget.paramsOf(this)['value-list']);
			},
			defaultValue: function(data){
				if(arguments.length) { 
					this.setAttribute('data-widget-param-default-value', data.toString());
					regenerateGrid.call(this);
					return this;
				} else return widget.paramsOf(this)['default-value'];
			},
			update: function(){
				regenerateGrid.call(this);
				return this;
			},
			value: function(data){
				if(arguments.length){
					setData.call(this, data);
					return this;
				}
				else return getData.call(this);
			},
			listenChange: function(listener){ addListener('change', listener, this._innerContainer); },
			unlistenChange: function(listener){ removeListener('change', listener, this._innerContainer); }
		},
		parameters: {
			'day-names': '{"0":"пн","1":"вт","2":"ср","3":"чт","4":"пт","5":"сб"}',
			'time-gaps': '{"0":"8.00 - 9.20", "1":"9.30 - 10.50", "2":"11.00 - 12.20", "3":"12.40-14.00", "4":"14.20 - 15.40", "5":"15.50 - 17.10", "6":"17.20 - 18.40"}',
			'value-list': '["-2", "-1", "1", "0"]',
			'default-value': '0',
			'editable': 'true',
			'split-text': 'разделить неделю',
			'split-hint': '(возможность распределять часы отдельно для четной и нечетной недель)',
			'unite-text': 'отменить разделение недель',
			'unite-hint': '',
			'odd-week': 'Нечетная неделя',
			'even-week': 'Четная неделя',
			'uniting-alert-text': 'Вы указали разные данные для четной и нечетной недель. Данные для нечетной недели будут утеряны. Продолжить?'
		}
	}
})();