<?php
namespace Narval;

use Exception;

/*
	В этом файле - описание выражения в общем виде, а также описание всех операторов и соответствующих им операций
*/

// некое выражение.
// изначально подразумевалось, что это последовательность данных и операторов, но используется шире
abstract class Expression extends Pattern {
	protected $data = array();
	protected $ops = array();
	
	public function toString(){
		$result = '(' . $this->data[0]->toString();
		$len = count($this->ops);
		$i = -1;
		while(++$i < $len)
			$result .= ' ' . $this->ops[$i] . ' ' . $this->data[$i + 1]->toString();
		return $result . ')';
	}
	
	public function check($k, $v){
		return $this->value($k, $v)? true: false;
	}
	
	public abstract function value($k, $v);
	
	public function addOp($op) {
	
		if(count($this->data) <= count($this->ops))
			throw new Exception('Adding ops before data.');
			
		$this->ops[] = $op;
	}
	
	public function addData($data) { 
	
		if(count($this->data) > count($this->ops))
			throw new Exception('Adding data before ops.');
			
		$this->data[] = $data;
	}
	
	// привязка к данным
	public function bind($cache){
		foreach($this->data as $c)
			$c->bind($cache);
		return $this;
	}
	
	// является ли выражение терминальной константой
	// (на данный момент, под терминальной константой подразумевается либо литерал, либо привязанный Reference)
	public function isConstant(){ 
		return false;
	}
	
	// оптимизация выражения (например, замена константных выражений на константные литералы)
	protected static function simplifyThis($self){
		$hasDynamic = false;
		foreach($self->data as $k => $child){
			$self->data[$k] = $child = $child->simplify();
			if(!$child->isConstant()) $hasDynamic = true;
		}
		return $hasDynamic? $self: new Literal($self->value(null, null));
	}
	public function simplify(){ return Expression::simplifyThis($this); }
}

// различные операторы.
// не стоит вводить новые операторы, это может кончиться неожиданным образом
// лучше введите новую функцию, это гораздо проще и предсказуемее.

class Multiplication extends Expression {
	public static $operators = array('*' => true, '/' => true, '%' => true);
	public static function consumeOp($iter) { 
		if(!($iter->get() === '*' || $iter->get() === '/')) return false;
		$this->addOp($iter->gin());
		return true;
	}
	public function value($k, $v){
		$result = $this->data[0]->value($k, $v);
		$len = count($this->ops);
		for($i = 0; $i < $len; $i++){
			$data = $this->data[$i + 1]->value($k, $v);
			switch($this->ops[$i]){
				case '*': $result *= $data; break;
				case '/': $result /= $data; break;
				case '%': $result = floatval($result % $data); break;
				default: throw new Exception('Unexpected operator for multiplication: "' . $this->ops[$i] . '".');
			}
		}
		return $result;
	}
}
Striter::registerOperation('Multiplication');

class Addition extends Expression {
	public static $operators = array('+' => true, '-' => true);
	public function addOp($op) {
		if(count($this->data) === 0) $this->data[] = new Literal(0);
		parent::addOp($op);
	}
	public function value($k, $v){
		$result = $this->data[0]->value($k, $v);
		$len = count($this->ops);
		for($i = 0; $i < $len; $i++){
			$data = $this->data[$i + 1]->value($k, $v);
			switch($this->ops[$i]){
				case '+': 
					if(is_string($result) || is_string($data))
						$result .= $data;
					else 
						$result += $data; 
					break;
				case '-': $result -= $data; break;
				default: throw new Exception('Unexpected operator for addition: "' . $this->ops[$i] . '".');
			}
		}
		return $result;
	}
}
Striter::registerOperation('Addition');

class Negation extends Expression {
	public static $operators = array('!' => true);
	public function toString(){
		$innerVal = $this->data->toString();
		return $this->ops % 2 === 0? $innerVal: '!' . $innerVal;
	}
	public function addOp($op) { 
		$this->ops = is_int($this->ops)? $this->ops + 1: 1;
	}
	public function addData($data) { $this->data = $data;}
	public function value($k, $v) { 
		$innerVal = $this->data->value($k, $v);
		return $this->ops % 2 === 0? $innerVal: !$innerVal;
	}
	public function bind($cache){
		$this->data->bind($cache);
		return $this;
	}
	public function simplify(){
		$this->data = $this->data->simplify();
		return $this->data->isConstant()? new Literal($this->value(null, null)): $this;
	}
}
Striter::registerOperation('Negation');

class Comparison extends Expression {
	public static $operators = array('==' => true, '!=' => true, '>=' => true, '<=' => true, '>' => true, '<' => true, '->' => true);
	public function value($k, $v){ 
		$result = $this->data[0]->value($k, $v);
		$len = count($this->ops);
		for($i = 0; $i < $len; $i++){
			$data = $this->data[$i + 1]->value($k, $v);
			switch($this->ops[$i]){
				case '==': $result = $result === $data; break;
				case '!=': $result = $result !== $data; break;
				case '>=': $result = $result >= $data; break;
				case '<=': $result = $result <= $data; break;
				case '>': $result = $result > $data; break;
				case '<': $result = $result < $data; break;
				case '->':
					if($data === null) $result = false;
					else if(is_array($data)){
						$localResult = in_array($result, $data, true);
						if(!$localResult){
							if(is_int($result))
								$localResult = in_array(floatval($result), $data, true);
							else if(is_float($result) && ((abs($result) - floor(abs($result))) == 0))
								$localResult = in_array(intval($result), $data, true);
						}
						$result = $localResult;
					}
					else $result = strpos($data, $result) !== false;
					break;
				default: throw new Exception('Unexpected operator for comparison: "' . $this->ops[$i] . '".');
			}
		}
		return $result;
	}
}
Striter::registerOperation('Comparison');

class Connection extends Expression {
	public static $operators = array('&&' => true, '||' => true);
	public function value($k, $v){
		$result = $this->data[0]->value($k, $v);
		$len = count($this->ops);
		for($i = 0; $i < $len; $i++){
			$data = $this->data[$i + 1]->value($k, $v);
			switch($this->ops[$i]){
				case '||': $result = $result || $data; break;
				case '&&': $result = $result && $data; break;
				default: throw new Exception('Unexpected operator for connection: "' . $this->ops[$i] . '".');
			}
		}
		return $result;
	}
}
Striter::registerOperation('Connection');

// conditional has least priority of all operations
class Conditional extends Expression {
	private $cond;
	private $ifTrue;
	private $ifFalse;
	public function __construct($cond, $ifTrue, $ifFalse){
		$this->cond = $cond;
		$this->ifTrue = $ifTrue;
		$this->ifFalse = $ifFalse;
	}
	public function toString(){
		return '(' . $this->cond->toString() . '? ' . $this->ifTrue->toString() . ': ' . $this->ifFalse->toString() . ')';
	}
	public function value($k, $v){
		return ($this->cond->value($k, $v)? $this->ifTrue->value($k, $v): $this->ifFalse->value($k, $v));
	}
}