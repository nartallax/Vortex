widget.list.roomInputPack = (function(){

	var onAddRowClick = function(){ addRow(widget.ofTag(this)); }

	var init = function(source){
		this.params = widget.paramsOf(this);
		
		this.rows = [];
		
		self._rooms = {};
		self._buildings = {};
		
		this.appendChild(this.rowContainer = tag('div', 'width:100%;height:100%', 'row-container'));
		this.appendChild(this._addRowButton = tag('input', null, 'add-row-button', {type:'button',value:this.params['add-text']}));
		this._addRowButton.onclick = onAddRowClick;
	}
	
	var getBuildings = function(self){ return self._buildings; }
	var setBuildings = function(self, data){
		self._buildings = data;
		self.rows.each(function(row){
			var b = parseInt(row.buildingInput.value());
			row.buildingInput.data(data);
			if(data[b]){
				row.buildingInput.value(b);
			} else {
				row.buildingInput.value(undefined);
				row.roomInput.value([]);
			}
		});
	}
	
	var getRoomListForBuilding = function(self, building){
		return self._rooms
			.flfield('building', building)
			.spawn(function(res, v, k){
				res[k] = v.name;
				return res;
			}, {});
	}
	
	var getRooms = function(self){ return this._rooms; }
	var setRooms = function(self, data){
		self._rooms = data;
		self.rows.each(function(row){
			var rooms = row.roomInputs.value().map(function(item){ return parseInt(item); }),
				b = parseInt(row.buildingInput.value());
			row.roomInputs.data(getRoomListForBuilding(self, b));
		});
	}
	
	var setValue = function(self, newVal){
		clearRows(self);
		var buildings = {};
		newVal.each(function(item){
			if(!self._rooms[item]) return;
			var b = self._rooms[item].building;
			if(!buildings[b])
				buildings[b] = [];
			buildings[b].push(item);
		});
		
		buildings.each(function(rooms, building){
			var row = addRow(self);
			row.buildingInput.value(building);
			row.roomInput.value(rooms);
		})
	}
	var getValue = function(self){	
		var result = [];
		self.rows.each(function(row){
			result.addAll(row.roomInput.value().map(function(item){ return parseInt(item); }));
		});
		return result;
	}
	
	var addRow = function(self){
		var row = tag('div', 'position:relative', 'roomrow'),
			buildingInput = widget(tag('div', 'display:inline-block;width:47%;margin-right:1%', 'building-input', {'data-widget-name':'domainInput'})),
			roomInput = widget(tag('div', 'display:inline-block;width:47%', 'room-input', {'data-widget-name':'commaDomainInput'})),
			removeButton = tag('div', 'position:absolute;right:0px;top:3px;cursor:pointer', 'cross-image');
			
		row.appendChild(buildingInput);
		row.appendChild(roomInput);
		row.appendChild(removeButton);
			
		buildingInput.data(self._buildings);
		buildingInput.listenChange(function(){ roomInput.data(getRoomListForBuilding(self, parseInt(buildingInput.value()))); });
		var len = self.rows.length, result = {roomInput: roomInput, buildingInput: buildingInput, wrap: row};
		removeButton.onclick = function(){ removeRow(self, result); }
		self.rows.push(result);
		self.rowContainer.appendChild(row);
		
		roomInput.listen('change', function(){ self.fire('change'); })
		
		return result;
	}
	var removeRow = function(self, row){
		var desc = self.rows.splice(self.rows.indexOf(row), 1)[0];
		self.rowContainer.removeChild(desc.wrap);
	}
	var clearRows = function(self){
		self.rowContainer.innerHTML = '';
		self.rows = [];
	}
	
	return {
		init: init,
		className: "room-input-pack",
		base: "genericWidget",
		methods: {
			buildings: function(data){				
				if(arguments.length) {
					setBuildings(this, data);
					return this;
				} else return getBuildings(this);
			},
			rooms: function(data){
				if(arguments.length) {
					setRooms(this, data);
					return this;
				} else return getRooms(this);
			}, 
			value: function(arg){
				if(arguments.length) {
					setValue(this, arg);
					return this;
				} else return getValue(this);
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