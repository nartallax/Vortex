<?php
namespace Narval;

use Exception;

/*
	Striter = STRing ITERator
	Изначально - класс, в котором собирались простые функции для обхода строки, но позже получил гораздо более широкий функционал
	Сейчас в этом классе содержатся все функции разбора строки
*/

class Striter {
	private static $ops = array();
	private static $opClasses = array();
	private static $functions = array();
	
	/*	эту функцию нужно вызвать для регистрации каждого оператора общего вида
		в ином случае операторы в разбираемой строке не будут распознаны
		порядок вызова функции регистрации определяет приоритет операции - 
			операторы, которые зарегистрированы позднее, получат меньший приоритет */
	public static function registerOperation($className){ 
		Striter::$opClasses[] = $className;
		$class = '\\' . __NAMESPACE__ . '\\' . $className; 
		Striter::$ops = array_merge(Striter::$ops, $class::$operators);
	}
	/*	то же самое, что и функция выше, только для функций
		порядок вызова значения не имеет */
	public static function registerFunction($class) {
		$class = '\\' . __NAMESPACE__ . '\\' . $class; 
		Striter::$functions[$class::getName()] = $class; 
	}
	
	//	функция получения инстанса операции по строковому представлению оператора
	private static function getOpExpression($op){
		foreach(Striter::$opClasses as $class){
			$class = '\\' . __NAMESPACE__ . '\\' . $class; 
			if(array_key_exists($op, $class::$operators)) return new $class();
		}
		throw new Exception('Unexpected operator: ' . $op);
	}
	// функция получения приоритета в числовом виде по строковому представлению оператора
	private static function getOpPriority($op){
		$i = 0;
		foreach(Striter::$opClasses as $class){
			$i--;
			$class = '\\' . __NAMESPACE__ . '\\' . $class; 
			if(array_key_exists($op, $class::$operators)) return $i;
		}
		throw new Exception('Unexpected operator: ' . $op);
	}
	// функция получения приоритета в числовом виде по инстансу класса операции
	private static function getExPriority($ex){
		if($ex === null) return -100000;
		$exClass = get_class($ex);
		$i = 0;
		foreach(Striter::$opClasses as $class){
			$i--;
			if(__NAMESPACE__ . '\\' . $class === $exClass) return $i;
		}
		throw new Exception('Unexpected expression class: ' . $exClass);
	}
	
	// функция, определяющая, может ли с переданного символа начинаться идентификатор
	private static function isISchar($c){
		return
			($c >= 'A' && $c <= 'Z') ||
			($c >= 'a' && $c <= 'z') ||
			$c === '_';
	}
	// функция, определяющая, может ли переданный символ быть в составе идентификатора
	// прим.: точка не входит в состав оператора и считается разделителем, поэтому обрабатывается отдельно в nextIdentifierList
	private static function isIchar($c){
		return
			($c >= 'A' && $c <= 'Z') ||
			($c >= 'a' && $c <= 'z') ||
			($c >= '0' && $c <= '9') ||
			$c === '_' || $c === '-';
	}
	
	
	private $str; // разбираемая строка
	private $pos; // позиция "курсора" в разбираемой строке
	private $len; // длина разбираемой строки
	
	public function __construct($str){
		$this->str = $str . '';
		$this->pos = 0;
		$this->len = strlen($str);
	}
	
	// простые функции работы со строкой
	public function get() { return $this->pos >= $this->len? '': $this->str{$this->pos}; }
	public function inc() { $this->pos++; }
	public function gin() { return $this->pos >= $this->len? '': $this->str{$this->pos++}; }
	public function ing() { $this->pos++; return $this->pos >= $this->len? '': $this->str{$this->pos}; }
	public function fwd($val) { $this->pos += $val; }
	public function end() { return $this->pos === $this->len; }
	public function look($val) { return $this->pos + $val >= $this->len? '': $this->str{$this->pos + $val}; }
	public function spass() {
		while($this->pos < $this->len && ($this->str{$this->pos} === ' ' || $this->str{$this->pos} === "\t" || $this->str{$this->pos} === "\n" || $this->str{$this->pos} === "\r"))
			$this->pos++;
	}
	public function inFwd($substr) {
		return ($this->pos < $this->len) && (strpos($this->str, $substr, $this->pos) === $this->pos);
	}
	
	// фунции для получения числа/идентификатора/итд, стоящего сразу за "курсором"
	public function nextNumber(){
		$zeroCode = ord('0');
		$result = 0;
		$char = $this->get();
		$power = 1;
		$havePoint = false;
		while(true){
			if($char === '.'){
				if($havePoint) break;
				$havePoint = true;
				$char = $this->ing();
			} else if($char >= '0' && $char <= '9') {
				if($havePoint) {
					$power *= 10;
					$result += (ord($char) - $zeroCode) / $power;
				}
				else {
					$result *= 10;
					$result += ord($char) - $zeroCode;
				}
				$char = $this->ing();
			} else break;
		}
		return floatval($result);
	}
	public function nextIdentifier(){
		$result = '';
		$char = $this->get();
		while(Striter::isIchar($char)){
			$result .= $char;
			$char = $this->ing();
		}
		return $result;
	}
	public function nextIdentifierList(){
		$result = '';
		while(true){
			$result .= $this->nextIdentifier();
			if($this->get() !== '.')
				break;
			$result .= '.';
			$this->inc();
		}
		return $result;
	}
	public function nextString(){
		$startChar = $this->gin();
		$escaped = false;
		$result = '';
		while(true){
			switch($char = $this->gin()){
				case '\\':
					if($escaped) $result .= '\\';
					else $escaped = true;
					break;
				case $startChar:
					if($escaped){
						$result .= $startChar;
						$escaped = false;
					} else return $result;
					break;
				case '':
					throw new Exception('Unexpected end of string.');
				default:
					if($escaped) {
						$result .= '\\';
						$escaped = false;
					}
					$result .= $char;
					break;
			}
		}
		throw new Exception('No end of string');
	}
	
	// функции для получения следующей за "курсором" разновидности терминального выражения
	// подразумевается, что возвращает либо инстанс выражения, либо false
	public function nextLiteral(){
		$char = $this->get();
		if($char >= '0' && $char <= '9')
			return new Literal($this->nextNumber());
			
		if($char === '"' || $char === '\'')
			return new Literal($this->nextString());
	
		$l4 = $this->look(4);
		$l4i = $l4 !== '.' && !Striter::isIchar($l4);
		
		if($this->inFwd('true') && $l4i){
			$this->fwd(4);
			return new Literal(true);
		}
		
		if($this->inFwd('null') && $l4i){
			$this->fwd(4);
			return new Literal(null);
		}
		
		$l5 = $this->look(5);
		$l5i = $l4 !== '.' && !Striter::isIchar($l5);
		
		if($this->inFwd('false') && $l5i){
			$this->fwd(5);
			return new Literal(false);
		}
			
		return false;
	}
	public function nextSpecialValue(){
		$char = $this->look(2);
		if($this->inFwd('me') && $char !== '.' && !Striter::isIchar($char)){
			$this->fwd(2);
			return new MeSpecialValue();
		}
	
		$char = $this->look(3);
		if($this->inFwd('key') && $char !== '.' && !Striter::isIchar($char)){
			$this->fwd(3);
			return new KeySpecialValue();
		}
		
		return false;
	}
	public function nextFunction(){
		foreach(Striter::$functions as $fname => $class){
			if($this->inFwd($fname)){
				
				$offset = strlen($fname);
				while($this->look($offset) === ' ') $offset++;
				if($this->look($offset) === '('){
					
					$result = new $class();
					
					$this->fwd($offset + 1);
					while($this->get() !== ')'){
						$result->addData($this->nextExpression());
						if($this->get() === ',') $this->inc();
					}
					$this->inc();
					
					return $result;
				}
			}
		}
		return false;
	}
	public function nextReference(){
		return Striter::isISchar($this->get())? new Reference($this->nextIdentifierList()): false;
	}
	
	// функция, объединяющая предыдущие функции получения терминальных выражений
	public function nextTerminalExpression(){
		$result = $this->nextLiteral();
		if(!$result) $result = $this->nextFunction();
		if(!$result) $result = $this->nextSpecialValue();
		if(!$result) $result = $this->nextReference();
		return $result;
	}
	
	// функция, возвращающая следующий за "курсором" оператор или false
	public function nextOp(){
		$char = $this->get();
		$next = $this->look(1);
		if(array_key_exists($char . $next, Striter::$ops)){
			$this->fwd(2);
			return $char . $next;
		} else if(array_key_exists($char, Striter::$ops)){
			$this->inc();
			return $char;
		}
		return false;
	}
	
	// функция, возвращающая следующее за курсором "выражение"
	// останавливается, когда натыкается на символ, который не может интерпретировать
	public function nextExpression(){
		// стек - в него запихиваются менее приоритетные операции, когда встречается более приоритетный оператор
		$stack = array();
		// подвешенное выражение - выражение, с которым пока непонятно, что делать
		// его судьба определяется следующим за ним оператором
		$hanged = null;
		// текущее выражение - выражение, с которым в данный момент идет работа
		$current = null;
		
		while(true){
		
			$this->spass();
			$char = $this->get();
			
			if($char === '('){ // скобки - получаем выражение внутри скобок, подвешиваем
				$this->inc();
				if($hanged !== null) $current->addData($hanged);
				$hanged = $this->nextExpression();
				$this->inc(); // пропускаем ')'
				continue;
			}
			
			if($terminal = $this->nextTerminalExpression()){ // терминальные выражение - то же, что и скобки - подвешиваем
				if($hanged) $current->addData($hanged);
				$hanged = $terminal;
				continue;
			}
			
			/* 	условное выражение - почти оператор с наиболее низким приоритетом, но с особыми правилами обработки
				получаем следующее два выражения, разделенные двоеточием, создаем инстанс Conditional, подвешиваем */
			if($char === '?'){
				if($hanged){
					if($current) $current->addData($hanged);
					else $current = $hanged;
				}
				$stackSize = count($stack);
				while($stackSize-- > 0){
					$next = array_pop($stack);
					$next->addData($current);
					$current = $next;
				}
				$condition = $current === null? $hanged: $current;
				$this->inc();
				$ifTrue = $this->nextExpression();
				
				$this->spass();
				if($this->gin() !== ':') throw new Exception('Unexpected conditional form: no colon at ' . ($this->pos - 1));
				
				$ifFalse = $this->nextExpression();
				$hanged = new Conditional($condition, $ifTrue, $ifFalse);
				$current = null;
			}
			
			// here is the magic done!
			if($op = $this->nextOp()){ // оператор. дальнейшие действия определяются приоритетом текущего выражения и оператора
				$opPriority = Striter::getOpPriority($op);
				$exPriority = Striter::getExPriority($current);
				
				if($opPriority > $exPriority){
					if($current !== null) $stack[] = $current;// если приоритет текущего выражения меньше - запихиваем выражение в стек 
					$current = Striter::getOpExpression($op); // создаем новое выражение на основе оператора
					// не выходим, продолжаем в следующем if-e
				}
				if($opPriority >= $exPriority){ // если текущее выражение имеет такой же приоритет - 
					if($hanged !== null) $current->addData($hanged); // запихиваем подвешенное значение в него
					$hanged = null;
					$current->addOp($op); // ... а сверху - оператор
				} else { // иначе, если приоритет текущего выражения больше, 
					while(count($stack) > 0 && $opPriority < $exPriority){ // то ищем выражение меньшего или равного приоритета
						$next = $stack[count($stack) - 1];
						$nextPriority = Striter::getExPriority($next);
						if($opPriority >= $nextPriority) break;
						if($hanged !== null) $current->addData($hanged); // ...набивая все попутно вынимаемые из стека предыдущими
						$hanged = $current;
						$current = array_pop($stack);
						$exPriority = Striter::getExPriority($current);
					}
					// когда нашли - делаем с ним то же самое, что делали с выражением выше
					if($opPriority !== $exPriority){
						if($hanged !== null) $current->addData($hanged);
						$hanged = $current;
						$current = Striter::getOpExpression($op);
					}
					if($hanged !== null) $current->addData($hanged); 
					$hanged = null;
					$current->addOp($op);
				}
				
				continue;
			}
			
			// если мы дошли до сюда - все, выражение кончилось, пора чего-нибудь вернуть
			if(!$current) return $hanged;
			if($hanged) $current->addData($hanged);
			$stackSize = count($stack);
			while($stackSize-- > 0){
				$next = array_pop($stack);
				$next->addData($current);
				$current = $next;
			}
			return $current;
			
		}
	}
	
	// функция, возвращающая следующий за курсором "паттерн"
	public function nextObjectPattern(){
		$this->inc(); // passing '{';
		$result = new ObjPattern();
		while($this->get() !== '}'){
			$this->spass();
			if(!Striter::isISchar($this->get()))
				throw new Exception('Unexpected object pattern key: key could not start with "' . $this->get() . '".');
			$key = $this->nextIdentifier();
			$this->spass();
			if($this->get() === '?') {
				$optional = true;
				$this->inc();
				$this->spass();
			} else $optional = false;
			if($this->gin() !== ':') 
				throw new Exception('Unexpected object pattern form: no colon after key "' . $key . '".');
			$check = $this->nextPattern();
			$result->addKeyValue($key, $check, $optional);
			
			$this->spass();
			if($this->get() === ',') $this->inc();
		}
		$this->inc(); // passing '}'
		
		$this->spass();
		if($this->get() === ':') {
			$this->inc();
			$result->setCommonCheck($this->nextPattern());
		}
		
		return $result;
	}
	public function nextArrayPattern(){
		$this->inc(); // passing '[';
		$result = new ArrPattern($this->nextPattern());
		$this->spass();
		if($this->get() !== ']') throw new Exception('Unexpected array pattern form: expected "]" after inner pattern (got "' . $this->get() . '" instead).');
		
		$this->inc();
		$this->spass();
		if($this->get() === ':') $result->setCommonCheck($this->nextPattern());
		
		return $result;
	}
	public function nextPattern(){
		$this->spass();
		switch($this->get()){
			case '{': return $this->nextObjectPattern();
			case '[': return $this->nextArrayPattern();
			default: return $this->nextExpression();
		}	
	}
}