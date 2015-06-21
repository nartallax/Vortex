/*
	модуль всплывающего окна
*/
var popup = (function(){

	var rectifyParams = function(params){
		params = params || {};
		
		if(params.closeable === undefined) params.closeable = true;
		if(params.movable === undefined) params.movable = true;
		if(params.modal === undefined) params.modal = true;
		if(params.show === undefined) params.show = true;
		if(params.resizable === undefined) params.resizable = true;
		
		if(params.width === undefined) params.width = 550;
		if(params.height === undefined) params.height = 300;
		
		if(params.minWidth === undefined) params.minWidth = params.width;
		if(params.minHeight === undefined) params.minHeight = params.height;
		
		var screenHeight = window.innerHeight, screenWidth = window.innerWidth;
			
		if(params.x === undefined) params.x = ((screenWidth - params.width)/2);
		if(params.y === undefined) params.y = ((screenHeight - params.height)/2);
		
		if(!params.title) params.title = '';
		params.header = params.header || params.title;
		
		return params;
	}
	
	var createResizeTags = function(){
		if(this._resizeTags) return;
		var self = this,
			newBody = tag('div', null, 'resize-inner'),
			oldBody = this._body;
		var onResizeStart = function(e){
			e = e || window.event;
			
			var startMouseX = e.clientX,
				startMouseY = e.clientY,
				startLeft = parseInt(self._outerElement.style.left),
				startTop = parseInt(self._outerElement.style.top),
				startWidth = parseInt(self._outerElement.style.width),
				startHeight = parseInt(self._outerElement.style.height),
				dragDirs = self._resizeTags.keyOf(this).split('_');
			
			var applyResize = function(shiftX, shiftY, direction){
				switch(direction){
					case 'left': 
						if(startWidth - shiftX < self.minWidth) shiftX = startWidth - self.minWidth;
						if(shiftX + startLeft <= 0) shiftX = -startLeft + 3;
						self._outerElement.style.left = (shiftX + startLeft) + 'px';
						self._outerElement.style.width = (startWidth - shiftX) + 'px';
						break;
					case 'right':
						if(startWidth + shiftX < self.minWidth) shiftX = self.minWidth - startWidth;
						if(shiftX + startWidth + startLeft > window.innerWidth) shiftX = window.innerWidth - startWidth - startLeft - 3;
						self._outerElement.style.width = (startWidth + shiftX) + 'px';
						break;
					case 'top':
						if(startHeight - shiftY < self.minHeight) shiftY = startHeight - self.minHeight;
						if(shiftY + startTop < 0) shiftY = -startTop + 3;
						self._outerElement.style.top = (shiftY + startTop) + 'px';
						self._outerElement.style.height = (startHeight - shiftY) + 'px';
						break;
					case 'bottom':
						if(startHeight + shiftY < self.minHeight) shiftY = self.minHeight - startHeight;
						if(shiftY + startHeight + startTop > window.innerHeight) shiftY = window.innerHeight - startHeight - startTop - 3;
						self._outerElement.style.height = (startHeight + shiftY) + 'px';
						break;
				}
			}
			
			var onMouseUp = function(){
				removeListener('mousemove', onMouseMove);
				removeListener('mouseup', onMouseUp);
			}
			var onMouseMove = function(e){
				e = e || window.event;
				var shiftX = e.clientX - startMouseX,
					shiftY = e.clientY - startMouseY;
				for(var i in dragDirs)
					applyResize(shiftX, shiftY, dragDirs[i]);
				return pauseEvent(e);
			}
			
			addListener('mousemove', onMouseMove);
			addListener('mouseup', onMouseUp);
			
			return pauseEvent(e);
		}
		this._resizeTags = {};
		while(oldBody.children.length)
			newBody.appendChild(oldBody.children[0]);
		oldBody.appendChild(newBody);
		this._body = newBody;
		
		oldBody.appendChild(this._resizeTags.left = tag('div', null, 'resize-left'));
		oldBody.appendChild(this._resizeTags.right = tag('div', null, 'resize-right'));
		oldBody.appendChild(this._resizeTags.top = tag('div', null, 'resize-top'));
		oldBody.appendChild(this._resizeTags.bottom = tag('div', null, 'resize-bottom'));
		oldBody.appendChild(this._resizeTags.top_left = tag('div', null, 'resize-top-left'));
		oldBody.appendChild(this._resizeTags.top_right = tag('div', null, 'resize-top-right'));
		oldBody.appendChild(this._resizeTags.bottom_left = tag('div', null, 'resize-bottom-left'));
		oldBody.appendChild(this._resizeTags.bottom_right = tag('div', null, 'resize-bottom-right'));
		
		for(var i in this._resizeTags)
			this._resizeTags[i].onmousedown = onResizeStart;
	}

	var dragStart = function(e){
		
		var self = this;
		var offsetX = e.clientX - parseInt(self._outerElement.style.left),
			offsetY = e.clientY - parseInt(self._outerElement.style.top),
			width = parseInt(self._outerElement.style.width),
			height = parseInt(self._outerElement.style.height),
			screenHeight = window.innerHeight,
			screenWidth = window.innerWidth;
		
		var onDrag = function(e){
			e = e || window.event;
			
			var wantedX = e.clientX - offsetX,
				wantedY = e.clientY - offsetY;
			
			if(wantedX < 3) wantedX = 3;
			if(wantedY < 3) wantedY = 3;
			
			if(wantedX + width > screenWidth - 3) wantedX = screenWidth - width - 3;
			if(wantedY + height > screenHeight - 3) wantedY = screenHeight - height - 3;
				
			self._outerElement.style.left = wantedX + 'px';
			self._outerElement.style.top = wantedY + 'px';
			
			return pauseEvent(e);
		}
		
		var onDragStop = function(e){
			removeListener('mousemove', onDrag);
			removeListener('mouseup', onDragStop);
			
			return pauseEvent(e || window.event);
		}
		
		addListener('mousemove', onDrag);
		addListener('mouseup', onDragStop);
		
		return pauseEvent(e);
	}
	
	var popup = function(inner, params){
		if(!(this instanceof popup)) return new popup(inner, params);
		params = rectifyParams(params);
		
		var self = this,
			selfclose = function(){ self.close(); },
			selfdrag = function(e){ return dragStart.call(self, e || window.event); }
		this._root = tag('div', null, 'popup');
		
		if(params.modal) {
			this._background = tag('div', null, 'background');
			if(params.closeable)
				this._background.onclick = selfclose;
			this._root.appendChild(this._background);
		}
		
		this._body = tag('div', null, 'body');
		this._root.appendChild(this._body);
		this._body.style.width = params.width + 'px';
		this._body.style.height = params.height + 'px';
		this._body.style.top = params.y + 'px';
		this._body.style.left = params.x + 'px';
				
		
		if(params.closeable){
			var closeButton = tag('div', null, 'close-button');
			this._body.appendChild(closeButton);
			closeButton.onclick = selfclose;
		}
		
		this._outerElement = this._body;
		
		if(params.resizable) createResizeTags.call(this);
		
		this._body.appendChild(this._header = tag('div', null, 'header', params.header));
		if(params.movable) {
			addListener('mousedown', selfdrag, this._header);
			addClass(this._header, 'movable');
		}
		
		if(inner) {
			var innerWrap = tag('div', null, 'terminal-container');
			innerWrap.appendChild(inner);
			this._body.appendChild(innerWrap);
		}
		
		
		this.minHeight = params.minHeight;
		this.minWidth = params.minWidth;
		
		if(params.show) this.show();
	}
	popup.prototype.hide = popup.prototype.close = function(){
		if(!this._root.parentNode) return;
		document.body.removeChild(this._root);
	}
	popup.prototype.show = popup.prototype.display = function(){
		if(!this._root.parentNode)
			document.body.appendChild(this._root);
	}

	popup.alert = function(text, header, after, params){
		
		if(typeof(header) === 'function'){
			after = header;
			header = params;
			params = undefined;
		}
		
		
		var body = tag('div', 'position:absolute;top:30px;bottom:15px;left:15px;right:15px', 'alert'),
			button = tag('input', 'display:block;width:100%;height:30px', {type:'button', value:'ОК'}),
			buttonWrap = tag('div','position:absolute;left:75px;right:75px;bottom:0px'),
			textCont = tag('div', 'position:absolute;top:0px;bottom:50px;left:0px;right:0px', null, text || ''),
			result;
			
		body.appendChild(textCont);
		body.appendChild(buttonWrap);
		buttonWrap.appendChild(button);
			
		button.onclick = function(){
			result.close();
			if(after) after();
		}
		
		params = params || {};
		params.width = params.width || 450;
		params.height = params.height || 200;
		params.closeable = params.closeable || false;
		params.header = params.header || header || popup.defaultAlertHeader;
		
		return result = new popup(body, params);
	}
	popup.confirm = function(text, header, onOk, onNotOk){
	
		if(typeof(header) === 'function'){
			onNotOk = onOk;
			onOk = header;
			header = undefined;
		}
	
		var body = tag('div', 'position:absolute;top:30px;bottom:15px;left:15px;right:15px', 'alert'),
			buttonOk = tag('input', 'display:inline-block;width:45%;height:30px', {type:'button', value:'ОК'}),
			buttonCancel = tag('input', 'display:inline-block;width:45%;height:30px;margin-left:10%', {type:'button', value:'Отмена'}),
			buttonWrap = tag('div','position:absolute;left:10px;right:10px;bottom:0px'),
			textCont = tag('div', 'position:absolute;top:0px;bottom:50px;left:0px;right:0px', null, text || ''),
			result;
			
		body.appendChild(textCont);
		body.appendChild(buttonWrap);
		buttonWrap.appendChild(buttonOk);
		buttonWrap.appendChild(buttonCancel);
			
		buttonOk.onclick = function(){
			result.close();
			if(onOk) onOk();
		}
		buttonCancel.onclick = function(){
			result.close();
			if(onNotOk) onNotOk();
		}
		
		return result = new popup(
			body,
			{
				width: 450,
				height: 200,
				closeable: false,
				header: header || popup.defaultConfirmHeader
			}
		);
	}
	
	popup.defaultAlertHeader = 'Внимание';
	popup.defaultConfirmHeader = 'Подтверждение';
	
	return popup;
	
})();