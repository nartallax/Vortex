widget.list.deletableItemList = (function(){

	var init = function(){
		var params = widget.paramsOf(this);
	
		this._data = {};
		
		//this._deleteButton = tag("p", null, params["disabled-delete-button-class"], params["delete-string"]);
		this._listWrapper = tag("ul");
		
		//this._deleteButton.onclick = onDeleteClick;
		
		updateMarkup.call(this);
	}

	//var onDeleteClick = function(){ deleteSelectedItems.call(this.parentNode); return false; }
	
	var onCrossClick = function(){
		var li = this.parentNode,
			key = li.getAttribute('data-item-key'),
			deleted = {},
			self = widget.ofTag(this);
			
		deleted[key] = self._data[key];
		delete self._data[key];
		
		invokeRemoveListener.call(self, deleted);
		updateMarkup.call(self);
	}
	
	var setData = function(data){ this._data = data; updateMarkup.call(this); }
	var getData = function(){ return this._data; }
	
	var setItem = function(k, v){ this._data[k] = v; updateMarkup.call(this); }
	var removeItem = function(k){
		var deleted = {};
		deleted[k] = this._data[k];
		delete this._data[k];
		invokeRemoveListener.call(this, deleted);
		updateMarkup.call(this);
	}
	
	var registerOnRemoveListener = function(listener){ this._onItemRemove = listener; }
	var invokeRemoveListener = function(deleted) { if(this._onItemRemove) this._onItemRemove(deleted);}
	
	var haveSelectedItem = function(){
		var i = this._listWrapper.children.length;
		while(i--) if(this._listWrapper.children[i].children[0].checked) return true;
		return false;
	}
	
	var updateMarkup = function(){
		if(this._data.isEmpty()){
			clearTag(this);
			/*if(this._deleteButton.parentNode){
				this._deleteButton.parentNode.removeChild(this._deleteButton);
				this._listWrapper.parentNode.removeChild(this._listWrapper);
			}*/
			if(this._listWrapper.parentNode) this._listWrapper.parentNode.removeChild(this._listWrapper);
			this.appendChild(getEmptyPlaceholder.call(this));
		} else {
			/*if(!this._deleteButton.parentNode){
				clearTag(this);
				this.appendChild(this._deleteButton);
				this.appendChild(this._listWrapper);
			}*/
			this.innerHTML = '';
			this.appendChild(this._listWrapper);
			var i = this._listWrapper.children.length, keys = this._data.keysAssoc(), key, item;
			
			
			while(i--){
				item = this._listWrapper.children[i];
				key = item.getAttribute("data-item-key");
				if(keys[key]) {
					if(item.children[0].textContent !== this._data[key])
						item.children[0].textContent = this._data[key];
					delete keys[key];
				} else item.parentNode.removeChild(item);
			}
			
			for(i in keys)
				this._listWrapper.appendChild(createItemTag(i, this._data[i].toString()));
		}
		//updateDeleteButtonState.call(this);
	}
	/*
	var updateDeleteButtonState = function(){
		var params = widget.paramsOf(this);
		removeClass(this._deleteButton, params["disabled-delete-button-class"]);
		removeClass(this._deleteButton, params["enabled-delete-button-class"]);
		addClass(this._deleteButton, params[haveSelectedItem.call(this)? "enabled-delete-button-class": "disabled-delete-button-class"]);
	}
	*/
	var deleteSelectedItems = function(){
		var i = this._listWrapper.children.length, item, deleted = {}, key
		while(i--){
			item = this._listWrapper.children[i];
			key = item.getAttribute("data-item-key");
			if(item.children[0].checked){
				deleted[key] = this._data[key];
				delete this._data[key];
			}
		}
		invokeRemoveListener.call(this, deleted);
		updateMarkup.call(this);
	}
	var getEmptyPlaceholder = function(){
		var params = widget.paramsOf(this);
		return tag("div", null, params["empty-list-class"], params["empty-list-string"]);
	}
	var createItemTag = function(key, val){ 
		var result = tag("li", {"data-item-key":key}),
			text = tag("p", null, null, val),
			cross = tag('span', 'display:inline-block;margin-left: 10px', 'cross-small-hoverable', '');
		cross.onclick = onCrossClick;
		result.appendChild(text);
		result.appendChild(cross);
		return result;
	}
	
	
	return {
		init: init,
		className: "deletable-item-list",
		base: "genericWidget",
		methods: {
			data: function(val){
				if(arguments.length){
					setData.call(this, val);
					return this;
				} else return getData.call(this);
			},
			set: function(k, v){
				addItem.call(this, k, v);
				return this;
			},
			remove: function(k){
				removeItem.call(this, k);
				return this;
			},
			listenRemove: function(handle){
				registerOnRemoveListener.call(this, handle);
				return this;
			}
		},
		parameters: {
			"empty-list-string": "Нет позиций",
			"empty-list-class": "empty",
			"delete-string": "удалить",
			"disabled-delete-button-class": "disabled",
			"enabled-delete-button-class": "enabled"
		}
	}
})();