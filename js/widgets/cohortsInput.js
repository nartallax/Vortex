widget.list.cohortsInput = (function(){

	var onAddRowClick = function(){
		addRow.call(widget.ofTag(this));
	}
	var init = function(source){
		var params = widget.paramsOf(this);
		
		this._rows = [];
		
		setData.call(this, {});
		
		this.appendChild(this._rowContainer = tag('div', 'width:100%;height:100%', 'row-container'));
		this.appendChild(this._addRowButton = tag('input', null, 'add-row-button', {type:'button',value:params['add-text']}));
		this._addRowButton.onclick = onAddRowClick;
	}
	
	var setData = function(data){
		this._data = data;
		var row;
		for(row in this._rows){
			row = this._rows[row];
			row.idInput.data(data);
		}
	}
	var getData = function(){
		return this._data;
	}
	
	var setValue = function(newVal){
		clearRows.call(this);
		for(var i in newVal)
			addRow.call(this, newVal[i]);
		addRow.call(this);
	}
	var getValue = function(){
		var data, result = [];
		for(var row in this._rows){
			data = getRowData(this._rows[row]);
			if(this._data[data.cohort])
				result.push(data);
		}
		return result;
	}
	
	var onRemoveRowClick = function(){
		var self = widget.ofTag(this), row = this.parentNode;
		removeRow.call(self, row);
	}
	var onRateInputKeyDown = function(){
		waitInputUpdate(this, function(){
			this.value = toBetween(parseInt(this.value), 1, 100);
		});
	}
	var addRow = function(data){
		var params = widget.paramsOf(this), self = this;

		data = data || {cohort:undefined, rate:1}
		var row = tag('div', null, 'cohort-row'),
			idInput = widget(tag('div', 'display:inline-block', 'cohort-id-input', {'data-widget-name':'domainInput'})),
			rateInput = tag('input','display:inline-block', 'cohort-rate-input', {type:'number', value:~~(data.rate * 100)}),
			removeButton = tag('input', 'display:inline-block', 'cohort-remove-button', {type:'button','value': params['remove-text']});
			
		idInput.data(this._data);
		if(data.cohort !== undefined)
			idInput.value(data.cohort);
		
		removeButton.onclick = onRemoveRowClick;
		rateInput.onkeydown = rateInput.onchange = rateInput.onblur = onRateInputKeyDown;
		row.appendChild(row.idInput = idInput);
		row.appendChild(row.rateInput = rateInput);
		row.appendChild(removeButton);
		
		this._rowContainer.appendChild(row);
		this._rows.push(row);
		
		return row;
	}
	var removeRow = function(row){
		row.parentNode.removeChild(row);
		var index = parseInt(this._rows.keyOf(row));
		if(typeof(index) === 'number')
			this._rows.splice(index, 1);
	}
	var clearRows = function(){
		this._rowContainer.innerHTML = '';
		this._rows = [];
	}
	var getRowData = function(row){
		var id = row.idInput.value();
		if(id !== undefined && id !== null) id = parseInt(id);
		return {cohort: id, rate: toBetween(parseInt(row.rateInput.value), 1, 100) / 100}
	}
	
	return {
		init: init,
		className: "cohorts-input",
		base: "genericWidget",
		methods: {
			data: function(data){
				if(arguments.length) {
					setData.call(this, data);
					return this;
				} else return getData.call(this);
			}, 
			value: function(arg){
				if(arguments.length) {
					setValue.call(this, arg);
					return this;
				} else return getValue.call(this);
			}
		},
		parameters: {
			'add-text': 'Добавить',
			'remove-text': 'Удалить'
		}
	}
})();