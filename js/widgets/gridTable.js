/* 
	виджет потенциально редактируемой таблицы 
*/
widget.list.gridTable = (function(){
	
	var init = function(source){
		this.displayFunctions = {};
		this.editFunctions = {};
		this.extractFunctions = {};
		this.cols = [];
		
		this._data = {};
		
		this.appendChild(this.table = tag('table', null, 'grid-table-main'));
		
		var thead = tag('thead', null, 'header-container');
		thead.appendChild(this.header = tag('tr', null, 'header-container'));
		this.table.appendChild(thead);
		this.table.appendChild(this.body = tag('tbody', null, 'row-container'));
		var self = this;
		
		source.children.clarr().each(function(child){
			var colName = child.getAttribute('data-col-name') || '';
			self.cols.push(colName);
			self.header.appendChild(tag('th', null, 'header', child.textContent));
		});
	}
	
	var getRowTag = function(cols, funcs, data, key){
		var result = tag('tr', null, 'row', {'data-key': key.toString()});
		
		cols.each(function(col){
			var func = funcs[col];
			if(!func) throw 'Could not render column "' + col + '": no such function registered.';
			
			var generated = func(data, key),
				cell = tag('td');
			cell.appendChild(generated)
			result.appendChild(cell);
		});
		
		return result;
	}
	
	
	var renderRows = function(){
		this.body.innerHTML = '';
		
		var self = this;
		this._data
			.map(getRowTag.curry(this.cols, this.displayFunctions))
			.each(function(tag){ self.body.appendChild(tag); });
	}
	
	var setData = function(data){
		this._data = data.toAssoc(); // expecting assoc array!
		renderRows.call(this);
		return this;
	}
	
	var getData = function(){ return this._data }
	
	var getRowByKey = function(key){
		key = key.toString();
		return this.body.children.clarr().fl(function(c){ return c.getAttribute('data-key') === key }).first()
	}
	
	var startEditRow = function(key){
		var oldTag = getRowByKey.call(this, key),
			newTag = getRowTag(this.cols, this.editFunctions, this._data[key], key);
			
		replaceTag(newTag, oldTag);
		
		return this;
	}
	
	var finishEditRow = function(key){
		var oldTag = getRowByKey.call(this, key), newTag;
		
		var newData = {}, self = this, oldData = this._data[key];
		oldTag.children.clarr().each(function(c, i){
			var col = self.cols[i], func = self.extractFunctions[col];
			if(!func) throw 'Could not extract data from column "' + col + '": no extraction function registered.';
			newData.populate(func(c.children[0], key));
		});
		
		newTag = getRowTag(this.cols, this.displayFunctions, newData, key);
		replaceTag(newTag, oldTag);
		this._data[key] = newData;
		this.fire('editFinish', {key: key, newData: newData, oldData: oldData});
		
		return this;
	}
	
	var revertEditRow = function(key){
		key = key.toString();
		
		var oldTag = getRowByKey.call(this, key),
			newTag = getRowTag(this.cols, this.displayFunctions, this._data[key], key);
		
		replaceTag(newTag, oldTag);
		
		return this;
	}
	
	var insertRow = function(data, key){
		key = key.toString();
		if(this._data[key]) return this.updateRow(data, key);
		
		this._data[key] = data;
		this.body.appendChild(getRowTag(this.cols, this.displayFunctions, data, key));
		
		return this;
	}
	
	var updateRow = function(data, key, newKey){
		key = key.toString();
		newKey = newKey? newKey.toString(): key;
		if(!this._data[key]) return this.insertRow(data, newKey);
		
		var oldTag = getRowByKey.call(this, key), newTag = getRowTag(this.cols, this.displayFunctions, data, newKey);
		
		replaceTag(newTag, oldTag);
		delete this._data[key]
		this._data[newKey] = data;
	}
	
	var deleteRow = function(key){
		key = key.toString();
		if(!this._data[key]) throw 'Could not delete by key "' + key + '": no such key.';
		
		delete this._data[key];
		var tag = getRowByKey.call(this, key);
		tag.parentNode.removeChild(tag);
	}
	
	return {
		init: init,
		className: "grid-table",
		base: "genericWidget",
		methods: {
			// expecting function(rowData) -> DOMnode
			registerDisplayFunction: function(colName, func){
				this.displayFunctions[colName] = func;
				return this;
			},
			// expecting function(rowData) -> DOMnode
			registerEditFunction: function(colName, func){
				this.editFunctions[colName] = func;
				return this;
			},
			// expecting function(DOMnode) -> partialRowData
			registerDataExtractFunction: function(colName, func){
				this.extractFunctions[colName] = func;
				return this;
			},
			setData: setData,
			getData: getData,
			data: function(data){ return arguments.length? this.setData(data): this.getData(); },
			startEditRow: startEditRow,
			finishEditRow: finishEditRow,
			revertEditRow: revertEditRow,
			insertRow: insertRow,
			updateRow: updateRow,
			deleteRow: deleteRow
		},
		parameters: {}
	}
	
})();