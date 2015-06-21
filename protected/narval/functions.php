<?php
namespace Narval;

/*
	Функции, используемые в выражениях.
	Чтобы создать свою, опишите новый класс функции так же, как описаны остальные, и не забудьте вызвать Striter::registerFunction
*/

class isIntFunc extends Func{
	public static function getName() { return 'isInt'; }
	public function value($k, $v){
		switch($this->argCount(0, 1)){
			case 0: return is_int($v) || (is_float($v) && ((abs($v) - floor(abs($v))) == 0));
			case 1: 
				$val = $this->data[0]->value($k, $v);
				return is_int($val) || (is_float($val) && ((abs($val) - floor(abs($val))) == 0));
		}
	}
	// функцию упрощения необязательно переопределять, все будет работать без нее
	// но если вы знаете, что в некоторых случаях (а может быть, и всегда) функцию можно вычислить один раз - то лучше это сделать
	public function simplify() { return $this->argCount(0, 1) === 0? $this: Expression::simplifyThis($this);}
}
Striter::registerFunction('isIntFunc');

class isFloatFunc extends Func{
	public static function getName() { return 'isFlt'; }
	public function value($k, $v){
		switch($this->argCount(0, 1)){
			case 0: return is_int($v) || is_float($v);
			case 1: 
				$val = $this->data[0]->value($k, $v);
				return is_int($val) || is_float($val);
		}
	}
	public function simplify() { return $this->argCount(0, 1) === 0? $this: Expression::simplifyThis($this);}
}
Striter::registerFunction('isFloatFunc');

class isBooleanFunc extends Func{
	public static function getName() { return 'isBln'; }
	public function value($k, $v){
		switch($this->argCount(0, 1)){
			case 0: return is_bool($v);
			case 1: return is_bool($this->data[0]->value($k, $v));
		}
	}
	public function simplify() { return $this->argCount(0, 1) === 0? $this: Expression::simplifyThis($this);}
}
Striter::registerFunction('isBooleanFunc');

class isStringFunc extends Func{
	public static function getName() { return 'isStr'; }
	public function value($k, $v){
		switch($this->argCount(0, 1)){
			case 0: return is_string($v);
			case 1: return is_string($this->data[0]->value($k, $v));
		}
	}
	public function simplify() { return $this->argCount(0, 1) === 0? $this: Expression::simplifyThis($this);}
}
Striter::registerFunction('isStringFunc');

class isNullFunc extends Func{
	public static function getName() { return 'isNull'; }
	public function value($k, $v){
		switch($this->argCount(0, 1)){
			case 0: return is_null($v);
			case 1: return is_null($this->data[0]->value($k, $v));
		}
	}
	public function simplify() { return $this->argCount(0, 1) === 0? $this: Expression::simplifyThis($this);}
}
Striter::registerFunction('isNullFunc');

class substrFunc extends Func{
	public static function getName() { return 'substr'; }
	public function value($k, $v){
		switch($this->argCount(1, 3)){
			case 1: return substr($v, $this->data[0]->value($k, $v));
			case 2: return substr($this->data[0]->value($k, $v), $this->data[1]->value($k, $v));
			case 3: return substr($this->data[0]->value($k, $v), $this->data[1]->value($k, $v), $this->data[2]->value($k, $v));
		}
	}
	public function simplify() { return $this->argCount(1, 3) === 1? $this: Expression::simplifyThis($this);}
}
Striter::registerFunction('substrFunc');

class powFunc extends Func{
	public static function getName() { return 'pow'; }
	public function value($k, $v){
		$this->argCount(2, 2);
		$result = 1;
		$count = $this->data[1]->value($k, $v);
		$base = $this->data[0]->value($k, $v);
		while($count > 0){
			$count--;
			$result *= $base;
		}
		while($count < 0){
			$count++;
			$result /= $base;
		}
		return $result;
	}
	public function simplify() { return Expression::simplifyThis($this);}
}
Striter::registerFunction('powFunc');

class matchesFunc extends Func{
	public static function getName() { return 'matches'; }
	public function value($k, $v){
		switch($this->argCount(1, 2)){
			case 1: return preg_match($this->data[0]->value($k, $v), $v) > 0;
			case 2: return preg_match($this->data[1]->value($k, $v), $this->data[0]->value($k, $v)) > 0;
		}
	}
	public function simplify() { return $this->argCount(1, 2) === 1? $this: Expression::simplifyThis($this);}
}
Striter::registerFunction('matchesFunc');

class oneOfFunc extends Func{
	public static function getName() { return 'oneOf'; }
	public function value($k, $v){
		$result = false;
		foreach($this->data as $k => $check)
			if($check->value($k, $v)){
				if($result) return false;
				$result = true;
			}
		return $result;
	}
	public function simplify() { return Expression::simplifyThis($this);}
}
Striter::registerFunction('oneOfFunc');