/* класс, который ждет, пока завершится определенное число действий */
var waiter = (function(){

	var waiter = function(count, after, onTick){
		if(!(this instanceof waiter)) return new waiter(count, after, onTick);
		this.remain = this.start = count;
		this.after = after;
		this.onTick = onTick;
		if(count <= 0) after();
		
		var w = this;
		this.tick = function(){ w.doTick(); }
		this.reset = function(){ w.doReset(); }
		this.untick = function(){ w.doUntick(); }
		
	}
	
	waiter.prototype.doTick = function(){
		if(this.remain <= 0) return;
		if((--this.remain) === 0) this.after();
		else if(this.onTick) this.onTick(this.remain);
	}
	
	waiter.prototype.doReset = function(){
		this.remain = this.start;
	}
	
	waiter.prototype.doUntick = function(){ this.remain++; }
	
	return waiter;
})();