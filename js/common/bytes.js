/* 
	вспомогательный класс для операций над массивом байт 
	подразумевается, что весь массив - одно большое число произвольной разрядности;
	все неопределенные разряды этого числа - старшие и считаются равными нулю
*/
var bytes = (function(){
	// utils
	var splitByBytes = function(val){
		var result = [];
		while(val > 0) {
			result.push(val % 256);
			val = ~~(val / 256);
		}
		return result;
	}
	var byteToBin = function(num){
		var result = '';
		for(var i = 0; i < 8; i++){
			result = (num % 2) + result;
			num = ~~(num/2);
		}
		return result;
	}
	var hexToBytes = function(hex){
		if((hex.length % 2) !== 0) hex = '0' + hex;
		var i = hex.length, result = [];
		while((i -= 2) >= 0) result.push(parseInt('0x' + hex.substr(i, 2)));
		return result;
	}
	
	// constructor
	var bytes = function(v, inv){
		if(v instanceof bytes) return v;
		if(!(this instanceof bytes)) return new bytes(v, inv);
		switch(typeof(v)){
			case 'number': this.val = splitByBytes(v); break;
			case 'string': this.val = hexToBytes(inv? bytes(v).revhex(): v); break;
			case 'object': this.val = v; break; // assuming array
			default: throw "Could not create bytes of '"  + v + "'.";
		}
		return this;
	}
	
	// basic type conversion
	bytes.prototype.num = function(){
		var result = 0, a = this.val, i = a.length;
		while(i-->0){
			result *= 256;
			result += this.val[i];
		}
		return result;
	}
	bytes.prototype.bin = function(){
		var result = '', a = this.val, i = a.length;
		while(--i>=0) result = byteToBin(a[i]) + result;
		return result;
	}
	bytes.prototype.hex = function(){
		var result = '', a = this.val, i = a.length;
		while(--i>=0) result += ((a[i] < 16?'0':'') + a[i].toString(16));
		return result.toUpperCase();
	}
	bytes.prototype.revhex = function(){
		var result = '', a = this.val, i = a.length;
		while(--i>=0) result = ((a[i] < 16?'0':'') + a[i].toString(16)) + result;
		return result.toUpperCase();
	}
	bytes.prototype.toString = function(){return this.hex();}
	
	// basic data operationa
	var xor = function(a, b){
		var result = [], l = a.length > b.length? a.length: b.length, i = -1;
		while(++i < l) result.push((a[i] || 0) ^ (b[i] || 0));
		return result;
	}
	var and = function(a, b){
		var result = [], l = a.length > b.length? a.length: b.length, i = -1;
		while(++i < l) result.push((a[i] || 0) & (b[i] || 0));
		return result;
	}
	var or = function(a, b){
		var result = [], l = a.length > b.length? a.length: b.length, i = -1;
		while(++i < l) result.push((a[i] || 0) | (b[i] || 0));
		return result;
	}
	var inv = function(a){
		var result = [];
		for(var i in a) result.push(~a[i]);
		return result;
	}
	var rol = function(a, v){
		var result = [], zeroes = ~~(v / 8), b, p;
		while(zeroes-->0) result.push(0);
		v %= 8;
		for(var i in a){
			b = a[i];
			p = a[i - 1] || 0;
			b = (b * 256) + p;
			b = b << v;
			b &= 0xff00;
			b = b >> 8;
			result.push(b);
		}
		b = a[a.length - 1];
		b = b << v;
		b &= 0xff00;
		b = b >> 8;
		if(b !== 0)	result.push(b);
		return result;
	}
	var ror = function(a, v){
		var result = [], i = (~~(v / 8)) - 1, b, p;
		v %= 8;
		while(++i < a.length){
			b = a[i];
			p = a[i + 1] || 0;
			b = (p * 256) + b;
			b = b >> v;
			b &= 0xff;
			result.push(b);
		}
		return result;
	}
	var size = function(a, s){
		var result = [], i = -1;
		while(++i < s) result[i] = (a[i] || 0);
		return result;
	}
	var rcl = function(a, v){
		var lstart = a.length, pos = ~~(v / 8), sub = rol(a, v % 8), result = [];
		if(sub.length > lstart) sub[0] |= sub.pop();
		var i = sub.length;
		while(i-->0)
			result[(i + pos) % sub.length] = sub[i];
		return result;
	}
	var mpt = function(a, v){ // mpt = Modulo by Power of Two. expecting number
		var result = [], i = 0;
		while(v >= 8){
			result.push(a[i++]);
			v -= 8;
		}
		switch(v){
			case 0: return result;
			case 1: v = 0x1; break;
			case 2: v = 0x3; break;
			case 3: v = 0x7; break;
			case 4: v = 0xf; break;
			case 5: v = 0x1f; break;
			case 6: v = 0x3f; break;
			case 7: v = 0x7f; break;
		}
		result.push(a[i] & v);
		return result;
	}
	// no rcr yet
	
	// data operation bindings
	bytes.prototype.sxor = 	function(v){ this.val = xor(this.val, bytes(v).val); return this;}
	bytes.prototype.xor = 	function(v){ return new bytes(xor(this.val, bytes(v).val)); }
	bytes.prototype.sand = 	function(v){ this.val = and(this.val, bytes(v).val); return this;}
	bytes.prototype.and = 	function(v){ return new bytes(and(this.val, bytes(v).val)); }
	bytes.prototype.sor = 	function(v){ this.val = or(this.val, bytes(v).val); return this;}
	bytes.prototype.or = 	function(v){ return new bytes(or(this.val, bytes(v).val)); }
	bytes.prototype.inv = 	function(){ return new bytes(inv(this.val));}
	bytes.prototype.sinv = 	function(){ this.val = or(this.val, bytes(v).val); return this;}
	bytes.prototype.rol = 	function(v){ return new bytes(rol(this.val, v)); }
	bytes.prototype.srol = 	function(v){ this.val = rol(this.val, v); return this; }
	bytes.prototype.ror = 	function(v){ return new bytes(ror(this.val, v)); }
	bytes.prototype.sror = 	function(v){ this.val = ror(this.val, v); return this; }
	bytes.prototype.size = 	function(v){ return new bytes(size(this.val, v)); }
	bytes.prototype.ssize =	function(v){ this.val = size(this.val, v); return this; }
	bytes.prototype.rcl = 	function(v){ return new bytes(rcl(this.val, v)); }
	bytes.prototype.srcl = 	function(v){ this.val = rcl(this.val, v); return this; }
	bytes.prototype.mpt = 	function(v){ return new bytes(mpt(this.val, v)); }
	bytes.prototype.smpt = 	function(v){ this.val = mpt(this.val, v); return this; }
	
	return bytes;
})();