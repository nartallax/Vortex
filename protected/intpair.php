<?php

// класс, представляющий пару интов
// нужен для надежного и достаточно шустрого представления 64 бит
// писался для использования при вычислении Keccak
class intpair{
	public $a, $b; // a - старшие 32 бита, b - младшие
	
	// bitwise 32bit int shift right, filling space with zeroes (not sign bit) using only bitwise operators
	// simple $i / (2 << $v) goes wrong under some conditions
	private static function sr($i, $v){
		return (($i & 0x7fffffff) >> $v) | ((1 << (31 - $v)) & ($i >> $v));
	}
	
	private static function reverseHex($s){
		return strtoupper(
			substr($s, 14, 2) . substr($s, 12, 2) . substr($s, 10, 2) . substr($s, 8, 2) .
			substr($s, 6, 2) .  substr($s, 4, 2) .  substr($s, 2, 2) .  substr($s, 0, 2)
		);
	}
	
	public function __construct($a, $b){$this->a = $a; $this->b = $b;}
	public static function ofHex($h){return new intpair(hexdec(substr($h, 0, 8)), hexdec(substr($h, 8))); }
	public static function ofRevHex($h){return intpair::ofHex(intpair::reverseHex($h)); }
	
	// преобразования в строку
	public function hex(){
		$a = dechex($this->a);
		$b = dechex($this->b);
		$z = '00000000';
		return strtoupper(substr($z, strlen($a)) . $a . substr($z, strlen($b)) . $b);
	}
	public function bin(){
		$a = decbin($this->a);
		$b = decbin($this->b);
		$z = '00000000000000000000000000000000';
		return strtoupper(substr($z, strlen($a)) . $a . substr($z, strlen($b)) . $b);
	}
	public function revhex(){ return intpair::reverseHex($this->hex()); }
	
	public function _xor($p){	return new intpair(	$this->a ^ $p->a, 	$this->b ^ $p->b);	}	
	public function sxor($p){	$this->a ^= $p->a; 	$this->b ^= $p->b; 	return $this;		}
	public function _and($p){	return new intpair(	$this->a & $p->a, 	$this->b & $p->b);	}	
	public function sand($p){	$this->a &= $p->a; 	$this->b &= $p->b; 	return $this;		}
	public function _or($p){	return new intpair(	$this->a | $p->a, 	$this->b | $p->b);	}	
	public function sor($p){	$this->a |= $p->a; 	$this->b |= $p->b; 	return $this;		}
	public function _inv(){		return new intpair(	~$this->a,			~$this->b);			}	
	public function sinv(){		$this->a=~$this->a; $this->b=~$this->b;	return $this;		}
	public function _rcl($v){
		$v %= 64;
		if($v > 32) 	return $this->_rcr(64 - $v);
		if($v === 32) 	return new intpair($this->b, $this->a);
		if($v === 0)	return new intpair($this->a, $this->b);
		$ra = intpair::sr($this->a, 32 - $v);
		$rb = intpair::sr($this->b, 32 - $v);
		return new intpair((($this->a << $v) & 0xffffffff) | $rb, (($this->b << $v) & 0xffffffff) | $ra);
	}
	public function _rcr($v){
		$v %= 64;
		if($v > 32) 	return $this->_rcl(64 - $v);
		if($v === 32) 	return new intpair($this->b, $this->a);
		if($v === 0)	return new intpair($this->a, $this->b);
		$ra = ($this->a << (32 - $v)) & 0xffffffff;
		$rb = ($this->b << (32 - $v)) & 0xffffffff;
		return new intpair(intpair::sr($this->a, $v) | $rb, intpair::sr($this->b, $v) | $ra);
	}
	public function srcl($v){
		$v %= 64;
		if($v > 32) 	return $this->srcr(64 - $v);
		if($v === 0)	return $this;
		if($v === 32){
			$this->a ^= $this->b;
			$this->b ^= $this->a;
			$this->a ^= $this->b;
			return $this;
		}
		$ra = intpair::sr($this->a, 32 - $v);
		$rb = intpair::sr($this->b, 32 - $v);
		$this->a = (($this->a << $v) & 0xffffffff) | $rb;
		$this->b = (($this->b << $v) & 0xffffffff) | $ra;
		return $this;
	}
	public function srcr($v){
		$v %= 64;
		if($v > 32) 	return $this->srcl(64 - $v);
		if($v === 0)	return $this;
		if($v === 32) {
			$this->a ^= $this->b;
			$this->b ^= $this->a;
			$this->a ^= $this->b;
			return $this;
		}
		$ra = ($this->a << (32 - $v)) & 0xffffffff;
		$rb = ($this->b << (32 - $v)) & 0xffffffff;
		$this->a = intpair::sr($this->a, $v) | $rb;
		$this->b = intpair::sr($this->b, $v) | $ra;
		return $this;
	}
	public function _mpt($v){
		return new intpair(
			$v >= 64? $this->a: ($v < 32? 0: ($this->a & ((1 << ($v - 32)) - 1))),
			$v >= 32? $this->b: ($this->b & ((1 << $v) - 1)));
	}
	public function smpt($v){
		//$this->a &= $v >= 64? 0xffffffff: $v < 32? 0: ((1 << ($v - 32)) - 1);
		//$this->b &= $v >= 32? 0xffffffff: ((1 << $v) - 1);
		$this->a = $v >= 64? $this->a: ($v < 32? 0: ($this->a & ((1 << ($v - 32)) - 1)));
		$this->b = $v >= 32? $this->b: ($this->b & ((1 << $v) - 1));
		return $this;
	}
}