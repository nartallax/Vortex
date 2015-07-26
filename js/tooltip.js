var tooltip = (function(){
	
	var tooltip = function(node){
		if(!(this instanceof tooltip)) return new tooltip(node);
		this.bindedNode = null;
		this.show = show.curry(this);
		this.move = move.curry(this);
		this.node = tag('div', 'position:absolute;z-index:100000;overflow:visible');
		this.node.appendChild(node);
	}
	
	var show = function(ttip, e){
		e = e || window.event;clog
		ttip.pos(e.clientX, e.clientY);
		(tooltip.root || document.body).appendChild(ttip.node);
		addListener('mousemove', ttip.move);
	}
	
	var hide = function(ttip){
		removeListener('mousemove', ttip.move);
		ttip.node.parentNode.removeChild(ttip.node);
	}
	
	var move = function(ttip, e){
		e = e || window.event;
		var rect, x = e.clientX, y = e.clientY;
		
		try {
			rect = ttip.bindedNode.getBoundingClientRect();
		} catch(e){
			return hide(ttip);
		}
		
		ttip.pos(x, y);
		if(x < rect.left || x > rect.right || y > rect.bottom || y < rect.top) 
			hide(ttip);
	}
	
	tooltip.prototype.bind = function(node){
		if(this.bindedNode)
			removeListener('mouseover', this.show, this.bindedNode);
		this.bindedNode = node;
		addListener('mouseover', this.show, node);
	}
	
	tooltip.prototype.pos = function(x, y){
		x += (tooltip.root || document.body).scrollLeft + 5;
		y += (tooltip.root || document.body).scrollTop + 5;
		this.node.style.top = y + 'px';
		this.node.style.left = x + 'px';
	}
	
	tooltip.root = null;
	tooltip.setRoot = function(node){ this.root = node; }
	
	return tooltip;
	
})();