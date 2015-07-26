var dropSite = (function(){

	var mouseIsCaptured = false;

	var dropSite = function(node){
		
		if(!mouseIsCaptured){
			addListener('mousemove', testMouseOver);
			mouseIsCaptured = true;
		}

		node.className += ' drop-site';
		node.isDropSite = true;
		
		node.setContent = setContent;
		node.getContent = getContent;
		
		return node;
	}
	
	var setCurrent = function(node){
		if(dropSite.current === node) return;
		if(dropSite.current) removeClass(dropSite.current, 'highlighted');
		if(node) {
			addClass(node, 'highlighted');
			dropSite.current = node;
		} else dropSite.current = null;
	}
	
	var testMouseOver = function(e){
		e = e || window.event;
	
		var root = movableNode.getRoot(),
			x = e.clientX,
			y = e.clientY;
		
		if(movableNode.current){
			var nodes = elsByClass('drop-site');
			for(var i in nodes){
				var rect = nodes[i].getBoundingClientRect();
				if(x > rect.left && x < rect.right && y > rect.top && y < rect.bottom){
					setCurrent(nodes[i]);
					return;
				}
			}
		}
		
		setCurrent(null);
	}
	
	var setContent = function(node){
		this.innerHTML = '';
		this.appendChild(node);
	}
	
	var getContent = function(){
		return this.children[0];
	}
	
	return dropSite;

})();