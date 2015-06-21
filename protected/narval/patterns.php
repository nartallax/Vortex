<?php
namespace Narval;

/*
	Паттерн - шаблон для валидации какого-либо конечного значения.
*/

abstract class Pattern {
	public abstract function check($k, $v);
	public abstract function bind($cache);
	public abstract function simplify();
	public abstract function toString();
}

// паттерн для валидации ассоциативного массива (объекта)
class ObjPattern extends Pattern {
	private $kv = array();
	private $optionals = array();
	
	private $commonCheck = null;
	public function setCommonCheck($check){ $this->commonCheck = $check; }
	
	public function addKeyValue($k, $v, $isOptional){
		$this->kv[$k] = $v;
		$this->optionals[$k] = $isOptional;
	}
	public function bind($cache){ 
		if($this->commonCheck !== null)
			$this->commonCheck->bind($cache);
		foreach($this->kv as $check) 
			$check->bind($cache); 
		return $this;}
	public function simplify(){ 
		foreach($this->kv as $k => $v) 
			$this->kv[$k] = $v->simplify(); 
		return $this;}
	public function toString(){
		$result = '{';
		$first = true;
		foreach($this->kv as $k => $v){
			if($first) $first = false; else $result .= ', ';
			$result .= $k . ($this->optionals[$k]? '?':'') . ': ' . $v->toString();
		}
		return $result . '}' . ($this->commonCheck === null? '': (':' . $this->commonCheck->toString()));
	}
	public function check($k, $v){
		if($this->commonCheck !== null && !$this->commonCheck->check($k, $v)) return false;
		
		if(!is_array($v)) return false;
		$kv = $this->kv;
		
		foreach($v as $dataKey => $dataValue)
			if(!array_key_exists($dataKey, $kv)) return false;
		
		foreach($kv as $key => $check){
			if(!array_key_exists($key, $v))
				if(!$this->optionals[$key]) return false;
				else continue;
			if(!$check->check($key, $v[$key])) return false;
		}
		
		return true;
	}
}

// паттерн для валидации массива с произвольными индексами
class ArrPattern extends Pattern {
	private $check;
	
	private $commonCheck = null;
	public function setCommonCheck($check){ $this->commonCheck = $check; }
	
	public function __construct($check){ $this->check = $check; }
	public function bind($cache){ 
		if($this->commonCheck !== null)
			$this->commonCheck->bind($cache);
		$this->check->bind($cache); 
		return $this;
	}
	public function simplify(){ $this->check = $this->check->simplify(); return $this;}
	public function toString(){ 
		return '[' . $this->check->toString() . ']' . ($this->commonCheck === null? '': (':' . $this->commonCheck->toString()));
	}
	public function check($k, $v){
		if($this->commonCheck !== null && !$this->commonCheck->check($k, $v)) return false;
		
		if(!is_array($v)) return false;
		$check = $this->check;
		
		foreach($v as $dataKey => $dataValue)
			if(!$check->check($dataKey, $dataValue)) 
				return false;
		
		return true;
	}
}

// еще один наследник класса Pattern - Expression, но он в другом файле