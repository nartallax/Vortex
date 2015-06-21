<?php
namespace Narval;

use Exception;

/*
	Терминальные выражения - неделимые кусочки данных, присутствующие в выражении
	Подобны выражениям, заключенным в скобки
*/

// литерал - самодостаточное значение; для его вычисления не нужно ничего лишнего
class Literal extends Expression {
	public function toString(){
		if(is_bool($this->data)) return $this->data? 'true': 'false';
		if(is_null($this->data)) return 'null';
		//if(is_string($this->data)) return '"' . str_replace('"', '\"', str_replace('\\', '\\\\', $this->data)) . '"';
		if(is_string($this->data)) return '"' . str_replace('"', '\"', $this->data) . '"';
		if(is_array($this->data)) return '[...]';
		return $this->data . '';
	}
	public function __construct($val) { $this->data = $val; }
	public function addOp($op) { throw new Exception('Literal could not have operations.'); }
	public function addData($data) { throw new Exception('Literal have exactly one piece of data.'); }
	public function isConstant() { return true; }
	public function bind($cache){ return $this; }
	public function value($k, $v) { return $this->data; }
	public function simplify() { return $this; }
}

// ссылка - несамодостаточное значение; для его вычисления его нужно сначала привязать к каким-нибудь данным
class Reference extends Expression {
	private $bound = false;
	private $chain;
	public function __construct($chain){ $this->chain = $chain; }
	public function addOp($op) { throw new Exception('Reference could not have operations.'); }
	public function addData($data) { throw new Exception('Reference have exactly one piece of data.'); }
	public function toString(){ return $this->chain; }
	public function value($k, $v){
		if(!$this->bound) throw new Exception('Trying to get value of unbound reference.');
		return $this->data;
	}
	public function bind($cache){
		$this->data = $cache->resolve($this->chain);
		$this->bound = true;
		return $this;
	}
	public function isConstant() { return $this->bound; }
	public function simplify() { 
		return $this->bound? new Literal($this->data): $this;
	}
}

// специальное значение - ключ: имеет значение ключа текущего проверяемого значения
// не имеет смысла в контексте отдельного выражения, не включенного в паттерн
class KeySpecialValue extends Expression {
	public function addOp($op) { throw new Exception('Special value key could not have operations.'); }
	public function addData($data) { throw new Exception('Special value key have exactly one piece of data.'); }
	public function bind($cache) { return $this; }
	public function toString(){ return 'key'; }
	public function value($k, $v){ return is_int($k)? floatval($k): $k; }
	public function simplify() { return $this; }
}

// специальное значение - ключ: имеет значение, равное текущему проверяемому
// не имеет смысла в контексте отдельного выражения, не включенного в паттерн
class MeSpecialValue extends Expression {
	public function addOp($op) { throw new Exception('Special value me could not have operations.'); }
	public function addData($data) { throw new Exception('Special value me have exactly one piece of data.'); }
	public function bind($cache) { return $this; }
	public function toString(){ return 'me'; }
	public function value($k, $v){ return is_int($v)? floatval($v): $v; }
	public function simplify() { return $this; }
}

// функция - значение зависит от значений операндов и некоего алгоритма
// (все функции определяются не здесь)
abstract class Func extends Expression {
	abstract public static function getName();
	protected function argCount($lower, $upper){
		$result = count($this->data);
		if($result < $lower) throw new Exception('Unexpected argument count for function ' . static::getName() . ': expected at least ' . $lower. ', got ' . $result . '.');
		if($result > $upper) throw new Exception('Unexpected argument count for function ' . static::getName() . ': expected no more than ' . $upper. ', got ' . $result . '.');
		return $result;
	}
	public function addOp($op) { throw new Exception('Could not add operator to function.'); }
	public function addData($data) { $this->data[] = $data; }
	public function toString(){ 
		$result = static::getName() . '(';
		$needComma = false;
		foreach($this->data as $d){
			if($needComma) $result .= ', '; else $needComma = true;
			$result .= $d->toString();
		}
		return $result . ')';
	}
	public function simplify() { 
		foreach($this->data as $k => $child)
			$this->data[$k] = $child->simplify();
		return $this; 
	}
}
