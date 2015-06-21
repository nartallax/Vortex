var activeTable = (function(){
	
	var activeTable = function(){
		if(!(this instanceof activeTable)) return new activeTable();
	
		this.activeCol = null;
		this.activeRow = null;
		
		this.columnHeaderGenerator = function(){};
		this.rowHeaderGenerator = function(){};
		
		this.cols = [];
		this.rows = [];
		this.markup = {};
		
		this.table = tag('table', '', 'active-table');
		this.table.isActiveTable = true;
		this.table.tableObject = this;
	};
	
	var wrapCellGenerator = function(gen, active){
		return function(col, row){
			var result = gen(col, row);
			result.setAttribute('data-col', col);
			result.setAttribute('data-row', row);
			result.setAttribute('data-active', active? 'true':'false');
			return result;
		}
	}
	
	// expected ([colVal, colVal, ...]) -> tr || [tr, tr, ...]
	activeTable.prototype.setColumnHeaderGenerator = function(gen){ 
		this.columnHeaderGenerator = gen; 
		this.regenerateGrid();
	}
	// expected (rowVal) -> tr
	activeTable.prototype.setRowHeaderGenerator = function(gen){
		this.rowHeaderGenerator = gen;
		this.regenerateGrid(); 
	}
	
	// expected [colVal, colVal, ...]
	activeTable.prototype.setColumns = function(cols){ 
		this.cols = cols; 
		this.regenerateGrid();
	}
	// expected [rowVal, rowVal, ...]
	activeTable.prototype.setRows = function(rows){
		this.rows = rows; 
		this.regenerateGrid(); 
	}
	
	// expected (colVal, rowVal) -> td
	activeTable.prototype.setActivateGenerator = function(gen){ 
		this.activateGenerator = wrapCellGenerator(gen, true); 
		this.regenerateGrid(); 
	}
	// expected (colVal, rowVal) -> td
	activeTable.prototype.setDisactivateGenerator = function(gen){ 
		this.disactivateGenerator = wrapCellGenerator(gen, false); 
		this.regenerateGrid();
	}
	
	activeTable.prototype.setActiveCell = function(col, row){
		this.activeCol = col;
		this.activeRow = rowl
		this.softRegenerateGrid();
	}
	
	// rebuilds table from scratch
	activeTable.prototype.regenerateGrid = function(){
		var table = this.table, 
			cols = this.cols, rows = this.rows,
			activeCol = this.activeCol, activeRow = this.activeRow,
			aGen = this.activateGenerator, dGen = this.disactivateGenerator;
		table.innerHTML = '';
	
		if(!rows.contains(activeRow)) activeRow = this.activeRow = rows.first();
		if(!cols.contains(activeCol)) activeCol = this.activeCol = cols.first();
	
		this.markup = {};
	
		var forMaybeArray = function(val, fn){ return Array.isArray(val)? val.each(fn): fn(val); }
		var processColHeader = function(header){ table.appendChild(colHeaders); }
		var processRowHeader = function(header, rowVal){
			table.appendChild(header);
			var markupRow = this.markup[rowVal] = {};
			header.setAttribute('data-row-value', rowVal);
			cols.each(function(colVal){
				markupRow[colVal] = ((colVal === activeCol || rowVal === activeRow)? aGen: dGen)(colVal, rowVal);
				header.appendChild(markupRow[colVal]);
			});
		}
	
		forMaybeArray(this.columnHeaderGenerator(cols), processColHeader);
		rows.each(function(val){ processRowHeader(this.rowHeaderGenerator(val), val); });
	}
	
	// updates cells in wrong state; expects all the cells to exist
	activeTable.prototype.softRegenerateGrid = function(){
		var self = this, aCol = this.activeCol, aRow = this.activeRow;
		return this.rows.each(function(rowVal){
			cols.each(function(colVal){ 
				self.softRegenerateCell(colVal, rowVal, colVal === aCol || rowVal === aRow); 
			});
		});
	}
	
	// replaces cell with new unless old cell is in proper state
	activeTable.prototype.softRegenerateCell = function(col, row, active){
		var cell = this.markup[row][col];
		if(!cell || cell.getAttribute('data-active') === (active? 'true': 'false')) return;
		this.markup[row][col] = (active? this.activateGenerator: this.disactivateGenerator)(col, row);
		replaceTag(this.markup[row][col], cell);
	}
	
	var getParentActiveTable = function(node){
		while(node && !node.isActiveTable) node = node.parentNode;
		return node? node.tableObject: undefined;
	}
	var activateThisCell = function(){
		getParentActiveTable(this).setActiveCell(this.getAttribute('data-col'), this.getAttribute('data-row'));
	}
	
	var updateEventListeners = function(markup, oldName, newName){
		markup.each(function(row){
			row.each(function(cell){
				removeListener(oldName, activateThisCell, cell);
				addListener(newName, activateThisCell, cell);
			});
		});
	}
	
	// switches activate by mouse move or by click
	activeTable.prototype.setMoveActivate = function(val){
		if(val) updateEventListeners(this.markup, 'mousedown', 'mouseover');
		else 	updateEventListeners(this.markup, 'mouseover', 'mousedown');
	}
	
	return activeTable;
	
})();