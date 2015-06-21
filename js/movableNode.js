var movableNode = (function(){

	var dragStart = function(e){
		e = e || window.event;
		
		setCurrent(this);
		
		this.offsetX = e.offsetX;
		this.offsetY = e.offsetY;
		
		this.dummyTag = getDummyTag();
		this.startSite = getSiteOf(this);
		
		var rect = this.getBoundingClientRect(),
			root = movableNode.getRoot();
			
		replaceTag(this.dummyTag, this);
		root.appendChild(this);
		
		this.style.position = 'absolute';
		this.style.top = (rect.top + root.scrollTop) + 'px';
		this.style.left = (rect.left + root.scrollLeft) + 'px';
	
		addListener('mouseup', dragEnd);
		addListener('mouseout', testMouseOut);
		addListener('mousemove', dragMove);
		
		var eventData = createEvent('dragstart');
		eventData.moveTarget = this;
		eventData.startSite = this.startSite;
		fireEvent(eventData, this);
	}
	
	var setCurrent = function(node){
		if(movableNode.current === node) return;
		if(movableNode.current){
			removeClass(movableNode.current, 'active');
		}
		if(node){
			movableNode.current = node;
			addClass(movableNode.current, 'active');
		} else movableNode.current = null;
	}
	
	var getDummyTag = function(){
		return tag('div', 'display:none');
	}
	var getSiteOf = function(node){
		while(node && !node.isDropSite)
			node = node.parentNode;
		return node;
	}
	
	var testMouseOut = function(e){
		e = e || window.event;
		var screenHeight = window.innerHeight, screenWidth = window.innerWidth;
		
		if(e.clientX <= 0 || e.clientX >= screenWidth || e.clientY <= 0 || e.clientY >= screenHeight)
			dragEnd();
	}
	
	var dragEnd = function(){
		removeListener('mouseup', dragEnd);
		removeListener('mouseout', testMouseOut);
		removeListener('mousemove', dragMove);
		
		var self = movableNode.current,
			dropTarget = dropSite.current;
		if(!dropTarget) replaceTag(self, self.dummyTag);
		else self.dummyTag.parentNode.removeChild(self.dummyTag);
			
		var eventData = createEvent('dragend');
		eventData.dropTarget = dropTarget;
		eventData.moveTarget = self;
		eventData.startSite = self.startSite;
		fireEvent(eventData, self);
		
		setCurrent(null);
		
		delete self.offsetX;
		delete self.offsetY;
		delete self.dummyTag;
		delete self.startSite;
		
		self.style.position = '';
		self.style.top = '';
		self.style.left = '';
	}
	
	var dragMove = function(e){
		e = e || window.event;
		
		var self = movableNode.current,
			root = movableNode.getRoot();
		
		self.style.top = (e.clientY - self.offsetY + root.scrollTop) + 'px';
		self.style.left = (e.clientX - self.offsetX + root.scrollLeft) + 'px';
	}

	var movableNode = function(node){
		var result = tag('div', '', 'movable-node');
		result.appendChild(node);
		result.onmousedown = dragStart;
		
		result.listenDragEnd = listenDragEnd;
		result.unlistenDragEnd = unlistenDragEnd;
		
		result.listenDragStart = listenDragStart;
		result.unlistenDragStart = unlistenDragStart;
		
		return result;
	}
	
	movableNode.root = null;
	movableNode.setRoot = function(node){ movableNode.root = node; }
	movableNode.getRoot = function(){ return movableNode.root || document.body; }
	
	var listenDragEnd = function(listener){ addListener('dragend', listener, this); }
	var unlistenDragEnd = function(listener){ removeListener('dragend', listener, this); }
	var listenDragStart = function(listener){ addListener('dragstart', listener, this); }
	var unlistenDragStart = function(listener){ removeListener('dragstart', listener, this); }
	
	return movableNode;

})();