<?php

require_once('intpair.php');

class Keccak{
	// Round Constants
	private static $RCIsProcessed = false;
	private static $RC = array( 
		'0000000000000001', '0000000000008082', '800000000000808A', '8000000080008000',
		'000000000000808B', '0000000080000001', '8000000080008081', '8000000000008009',
		'000000000000008A', '0000000000000088', '0000000080008009', '000000008000000A',
		'000000008000808B', '800000000000008B', '8000000000008089', '8000000000008003',
		'8000000000008002', '8000000000000080', '000000000000800A', '800000008000000A',
		'8000000080008081', '8000000000008080', '0000000080000001', '8000000080008008');
		
	// Rotation offsets
	private static $r = array(
			array(0,    36,     3,    41,    18),
			array(1,    44,    10,    45,     2),
			array(62,    6,    43,    15,    61),
			array(28,   55,    25,    21,    56),
			array(27,   20,    39,     8,    14)
		);
		
	// tuning variables; remain constant for single hash
	private $b, $w, $l, $nr;
	
	private static function byteToHex($b){ return ($b < 16? '0': '') . dechex($b);}
	private static function strrep($str, $rep){ $res = ''; while($rep-->0) $res .= $str; return $res; }
	private static function toUTF8hex($str){
		$result = '';
		$str = mb_convert_encoding($str, 'utf-16');
		$len = mb_strlen($str, 'utf-16');
		for($i = 0; $i < $len; $i++){
			$char = mb_substr($str, $i, 1, 'utf-16');
			$code = hexdec(bin2hex($char));
			if($code < 0x80) 
				$result .= dechex($code);
			else if($code < 0x800){
				$result .= dechex(0xc0 | ($code >> 6));
				$result .= dechex(0x80 | ($code & 0x3f));
			} else if($code < 0xd800 || $charcode >= 0xe000){
				$result .= dechex(0xe0 | ($code >> 12));
				$result .= dechex(0x80 | (($code >> 6) & 0x3f));
				$result .= dechex(0x80 | ($code & 0x3f));
			} else
				$result .= 'EFBFBD';
		}
		return strtoupper($result);
	}
	
	private function strToTable($str){
		if(($this->w % 8) !== 0) throw new Exception("W is not multiple of 8");
		if((strlen($str) % 8) !== 0) throw new Exception("String could not be divided by blocks");
		$output = array(array(), array(), array(), array(), array());
		for($i = 0; $i < 5; $i++)
			for($j = 0; $j < 5; $j++){
				$sstr = substr($str, ((((5 * $j) + $i) * $this->w) / 8) * 2, (2 * $this->w) / 8);
				if($sstr === false) $sstr = '';
				$output[$i][$j] = intpair::ofRevHex($sstr);
			}
		return $output;
	}
	private function tableToStr($table){
		if(($this->w % 8) !== 0) throw new Exception("W is not multiple of 8");
		if(count($table) !== 5) throw new Exception("Table must be 5x5");
		foreach($table as $row) if(count($row) !== 5) throw new Exception("Table must be 5x5");
		
		$output = '';
		for($i = 0; $i < 5; $i++)
			for($j = 0; $j < 5; $j++)
				$output .= $table[$j][$i]->revhex();
		return $output;
	}
	
	public function __construct($v){
		if(!Keccak::$RCIsProcessed){
			foreach(Keccak::$RC as $index => $constant)
				Keccak::$RC[$index] = intpair::ofHex($constant);
			Keccak::$RCIsProcessed = true;
		}
	
		if($v !== 25 && $v !== 50 && $v !== 100 && $v !== 200 && $v !== 400 && $v !== 800 && $v !== 1600)
			throw new Exception("Unsupported init value.");
			
		$this->b = $v;
		$this->w = $this->b / 25;
		$this->l = intval(log($this->w, 2));
		$this->nr = 12 + (2 * $this->l);
	}
	
	private function KeccakF($A){
		for($rnum = 0; $rnum < $this->nr; $rnum++){
			$B = array(array(), array(), array(), array(), array());
			$C = array();
			$D = array();
			for($i=0;$i<5;$i++)	$C[$i] = $A[$i][0]->_xor($A[$i][1])->sxor($A[$i][2])->sxor($A[$i][3])->sxor($A[$i][4]);
			for($i=0;$i<5;$i++) $D[$i] = $C[($i + 4) % 5]->_xor($C[($i + 1) % 5]->_rcl(1));
			for($i=0;$i<5;$i++) for($j=0;$j<5;$j++)	$A[$i][$j]->sxor($D[$i]);
			for($i=0;$i<5;$i++) for($j=0;$j<5;$j++)	$B[$j][((2 * $i) + (3 * $j)) % 5] = $A[$i][$j]->_rcl(Keccak::$r[$i][$j] % $this->w);
			for($i=0;$i<5;$i++) for($j=0;$j<5;$j++)	$A[$i][$j] = $B[$i][$j]->_xor($B[($i + 1) % 5][$j]->_inv()->_and($B[($i + 2) % 5][$j]));
			$A[0][0]->sxor(Keccak::$RC[$rnum]->_mpt($this->w));
		}
		return $A;
	}
	private function pad10star1($len, $str, $n){
		//echo("Before padding: $str\n");
	
		if(($n % 8) !== 0) throw new Exception("N is not multiple of 8.");
		if((strlen($str) % 2) !== 0) $str .= '0';
		if($len > ((strlen($str) / 2) * 8)) throw new Exception("the string is too short to contain the number of bits announced");
		
		$nrBytesFilled = $len / 8;
		$nbrBitsFilled = $len % 8;
		$l = $len % $n;
		$nInRange = (($n < 10) && ($n > 3));
		
		$myByte = $nbrBitsFilled === 0? 0: hexdec(substr($str, $nrBytesFilled * 2, 2));
		$myByte = ($myByte >> (8 - $nbrBitsFilled)) + pow(2, $nbrBitsFilled) + ($nInRange? 128: 0);
		$str = substr($str, 0, $nrBytesFilled * 2) . Keccak::byteToHex($myByte);
		if(!$nInRange){
			while((((8 * strlen($str)) / 2) % $n) < ($n - 8))
				$str .= '00';
			$str .= '80';
		}
		
		return $str;
	}
	private function Keccak($len, $str, $r, $c, $n){
		
		if(($r < 0) || ($r % 8) !== 0) throw new Exception('r must be a multiple of 8 in this implementation');
		if(($n % 8) !== 0) throw new Exception('outputLength must be a multiple of 8');
		
		$S = array(array(0,0,0,0,0), array(0,0,0,0,0), array(0,0,0,0,0), array(0,0,0,0,0), array(0,0,0,0,0));
		for($i = 0; $i < 5; $i++)
			for($j = 0; $j < 5; $j++)
				$S[$i][$j] = new intpair(0,0);
		
		$P = $this->pad10star1($len, $str, $r);
		
		$iterlim = ((strlen($P) * 8) / 2) / $r;
		for($i = 0; $i < $iterlim; $i++){
			$offset = $i * ((2 * $r) / 8);
			$offsetPlus = ($i + 1) * ((2 * $r) / 8);
			$Pi = $this->strToTable(substr($P, $offset, $offsetPlus - $offset) . Keccak::strrep('00', $c / 8));
			
			for($j = 0; $j < 5; $j++)
				for($k = 0; $k < 5; $k++)
					$S[$k][$j] = $Pi[$k][$j]->_xor($S[$k][$j]);
			$S = $this->KeccakF($S);
		}
		
		$Z = '';
		$olen = $n;
		while($olen > 0){
			$Z .= substr($this->tableToStr($S), 0, ($r * 2) / 8);
			$olen -= $r;
			if($olen > 0) $S = KeccakF($S);
		}
		
		return substr($Z, 0, (2 * $n) / 8);
		
	}
	
	private static $salt = '';
	public static function of($str){
		return Keccak::ofHex(Keccak::toUTF8hex($str . Keccak::$salt));
	}
	public static function ofHex($hex){
		$k = new Keccak(1600);
		return $k->Keccak(strlen($hex) * 4, $hex, 576, 1024, 512);
	}
	public static function setSalt($salt){
		Keccak::$salt = $salt;
	}
}

//echo(Keccak::of('9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e863831171e90730b5c645c6577998ce137d71f75864cea0aed428040f4b7e5ccb4db52c824e9b742d07f77240ba9e986db1ceb03bd945a77f905f484c65f9909c7b4fd9b9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'));