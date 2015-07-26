/*
	имплементация хеш-функции Keccak (а именно, перевод с Питона эталонной имплементации)
	не проходит все эталонные тесты sha-3 (питонья имплементация тоже не проходит)
*/

var Keccak = (function(){
	
	// Round Constants
	var RC = [	bytes('0000000000000001'), bytes('0000000000008082'), bytes('800000000000808A'), bytes('8000000080008000'),
				bytes('000000000000808B'), bytes('0000000080000001'), bytes('8000000080008081'), bytes('8000000000008009'),
				bytes('000000000000008A'), bytes('0000000000000088'), bytes('0000000080008009'), bytes('000000008000000A'),
				bytes('000000008000808B'), bytes('800000000000008B'), bytes('8000000000008089'), bytes('8000000000008003'),
				bytes('8000000000008002'), bytes('8000000000000080'), bytes('000000000000800A'), bytes('800000008000000A'),
				bytes('8000000080008081'), bytes('8000000000008080'), bytes('0000000080000001'), bytes('8000000080008008')];
				
	// Rotation offsets
	var r = [	[0,    36,     3,    41,    18],
				[1,    44,    10,    45,     2],
				[62,    6,    43,    15,    61],
				[28,   55,    25,    21,    56],
				[27,   20,    39,     8,    14]];

	// tuning variables; remain constant for single hash
	var b, w, l, nr;
	
	var byteToHex = function(b){ return (b < 16? '0': '') + b.toString(16); }
	var strrep = function(str, rep) { var res = ''; while(rep-->0) res += str; return res; }
	
	var strToTable = function(str){
		if((w % 8) !== 0) throw "W is not multiple of 8";
		if(str.length !== (~~((2 * b)/8))) throw "String could not be divided by blocks";
		var i, j, output = [[],[],[],[],[]];
		for(i = 0; i < 5; i++)
			for(j = 0; j < 5; j++)
				output[i][j] = bytes(str.substr(2 * (~~((((5 * j) + i) * w)/8)), ~~((2 * w)/8)), true);
		return output;
	}
	
	var tableToStr = function(table){
		if((w % 8) !== 0) throw "W is not multiple of 8";
		if(table.length !== 5) throw "Table must be 5x5";
		for(var i in table) if(table[i].length !== 5) throw "Table must be 5x5";
		
		var output = '', i, j;
		for(i = 0; i < 5; i++)
			for(j = 0; j < 5; j++)
				output += table[j][i].revhex();
		return output;
	}
	
	var init = function(initval){
		if(initval !== 25 && initval !== 50 && initval !== 100 && initval !== 200 && initval !== 400 && initval !== 800 && initval !== 1600)
			throw "Unsupported init value.";
			
		b = initval;
		w = ~~(b / 25);
		l = ~~(Math.log(w) / Math.log(2));
		nr = 12 + (2 * l);
	}
	
	var KeccakF = function(A){
		for(var rnd = 0; rnd < nr; rnd++) {
		
			var B = [[],[],[],[],[]], C = [], D = [], i, j;
		
			for(i = 0; i < 5; i++)	C[i] = A[i][0].xor(A[i][1]).xor(A[i][2]).xor(A[i][3]).xor(A[i][4]);
			for(i = 0; i < 5; i++)	D[i] = C[(i + 4) % 5].xor(C[(i + 1) % 5].rcl(1)); 
			for(i = 0; i < 5; i++)	for(j = 0; j < 5; j++)	A[i][j].sxor(D[i]);
			for(i = 0; i < 5; i++)	for(j = 0; j < 5; j++)	B[j][((2 * i) + (3 * j)) % 5] = A[i][j].rcl(r[i][j] % w);
			for(i = 0; i < 5; i++)	for(j = 0; j < 5; j++)	A[i][j] = B[i][j].xor(B[(i + 1) % 5][j].inv().and(B[(i + 2) % 5][j]));
			A[0][0].sxor(RC[rnd].mpt(w));
			
		}
		return A;
	}
	
	var pad10star1 = function(len, str, n){
		if((n % 8) !== 0) throw "N is not multiple of 8."
		if((str.length % 2) !== 0) str += '0';
		if(len > ((~~(str.length / 2)) * 8)) throw "the string is too short to contain the number of bits announced";
		
		var nrBytesFilled = ~~(len/8), nbrBitsFilled = len % 8, l = len % n, myByte, nInRange = (n < 10 && n > 3);
		
		myByte = nbrBitsFilled === 0? 0: parseInt('0x' + str.substr(nrBytesFilled * 2, 2), 16);
		myByte = (myByte >> (8 - nbrBitsFilled)) + Math.pow(2, nbrBitsFilled) + (nInRange? Math.pow(2, 7): 0);
		str = str.substring(0, nrBytesFilled * 2) + byteToHex(myByte);
		if(!nInRange) {
			while(((~~((8 * str.length) / 2)) % n) < (n - 8)) 
				str += '00';
			str += '80';
		}
		
		return str;
	}
	
	var Keccak = function(len, str, r, c, n){
		if(r === undefined) r = 1024;
		if(c === undefined) c = 576;
		if(n === undefined) n = 1024;
		
		if((r < 0) || ((r % 8) !== 0)) throw 'r must be a multiple of 8 in this implementation';
		if((n % 8) !== 0) throw 'outputLength must be a multiple of 8';
		
		init(r + c);
		
		var S = [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]], P = pad10star1(len, str, r);
		
		var iterlim = ~~(~~((P.length * 8) / 2) / r), i, j, k;
		for(i = 0; i < iterlim; i++){
			var Pi = strToTable(P.substring(i * (~~((2 * r)/8)), (i + 1) * (~~((2 * r)/8))) + strrep('00',~~(c/8)));
			for(j = 0; j < 5; j++) 
				for(k = 0; k < 5; k++) 
					S[k][j] = Pi[k][j].xor(S[k][j]);
			S = KeccakF(S);
		}
		
		var Z = '', outputLength = n;
		while(outputLength > 0){
			Z += tableToStr(S).substring(0, ~~((r * 2)/8));
			outputLength -= r;
			if(outputLength > 0) S = KeccakF(S);
		}
		
		return Z.substring(0, ~~((2 * n)/8));
	}
	
	var toUTF8Array = function (str) {
		var utf8 = [];
		for (var i=0; i < str.length; i++) {
			var charcode = str.charCodeAt(i);
			if (charcode < 0x80) 
				utf8.push(charcode);
			else if (charcode < 0x800) 
				utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
			else if (charcode < 0xd800 || charcode >= 0xe000)
				utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode>>6) & 0x3f), 0x80 | (charcode & 0x3f));
			else
				// let's keep things simple and only handle chars up to U+FFFF...
				utf8.push(0xef, 0xbf, 0xbd); // U+FFFE "replacement character"
		}
		return utf8;
	}
	
	var salt = '';
	
	var hashString = function(str){ 
		str = bytes(toUTF8Array(str + salt)).revhex();
		return Keccak(str.length * 4, str, 576, 1024, 512);
	}
			
	hashString.ofHex = function(hex){
		return Keccak(hex.length * 4, hex, 576, 1024, 512)
	}
	
	hashString.setSalt = function(s){ salt = s; }
			
	return hashString;
})();