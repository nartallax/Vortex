widget.list.domainInputPack = (function(){

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
	var getData = function(){ return this._data; }
	
	var setValue = function(newVal){
		clearRows.call(this);
		for(var i in newVal)
			addRow.call(this, newVal[i]);
		addRow.call(this);
	}
	var getValue = function(){
		var result = [], id;
		for(var row in this._rows){
			row = this._rows[row];
			id = row.idInput.value();
			if(id === null || id === undefined) continue;
			result.push(id);
		}
		return result;
	}
	
	var onRemoveRowClick = function(){
		var self = widget.ofTag(this), row = this.parentNode;
		removeRow.call(self, row);
	}
	var addRow = function(data){
		var params = widget.paramsOf(this), self = this;

		var row = tag('div', null, 'cohort-row'),
			idInput = widget(tag('div', 'display:inline-block', 'cohort-id-input', {
				'data-widget-name':'domainInput',
				'data-widget-param-no-result-string': params['no-result-string'],
				'data-widget-param-showed-entries-number': params['showed-entries-number'],
				'data-widget-param-matching-mode': params['matching-mode']
			})),
			removeButton = tag('input', 'display:inline-block', 'cohort-remove-button', {type:'button','value': params['remove-text']});
			
		idInput.data(this._data);
		if(data !== undefined && data !== null) idInput.value(data);
		
		removeButton.onclick = onRemoveRowClick;
		row.appendChild(row.idInput = idInput);
		row.appendChild(removeButton);
		
		this._rowContainer.appendChild(row);
		this._rows.push(row);
		
		return row;
	}
	var removeRow = function(row){
		row.parentNode.removeChild(row);
		var index = this._rows.keyOf(row);
		if(typeof(index) === 'number') this._rows.splice(index, 1);
	}
	var clearRows = function(){
		this._rowContainer.innerHTML = '';
		this._rows = [];
	}
	
	return {
		init: init,
		className: "domain-input-pack",
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
			'remove-text': 'Удалить',
			"no-result-string": "нет вариантов",
			"showed-entries-number": "7",
			'matching-mode':'starts-with'
		}
	}
})();