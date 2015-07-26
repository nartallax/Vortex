/* класс, который ждет, пока завершится определенное число действий */
var waiter = (function(){

	var waiter = function(count, after, onTick){
		if(!(this instanceof waiter)) return new waiter(count, after, onTick);
		this.remain = this.start = count;
		this.after = after;
		this.onTick = onTick;
		if(count <= 0) after();
	}
	
	waiter.prototype.tick = function(){
		if(this.remain <= 0) return;
		if((--this.remain) === 0) this.after();
		else if(this.onTick) this.onTick(this.remain);
	}
	
	waiter.prototype.reset = function(){
		this.remain = this.start;
	}
	
	waiter.prototype.untick = function(){ this.remain++; }
	
	return waiter;
})();