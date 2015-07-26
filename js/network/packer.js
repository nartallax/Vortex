/*

	Это - Упаковщик.
	
	Его главное предназначение - делать из произвольных данных набор байт, 
	теоретически, занимающих меньше места, чем JSON с теми же данными,
	а потом - разжимать эти байты обратно.
	
	Этот модуль был написан и более-менее успешно протестирован.
	
	На практике оказался не нужен, т.к. проиграл в сжатии zlib-у, примененному на JSON-е
	(и в силе сжатия, и в производительности)
	
	Фактически, никто не мешает комбинировать zlib и этот модуль в случае достаточно больших объемов данных.

*/
var packer = (function(){
	
	var bm;
	
	var consts = {
		null: 0,
		object: 1,
		array: 10,
		string: 19,
		int: 28,
		negint: 37,
		double: 46,
		true: 47,
		false: 48,
		link: 49,
		
		maxIntLength: 8
	};
	
	var getDataTest = function(data){
		return function(){ return packer.unpack(packer.pack(data)).equals(data) }
	}
	var tests = [
		function(){
			return 	getIntSize(0x0000000000000000) === 0 &&
					getIntSize(0x0000000000000001) === 1 && getIntSize(0x0000000000000010) === 1 &&
					getIntSize(0x0000000000000100) === 2 && getIntSize(0x0000000000001000) === 2 &&
					getIntSize(0x0000000000010000) === 3 && getIntSize(0x0000000000100000) === 3 &&
					getIntSize(0x0000000001000000) === 4 && getIntSize(0x0000000010000000) === 4 &&
					getIntSize(0x0000000100000000) === 5 && getIntSize(0x0000001000000000) === 5 &&
					getIntSize(0x0000010000000000) === 6 && getIntSize(0x0000100000000000) === 6 &&
					getIntSize(0x0001000000000000) === 7 && getIntSize(0x0010000000000000) === 7 &&
					getIntSize(0x0100000000000000) === 8 && getIntSize(0x1000000000000000) === 8 &&
					getIntSize(-0x0000000000000000) === 0 &&
					getIntSize(-0x0000000000000001) === 1 && getIntSize(-0x0000000000000010) === 1 &&
					getIntSize(-0x0000000000000100) === 2 && getIntSize(-0x0000000000001000) === 2 &&
					getIntSize(-0x0000000000010000) === 3 && getIntSize(-0x0000000000100000) === 3 &&
					getIntSize(-0x0000000001000000) === 4 && getIntSize(-0x0000000010000000) === 4 &&
					getIntSize(-0x0000000100000000) === 5 && getIntSize(-0x0000001000000000) === 5 &&
					getIntSize(-0x0000010000000000) === 6 && getIntSize(-0x0000100000000000) === 6 &&
					getIntSize(-0x0001000000000000) === 7 && getIntSize(-0x0010000000000000) === 7 &&
					getIntSize(-0x0100000000000000) === 8 && getIntSize(-0x1000000000000000) === 8;
		},
		getDataTest(0),
		getDataTest(15),
		getDataTest(0xfffffffffffffff),
		getDataTest(-0xfffffffffffffff),
		getDataTest(0.1),
		getDataTest(10000000.1),
		getDataTest(-10000000.1),
		getDataTest("first"),
		getDataTest("Brown fox jumped over lasy dog."),
		getDataTest("Сорок тысяч обезьян! Щачло! ёЁъЪиИйЙ"),
		getDataTest("スラッシュドット・ジャパン -- アレゲなニュースと雑談サイト"),
		getDataTest(""),
		getDataTest({a:10, b:15}),
		getDataTest(['abc','abc', 'abC']),
		getDataTest({first:{first: null, second:[1,2,4], third: null}, second: [null, null, {first:"first"}, 15]})
	];
	
	var getIntSize = function(val){
		//return val === 0? 0: ~~(((val < 0? -val: val).toString(16).length + 1) / 2);
		return 	val > 0?
					val < 0x000000000000100? 1:
					val < 0x000000000010000? 2:
					val < 0x000000001000000? 3:
					val < 0x000000100000000? 4:
					val < 0x000010000000000? 5:
					val < 0x001000000000000? 6:
					val < 0x100000000000000? 7: 8:
				val === 0? 0: getIntSize(-val);
	}
	
	var byteReader = function(data){
		this.data = data;
		this.stringCache = {};
		this.stringsInCache = 0;
		this.pos = 0;
	}
	byteReader.prototype.putStringInCache = function(str){
		this.stringsInCache++;
		this.stringCache[this.stringsInCache] = str;
	}
	byteReader.prototype.get = function(){ return this.data[this.pos++]; }
	byteReader.prototype.int = function(len){
		var result = 0, mult = 1;
		while(len--){
			result += this.get() * mult;
			mult *= 256;
		}
		return result;
	}
	byteReader.prototype.double = function(){
		var buffer = new ArrayBuffer(8),
			bArr = new Uint8Array(buffer),
			fArr = new Float64Array(buffer),
			i = -1;
			
		while(++i < 8) bArr[i] = this.get();
		
		return fArr[0];
	}
	byteReader.prototype.read = function(){
		var typeByte = this.get();
		if(typeByte >= consts.link && typeByte <= consts.link + consts.maxIntLength ) return this.stringCache[this.int(typeByte - consts.link)];
		if(typeByte >= consts.int && typeByte <= consts.int + consts.maxIntLength ) return this.int(typeByte - consts.int);
		if(typeByte >= consts.object && typeByte <= consts.object + consts.maxIntLength ){
			var result = {}, size = this.int(typeByte - consts.object), key, val;
			while(size--){
				key = this.read();
				val = this.read();
				if(typeof(key) !== 'string') throw 'Object key is not string: "' + key + '" (' + typeof(key) + ').';
				addProp(result, key, val, true, true);
			}
			return result;
		}
		if(typeByte >= consts.array && typeByte <= consts.array + consts.maxIntLength ){
			var result = [], size = this.int(typeByte - consts.array);
			while(size--) result.push(this.read());
			return result;
		}
		if(typeByte >= consts.string && typeByte <= consts.string + consts.maxIntLength ){
			var size = this.int(typeByte - consts.string), bytes = [], result = "";
			if(size > 0) {
				while(size--) bytes.push(this.get());
				result = String.fromUTF8Array(bytes);
				this.putStringInCache(result);
			}
			return result;
		}
		if(typeByte === consts.null) return null;
		if(typeByte === consts.true) return true;
		if(typeByte === consts.false) return false;
		if(typeByte === consts.double) return this.double();
		if(typeByte >= consts.negint && typeByte <= consts.negint + consts.maxIntLength ) return -this.int(typeByte - consts.negint);
		throw 'Type code not recognized: ' + typeByte;
	}
	
	var byteWriter = function(){
		this.data = [];
		this.stringCache = {};
		this.stringsInCache = 0;
	}
	byteWriter.prototype.putStringInCache = function(str){
		this.stringsInCache++;
		addProp(this.stringCache, str, this.stringsInCache);
	}
	byteWriter.prototype.getResult = function(){ return new Uint8Array(this.data); }
	byteWriter.prototype.int = function(data, offset){
		var len = getIntSize(data);
		this.data.push(len + offset);
		
		while(len--){
			this.data.push(data % 256);
			// НЕ округлять через ~~ - верхние 32 бита зануляются
			data = (data - (data % 256))/ 256;
		}
	}
	byteWriter.prototype.double = function(data){
		var buffer = new ArrayBuffer(8),
			bArr = new Uint8Array(buffer),
			fArr = new Float64Array(buffer),
			i = -1;
			
		fArr[0] = data;
		
		while(++i < 8) this.data.push(bArr[i]);
	}
	byteWriter.prototype.write = function(data){
		if(data === undefined) data = null;
		switch(typeof(data)){
			case 'boolean': return this.data.push(data? consts.true: consts.false);
			case 'number':
				if(data % 1 !== 0){
					this.data.push(consts.double);
					return this.double(data);
				}
				this.int(data < 0? -data: data, data < 0? consts.negint: consts.int);
				return;
			case 'object':
				if(data === null) return this.data.push(consts.null);
				if(Array.isArray(data)){
					this.int(data.length, consts.array);
					for(var i in data) this.write(data[i]);
					return;
				}
				this.int(data.size(), consts.object);
				for(var i in data){
					this.write(i);
					this.write(data[i]);
				}
				return;
			case 'string':
				var cacheId = this.stringCache[data];
				if(cacheId > 0) return this.int(cacheId, consts.link);
				var bytes = data.toUTF8Array();
				this.int(bytes.length, consts.string);
				for(var i in bytes) this.data.push(bytes[i]);
				if(data) this.putStringInCache(data);
				return;
			default:
				throw 'Could not convert to bytes value of type "' + typeof(data) + '".';
		}
	}
	
	return { 
		unpack: function(data){ return new byteReader(data).read(); },
		pack: function(data){
			//clog('writing '  + data);
			//bm = new benchmarker();
			var writer = new byteWriter();
			writer.write(data);
			//clog(bm.toString());
			return writer.getResult();
		},
		test: function(){
			try {
				for(var i in tests)
					if(!tests[i]())
						return false;
			} catch(e){
				return false;
			}
			return true;
		}
	}
	
})();