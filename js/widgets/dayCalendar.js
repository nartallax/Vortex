widget.list.dayCalendar = (function(){

	
	var init = function(source){
		var params = widget.paramsOf(this);
		
		this.appendChild(this.header = tag('div', '', 'header'));
		this.appendChild(this.tableContainer = tag('div', '', 'inner-container'));
		this.header.appendChild(this.monthContainer = tag('div', '', 'month-name-container'));
		this.header.appendChild(this.decMonthButton = tag('div', '', 'dec-month round-arrow-left'));
		this.header.appendChild(this.incMonthButton = tag('div', '', 'inc-month round-arrow-right'));
		
		this.decMonthButton.onclick = onDecMonthClick;
		this.incMonthButton.onclick = onIncMonthClick;
		
		this.selectable = params.selectable === 'true';
		this.dows = JSON.parse(params['dow-names']);
		this.months = JSON.parse(params['month-names']);
		
		var now = new Date();
		
		this._valDate = now.getDate();
		this._valMon = now.getMonth();
		this._valYear = now.getFullYear();
		
		setMonth.call(this, now.getMonth(), now.getFullYear());
	}
	
	var onIncMonthClick = function(){ 
		var w = widget.ofTag(this),
			m = getMonth.call(w),
			y = getYear.call(w);
			
		if(m === 11){
			m = 0;
			y++;
		} else m++;
			
		setMonth.call(w, m, y);
	}
	var onDecMonthClick = function(){
		var w = widget.ofTag(this),
			m = getMonth.call(w),
			y = getYear.call(w);
			
		if(m === 0){
			m = 11;
			y--;
		} else m--;
			
		setMonth.call(w, m, y);
	}
	
	var setMonth = function(monNum, yearNum){
		this.monthContainer.textContent = this.months[monNum] + ' ' + yearNum;
		this.monthContainer.setAttribute('data-month', monNum);
		this.monthContainer.setAttribute('data-year', yearNum);
		this.tableContainer.innerHTML = '';
		this.tableContainer.appendChild(getMonthTable.call(this, monNum, yearNum));
	}
	
	var unselect = function(){
		var selected = elsByClass('selected', this)[0];
		if(selected) removeClass(selected, 'selected');
	}
	
	var onDayClick = function(mon, year){
		var w = widget.ofTag(this);
		if(!w.selectable || hasClass(this, 'selected')) return;
		unselect.call(w);
		addClass(this, 'selected');
		w._valDate = parseInt(this.textContent);
		w._valMon = mon;
		w._valYear = year;
	}
	
	var getMonthTable = function(mon, year){
		var table = tag('table', '', 'month-table' + (this.selectable? ' selectable': '')), row,
			onclick = onDayClick.curry(mon, year);
		
		table.appendChild(row = tag('tr'));
		this.dows.each(function(dow){ row.appendChild(tag('td', '', 'dow-cell', dow)) });
		
		var monthShift = (new Date(year, mon, 1).getDay() + 6) % 7,
			monthSize = new Date(year, mon + 1, 0).getDate(),
			nowDate = new Date().getMonth() === mon && new Date().getFullYear() === year? new Date().getDate(): undefined,
			tds = {};
		
		for(var weekNum = 0; weekNum < 6; weekNum++){
			table.appendChild(row = tag('tr'));
			
			for(var dow = 0; dow < this.dows.length; dow++){
				var date = ((weekNum * 7) + dow) + 1 - monthShift;
				if(date <= 0 || date > monthSize){
					row.appendChild(tag('td', '', 'day-cell empty'));
					continue;
				}
				
				var td = tag('td', '', 'day-cell' + (nowDate === date? ' today': ''), date);
				td.onclick = onclick;
				tds[date] = td;
				row.appendChild(td);
				
			}
			this.tds = tds;
		}
		
		if(mon === this._valMon && year === this._valYear && tds[this._valDate]){
			addClass(tds[this._valDate], 'selected')
		}
		
		return table;
	}
	
	
	var getMonth = function(){ return parseInt(this.monthContainer.getAttribute('data-month')); }
	var getYear = function(){ return parseInt(this.monthContainer.getAttribute('data-year')); }
	
	var setValue = function(newVal){
		var curm = getMonth.call(this),
			cury = getYear.call(this);
			
		unselect.call(this);
		
		this._valDate = newVal.day;
		this._valMon = newVal.month;
		this._valYear = newVal.year;
		
		if(newVal.month === curm && newVal.year === cury && this.tds[newVal.day])
			addClass(this.tds[newVal.day], 'selected');
	}
	var getValue = function(){ return {day: this._valDate, month: this._valMon, year: this._valYear}; }
	
	return {
		init: init,
		className: "day-calendar",
		base: "genericWidget",
		methods: {
			value: function(arg){
				if(arguments.length) {
					setValue.call(this, arg);
					return this;
				} else return getValue.call(this);
			}
		},
		parameters: {
			'selectable':'false',
			'month-names':'["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"]',
			'dow-names':'["Пн","Вт","Ср","Чт","Пт","Сб","Вс"]'
		}
	}
})();