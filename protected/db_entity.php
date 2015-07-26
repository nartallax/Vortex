<?php

// класс, описывающий таблицу
// содержит базовые для любой таблицы действия
// инлайновый код оптимальнее примерно в 2-5 раза 

// идентификаторы: см. validateIdentifier

// осторожнее со вторичными сущностями, id могут не сохраняться при обновлении/удалении;
// назначайте вторичными только такие сущности, на которые ссылается только эта сущность

class dbEntity {

	private static $queryRowsFunc = null;
	private static $converters = array();
	private static $parsers = array();
	
	private $fields;
	private $fieldNames;
	private $tableName;
	private $pkeys;
	private $notPkeys;
	
	private $inTransforms = array();
	private $outTransforms = array();
	
	private $beforeDelete = array();
	private $afterDelete = array();
	
	private $beforeCreate = array();
	private $afterCreate = array();
	
	private $beforeUpdate = array();
	private $afterUpdate = array();
	
	
	private $secondary = array();
	private $postponed = array();
	
	private function executePostponed($data = null){
		$ps = $this->postponed;
		$this->postponed = array();
		if(isset($data)) foreach($ps as $p) $p($data);
		else foreach($ps as $p) $p();
	}
	
	private static function queryRows(&$q, &$d){
	
		$result = dbEntity::$queryRowsFunc->__invoke($q, $d);
		
		return $result;
	}
	
	private static function getArrType($arr){
		$result = null;
		$subres = null;
		foreach($arr as $el){
			if(is_int($el)) $subres = 'int';
			elseif(is_string($el)) $subres = 'varchar';
			elseif(is_float($el)) $subres = 'float';
			elseif(is_bool($el)) $subres = 'boolean';
			else throw new Exception('server_error'); // unknown type
			
			if($result === null) $result = $subres;
			elseif(($result === 'int' || $result === 'float') && ($subres === 'int' || $subres === 'float')) $result = 'float';
			elseif($result !== $subres) throw new Exception('server_error'); // non-uniform array
		}
		return $result;
	}
	private static function validateIdentifier($str){		
		$l = strlen($str);
		if($l < 2) throw new Exception('server_error');
		while($l-->0){
			$c = $str{$l};
			if(!(	($c >= 'a' && $c <= 'z') || 
					($c >= 'A' && $c <= 'Z') ||
					$c === '_')) throw new Exception('server_error');
		}
	}
	private static function generateSetPlaceholders($data, $startNum){
		if(count($data) < 1) return ' ';
		$result = ' set ';
		$i = $startNum;
		foreach($data as $name => $cond){
			if($i > $startNum) $result .= ', ';
			$result .= $name . ' = $' . $i;
			$i++;
		}
		return $result;
	}
	private static function generateWherePlaceholders(&$data, &$startNum, $allowJoin = true){
		$datalen = count($data);
		if($datalen < 1) return ' ';
		$i = $startNum;
		$args = array();
		
		$result = '';
		
		// особый случай - аргумент 1 и он массив => можно (удобно) использовать join + unnest
		if($datalen === 1 && $allowJoin)
			foreach($data as $name => $cond){
				dbEntity::validateIdentifier($name);
				if(!is_array($cond)) break;
				$arrtype = dbEntity::getArrType($cond);
				$condCount = count($cond);
				
				$result .= ' join (select unnest(cast(array[';
				$result .= dbEntity::generatePlaceholders($i, $condCount);
				$result .= '] as ' . $arrtype . "[])) as $name) as indice_table using ($name) ";
				
				$i += $condCount;
				$args = array_merge($args, $cond);
			}
		
		
		if($result === '') {
			$result = ' where ';
			
			foreach($data as $name => $cond){
				dbEntity::validateIdentifier($name);
				if($i > $startNum) $result .= ' and ';
				if(is_array($cond)) {
					$result .= $name . ' in (';
					$condCount = count($cond);
					$result .= dbEntity::generatePlaceholders($i, $condCount);
					$result .= ')';
					$i += $condCount;
					$args = array_merge($args, $cond);
				} else {
					if($cond === null) $result .= $name .' is $' . $i;
					else $result .= $name . ' = $' . $i;
					$args[] = $cond;
				}
				$i++;
			}
		}
		
		$startNum = $i;
		$data = $args;
		
		return $result;
	}
	private static function generateInsertPlaceholders($data, $fieldNames, &$num){
		$result = '';
		$group = '';
		foreach($data as $row){
			if($result !== '') $result .= ',';
			$group = '';
			foreach($fieldNames as $name){
				if($group !== '') $group .= ',';
				if(array_key_exists($name, $row)){
					$group .= '$' . $num;
					$num++;
				} else $group .= 'default';
			}
			$result .= '(' . $group . ')';
		}
		
		return ' ' . $result . ' ';
	}
	private static function generatePlaceholderGroups($rows, $fieldCount){
		if($rows === 0) return ' ';
		$result = ' (' . dbEntity::generatePlaceholders(1, $fieldCount) . ')';
		$i = 0;
		while(++$i < $rows) $result .= ', (' . dbEntity::generatePlaceholders(($i * $fieldCount) + 1, $fieldCount) . ') ';
		return $result;
	}
	private static function generatePlaceholders($start, $count){
		if($count === 0) return '';
		$result = '$' . $start;
		$i = $start;
		$limit = $start + $count - 1;
		while($i++ < $limit) $result .= ', $' . $i;
		return $result;
	}
	
	public static function defineDBtype($name, $convert, $parse){ 
		dbEntity::$converters[$name] = $convert;
		dbEntity::$parsers[$name] = $parse;
	}
	public static function setQueryRowsFunction($func){
		dbEntity::$queryRowsFunc = $func;
	}
	
	// {name:{type:str, default:any = null, is_pkey:boolean = false}], string, [function(row)], [function(row)]
	public function __construct($tableName, $fields/*, $inTrans = array(), $outTrans = array()*/){
		ksort($fields);
		
		//$this->inTransforms = $inTrans;
		//$this->outTransforms = $outTrans;
		
		dbEntity::validateIdentifier($tableName);
		
		$names = array();
		$pkeys = array();
		$notPkeys = array();
		foreach($fields as $k => &$f){
			dbEntity::validateIdentifier($k);
			if(!isset($f['required'])) $f['required'] = !array_key_exists('default', $f);
			if(!isset($f['is_pkey'])) $f['is_pkey'] = false;
			
			$names[] = $k;
			
			if($f['is_pkey']) $pkeys[] = $k;
			else $notPkeys[] = $k;
		}
		unset($f);
		
		$this->fields = $fields;
		$this->tableName = $tableName;
		$this->fieldNames = $names;
		$this->pkeys = $pkeys;
		$this->notPkeys = $notPkeys;
	}
	
	private static function removeRowFields($data, $fields){
		foreach($fields as $field)
			unset($data[$field]);
		return $data;
	}
	private static function filterRowFields($data, $fields){	
		$result = array();
		foreach($fields as $name)
			if(array_key_exists($name, $data))
				$result[$name] = $data[$name];
		return $result;
	}
	private static function removeFields(&$arr, $fields){
		foreach($fields as $field)
			foreach($arr as &$data)
				unset($data[$field]);
		return $arr;
	}
	private function rectifyRowSoft(&$data, $fields){
		$inTrans = $this->inTransforms;
		foreach($inTrans as $trans) $data = $trans($data);
		$converters = dbEntity::$converters;
		foreach($fields as $name => $field){
			$required = $field['required'];
			$type = $field['type'];
			$converter = $converters[$type];
		
			if(!array_key_exists($name, $data)) continue;
			if($data[$name] === null){
				if($required) throw new Exception('server_error');
			} elseif(is_array($data[$name])){ // composite type?
				continue;
			} else $data[$name] = $converter($data[$name]);
		}
		
		return $data;
	}
	private function rectifyRowArrays(&$data, $fields){
		$converters = dbEntity::$converters;
		
		foreach($fields as $name => $field){
			$required = $field['required'];
			$type = $field['type'];
			$converter = $converters[$type];
		
			if(!array_key_exists($name, $data) || !is_array($data[$name])) continue;
			foreach($data[$name] as $k => $v)
				$data[$name][$k] = $converter($v);
		}
		
		return $data;
	}
	private function rectifyInputSoft(&$arr, $fields){ 	// leaves not defined fields as is
		$this->applyInTransforms($arr);
	
		$converters = dbEntity::$converters;
		foreach($fields as $name => $field){
			$type = $field['type'];
			$converter = $converters[$type];
			$required = $field['required'];
		
			// almost the same as in rectifyOutput - ugly but fast code
			switch($type){
				case 'int': foreach($arr as &$data) {
					if(!array_key_exists($name, $data)) continue;
					if($data[$name] === null){
						if($required) throw new Exception('server_error');
					} else $data[$name] = (int)$data[$name];
				} continue;
				case 'float': foreach($arr as &$data) {
					if(!array_key_exists($name, $data)) continue;
					if($data[$name] === null){
						if($required) throw new Exception('server_error');
					} else $data[$name] = (float)$data[$name];
				} continue;
				case 'boolean': foreach($arr as &$data) {
					if(!array_key_exists($name, $data)) continue;
					if($data[$name] === null){
						if($required) throw new Exception('server_error');
					} else $data[$name] = $data[$name]? true: false;
				} continue;
				case 'string': foreach($arr as &$data) {
					if(!array_key_exists($name, $data)) continue;
					if($data[$name] === null){
						if($required) throw new Exception('server_error');
					} else $data[$name] = (string)$data[$name];
				} continue;
				default: foreach($arr as &$data) {
					if(!array_key_exists($name, $data)) continue;
					if($data[$name] === null){
						if($required) throw new Exception('server_error');
					} else $data[$name] = $converter($data[$name]);
				} continue;
			}
		}
		
		return $arr;
	}
	private function applyInTransforms(&$arr){
		$inTrans = $this->inTransforms;
		foreach($inTrans as $trans)
			foreach($arr as $k => $v)
				$arr[$k] = $trans($v);
	}
	private function rectifyInputFields(&$arr, $fields){ // dont applies entity in-transforms
		$converters = dbEntity::$converters;
		
		foreach($fields as $name => $field){
			$type = $field['type'];
			$converter = $converters[$type];
			$required = $field['required'];
			$haveDefault = array_key_exists('default', $field);
			$default = $haveDefault? $field['default']: null;
		
			// almost the same as in rectifyOutput - ugly but fast code
			switch($type){
				case 'int': foreach($arr as &$data) {
					if(!array_key_exists($name, $data) && $haveDefault) $data[$name] = $default;
					if(!isset($data[$name])){
						//var_dump($name);
						if($required) throw new Exception('server_error'); // no required field value
					} else $data[$name] = (int)$data[$name];
				} continue;
				case 'float': foreach($arr as &$data) {
					if(!array_key_exists($name, $data) && $haveDefault) $data[$name] = $default;
					if(!isset($data[$name])){
						if($required) throw new Exception('server_error');
					} else $data[$name] = (float)$data[$name];
				} continue;
				case 'boolean': foreach($arr as &$data) {
					if(!array_key_exists($name, $data) && $haveDefault) $data[$name] = $default;
					if(!isset($data[$name])){
						if($required) throw new Exception('server_error');
					} else $data[$name] = $data[$name]? true: false;
				} continue;
				case 'string': foreach($arr as &$data) {
					if(!array_key_exists($name, $data) && $haveDefault) $data[$name] = $default;
					if(!isset($data[$name])){
						if($required) throw new Exception('server_error');
					} else $data[$name] = (string)$data[$name];
				} continue;
				default: foreach($arr as &$data) {
					if(!array_key_exists($name, $data) && $haveDefault) $data[$name] = $default;
					if(!isset($data[$name])){
						if($required) throw new Exception('server_error');
					} else $data[$name] = $converter($data[$name]);
				} continue;
			}
		}
		
		return $arr;
	}
	private function rectifyInput(&$arr, $fields){ 		// set not defined fields to defaults
		$this->applyInTransforms($arr);
		$this->rectifyInputFields($arr, $fields);
		return $arr;
	}
	private function rectifyOutput(&$arr, $fields){
		$parsers = dbEntity::$parsers;
		foreach($fields as $name => $field){
			$type = $field['type'];
			$parser = $parsers[$type];
			
			// I could write this with more beautiful code, but this code is faster
			// notable on 15000+ rows and 8+ cols
			switch($type){
				case 'string': foreach($arr as &$data){
					if(!isset($data[$name])) $data[$name] = null;
				}; continue;
				case 'float': foreach($arr as &$data){
					if(!isset($data[$name])) $data[$name] = null;
					else $data[$name] = (float)$data[$name];
				}; continue;
				case 'boolean': foreach($arr as &$data){
					if(!isset($data[$name])) $data[$name] = null;
					else $data[$name] = strtolower(substr($data[$name], 0, 1)) === 't';
				}; continue;
				case 'int': foreach($arr as &$data){
					if(!isset($data[$name])) $data[$name] = null;
					else $data[$name] = (int)$data[$name];
				}; continue;
				default: foreach($arr as &$data){
					if(!isset($data[$name])) $data[$name] = null;
					else $data[$name] = $parser($data[$name]);
				}; continue;
			}
			
		}
		
		return $arr;
	}
	private function rectifyOutputSoft(&$arr, $fields){
		$parsers = dbEntity::$parsers;
		foreach($fields as $name => $field){
			$type = $field['type'];
			$parser = $parsers[$type];
			
			switch($type){
				case 'string': foreach($arr as &$data){
					if(!isset($data[$name])) continue;
				}; continue;
				case 'float': foreach($arr as &$data){
					if(!isset($data[$name])) continue;
					else $data[$name] = (float)$data[$name];
				}; continue;
				case 'boolean': foreach($arr as &$data){
					if(!isset($data[$name])) continue;
					else $data[$name] = strtolower(substr($data[$name], 0, 1)) === 't';
				}; continue;
				case 'int': foreach($arr as &$data){
					if(!isset($data[$name])) continue;
					else $data[$name] = (int)$data[$name];
				}; continue;
				default: foreach($arr as &$data){
					if(!isset($data[$name])) continue;
					else $data[$name] = $parser($data[$name]);
				}; continue;
			}
			
		}
		
		return $arr;
	}
	private static function toPlainArr($data, $fields){
		$result = array();
		foreach($data as $row)
			foreach($fields as $name => $field)
				if(array_key_exists($name, $row))
					$result[] = $row[$name];
		return $result;
	}
	private function filterFields($names){
		sort($names);
		$result = array();
		foreach($names as $name)
			$result[$name] = $this->fields[$name];
		return $result;
	}
	
	private static function toKeyArr($arr){
		$result = array();
		foreach($arr as $val) $result[$val] = true;
		return $result;
	}
	private static function arrayColumn($arr, $col){ // something like this will be in php 5.5, but not yet
		$res = array();
		foreach($arr as $row) $res[] = $row[$col];
		return $res;
	}
	private static function arrayColumnSoft($arr, $col){ // same as arrayColumn, but don't do a thing when there is no value
		$res = array();
		foreach($arr as $row) 
			if(array_key_exists($col, $row))
				$res[] = $row[$col];
		return $res;
	}
	private static function arrayColumnNotNull($arr, $col){ // same as previous, but passes also nulls
		$res = array();
		foreach($arr as $row) if(isset($row[$col])) $res[] = $row[$col];
		return $res;
	}
	private static function arraySubtract($base, $arg){
		// пусть пока будет тупой алгоритм, большой перформанс не требуется
		foreach($arg as $val)
			foreach($base as $k => $v)
				if($v === $val){
					unset($base[$k]);
					break;
				}
		return $base;
	}
	private function fetchSecondaryEntities(&$data){
		foreach($this->secondary as $col => $ent){
			$fkey = $ent['fkey'];
			$subst = $ent['subst'];
			$single = $ent['single'];
			$rem = $ent['remfields'];
			$ent = $ent['entity'];
			$colData = dbEntity::arrayColumnNotNull($data, $col);
			if(count($colData) === 0) continue;
			
			$fields = $ent->getFieldNames();
			$needRemoveKey = isset($rem[$fkey]) && in_array($fkey, $fields);
			foreach($fields as $fieldKey => $fname) if(isset($rem[$fname])) unset($fields[$fieldKey]);
			if($needRemoveKey) $fields[] = $fkey;
			
			$ents = $ent->fetchByCols(array($fkey => $colData), $fields);
			
			$entsByCol = array();
			if($single) {
				if($needRemoveKey) foreach($ents as $ent) {
					$fkv = $ent[$fkey];
					unset($ent[$fkey]);
					$entsByCol[$fkv] = $ent;
				} else foreach($ents as $ent) $entsByCol[$ent[$fkey]] = $ent;
			}
			else {
				if($needRemoveKey) foreach($ents as $ent){
					$fkv = $ent[$fkey];
					unset($ent[$fkey]);
					$entsByCol[$fkv][] = $ent;
				} else foreach($ents as $ent) $entsByCol[$ent[$fkey]][] = $ent;
			}
			
			foreach($data as &$row) $row[$subst] = isset($entsByCol[$row[$col]])? $entsByCol[$row[$col]]: null;
		}
	}
	private function updateSecondaryEntities(&$data, $oldData){
		foreach($this->secondary as $col => $ent){
			$fkey = $ent['fkey'];
			$subst = $ent['subst'];
			$single = $ent['single'];
			$ent = $ent['entity'];
		
			if(!array_key_exists($subst, $data)) continue;
			$newSecs = $data[$subst];
			
			$colval = $oldData[$col];
			if($this->fields[$col]['is_pkey']){
				if($single) $newSecs = array($newSecs);
				foreach($newSecs as $k => $sec) // если вдруг вместо вторичных сущностей переданы ключи,
					if(!is_array($sec)) 		// то пропускаем их
						unset($newSecs[$k]);	// по парадигме работы такого быть не должно, но мало ли что
						
				foreach($newSecs as &$sec) 
					$sec[$fkey] = $colval;
				unset($sec);
				
				if($colval !== null) $ent->delete(array($fkey => $colval));
				if(count($newSecs) === 0) continue;
				$ent->createPack($newSecs);
			} else {
				// так не может быть: в одном поле не может быть более одного значения
				if(!$single) throw new Exception('server_error');
				
				if($newSecs === null) {
					if($colval === null) continue;
					$this->postponed[] = function() use($ent, $fkey, $colval){
						$ent->delete(array($fkey => $colval));
					};
					continue;
				} elseif($colval === null){
					$data[$col] = $ent->create($newSecs);
					$data[$col] = $data[$col][$fkey];
					continue;
				}
				
				if(!isset($newSecs[$fkey])) $newSecs[$fkey] = $colval;
				$ent->update($newSecs);
				$data[$col] = $newSecs[$fkey];
			}
		}
	}
	private function createSecondaryEntities(&$data){
		foreach($this->secondary as $col => $ent){
			$fkey = $ent['fkey'];
			$subst = $ent['subst'];
			$single = $ent['single'];
			$ent = $ent['entity'];
			
			if($this->fields[$col]['is_pkey']){
				
				$this->postponed[] = function($data) use($single, $subst, $ent, $fkey, $col) {
					$ents = array();
					
					if($single) {
						foreach($data as $row) if(isset($row[$subst]) && is_array($row[$subst])){
							$row[$subst][$fkey] = $row[$col];
							$ents[] = $row[$subst];
						} 
					} else { 
						foreach($data as $row) if(isset($row[$subst])) foreach($row[$subst] as $sec) {
							$sec[$fkey] = $row[$col];
							$ents[] = $sec;
						}
					}
					
					$ent->createPack($ents);
				};
				
				continue;
			} else {
				if(!$single) throw new Exception('server_error'); // impossible
			
				$rows = array();
				$ents = array();
				foreach($data as &$row) if(isset($row[$subst]) && is_array($row[$subst])){
					$rows[] = &$row;
					$ents[] = $row[$subst];
				}
				
				$ids = $ent->createPack($ents);
				$len = count($ids);
				$i = -1;
				
				while(++$i < $len) $rows[$i][$col] = $ids[$i][$fkey];
				
				continue;
			}
		}
	}
	private function deleteSecondaryEntities(&$data){
		foreach($this->secondary as $col => $ent){
			$fkey = $ent['fkey'];
			$subst = $ent['subst'];
			$single = $ent['single'];
			$ent = $ent['entity'];
			
			$keys = dbEntity::arrayColumnNotNull($data, $col);
			
			if($this->fields[$col]['is_pkey']){
				$ent->delete(array($fkey => $keys));
				continue;
			} else {
				if(!$single) throw new Exception('server_error'); // impossible
			
				foreach($data as &$row) $row[$col] = null;
			
				if(count($keys) > 0)
					$this->postponed[] = function() use($keys, $fkey, $ent){
						$ent->delete(array($fkey => $keys));
					};
				
				continue;
			}
		}
	}
	
	public function getTableName(){ return $this->tableName; }
	public function getFieldNames(){ return $this->fieldNames; }
	public function getFieldNamesWithout($list){ return dbEntity::arraySubtract($this->fieldNames, $list); }
	public function registerSecondaryEntity(
		$entity, // ссылка на объект класса dbEntity, описывающий сущность
		$thisFieldName, // имя поля, значение которого должно равняться значению поля $entityFieldName для соединения сущностей
		$entityFieldName, // см. выше
		$singleEntity = true, // подразумевается ли, что эта сущность ссылается на одну вторичную или на много
		$substCol = null, // имя поля этой сущности, в которое следует поместить вторичную сущность
		$removedFields = null // список полей вторичной сущности, которые не должны передаваться вместе с ней
	){
		if($removedFields === null) $removedFields = array($entityFieldName);
		$removedFields = dbEntity::toKeyArr($removedFields);
		$this->secondary[$thisFieldName] = array(
			'entity' => $entity, 
			'fkey' => $entityFieldName, 
			'single' => $singleEntity,
			'subst' => isset($substCol)? $substCol: $thisFieldName,
			'remfields' => $removedFields
		);
	}
	public function registerTransform($fromDB, $func){
		if($fromDB) $this->outTransforms[] = $func;
		else $this->inTransforms[] = $func;
	}
	public function registerOnDelete($func, $before = true){
		if($before) $this->beforeDelete[] = $func;
		else $this->afterDelete[] = $func;
	}
	public function registerOnUpdate($func, $before = true){
		if($before) $this->beforeUpdate[] = $func;
		else $this->afterUpdate[] = $func;
	}
	public function registerOnCreate($func, $before = true){
		if($before) $this->beforeCreate[] = $func;
		else $this->afterCreate[] = $func;
	}
	
	public function create($data){ $result = $this->createPack(array($data)); return isset($result[0])? $result[0]: null; }
	public function createPack($data){
		$rowCount = count($data);
		if($rowCount === 0) return array();
		$fields = $this->fields;
		$fieldCount = count($this->notPkeys);
		
		$fields = $this->filterFields($this->notPkeys);
		
		foreach($this->beforeCreate as $h)  $h($data);
		
		$this->applyInTransforms($data);
		
		$this->createSecondaryEntities($data);
		
		$data = $this->rectifyInputFields($data, $fields);
		$data = dbEntity::removeFields($data, $this->pkeys);
		$params = dbEntity::toPlainArr($data, $fields);
		
		$placeholderNumber = 1;
		$request = 'insert into ' . $this->tableName . 
					' (' . implode($this->notPkeys, ', ') . 
					//') values ' . dbEntity::generatePlaceholderGroups($rowCount, $fieldCount);
					') values ' . dbEntity::generateInsertPlaceholders($data, $this->notPkeys, $placeholderNumber);
		if(count($this->pkeys) > 0)
			$request .= ' returning ' . implode($this->pkeys, ', ');
		
		$result = dbEntity::queryRows($request, $params);
		
		$len = count($result);
		$i = -1;
		
		while(++$i < $len)
			foreach($result[$i] as $col => $val)
				$data[$i][$col] = $val;
		
		$this->executePostponed($data);
		dbEntity::rectifyOutputSoft($result, $this->fields);
		
		foreach($this->afterCreate as $h)  $h($data);
		
		return $result;
	}
	
	public function fetchSingle(){ $res = $this->fetch(); return isset($res[0])? $res[0]: null; }
	public function fetchSingleCols($cols){ $res = $this->fetchCols($cols); return isset($res[0])? $res[0]: null; }
	public function fetchSingleBy($args){ $res = $this->fetchBy($args); return isset($res[0])? $res[0]: null; }
	public function fetchSingleByCols($args, $cols){ $res = $this->fetchByCols($args, $cols); return isset($res[0])? $res[0]: null; }
	private function fetchSinglePlainBy($args){ 
		$result = $this->fetchPlainPartByCols($args, $this->fieldNames); 
		return isset($result[0])? $result[0]: null;
	}
	
	public function fetch(){ return $this->fetchByCols(array(), $this->fieldNames); }
	public function fetchCols($cols) { return $this->fetchByCols(array(), $cols); }
	public function fetchBy($args){ return $this->fetchByCols($args, $this->fieldNames); }
	private function fetchPlainPartByCols($args, $fieldNames){
		dbEntity::rectifyRowSoft($args, $this->fields);
		$tableName = $this->tableName;
		
		foreach($fieldNames as $name) 
			if(!isset($this->fields[$name]))
				throw new Exception('server_error'); // unknown field
				
		$fields = $this->filterFields($fieldNames);
		
		ksort($args);
		$fieldNames = count($fieldNames) === 0? ' * ': implode($fieldNames, ', ');
		$placeholderCount = 1;
		
		$where = dbEntity::generateWherePlaceholders($args, $placeholderCount);
		$query = "select $fieldNames from $tableName $where";
		$params = array_values($args);
		
		$result = dbEntity::queryRows($query, $params);
		$this->rectifyOutput($result, $fields);
		
		return $result;
	}
	public function fetchByCols($args, $fieldNames){
		$result = $this->fetchPlainPartByCols($args, $fieldNames);
		$this->fetchSecondaryEntities($result);
		
		$outTrans = $this->outTransforms;
		foreach($outTrans as $trans)
			foreach($result as $k => $v)
				$result[$k] = $trans($v);
		
		return $result;
	}
	public function fetchBareByCols($args, $fieldNames){
		$result = $this->fetchPlainPartByCols($args, $fieldNames);
		
		$outTrans = $this->outTransforms;
		foreach($outTrans as $trans)
			foreach($result as $k => $v)
				$result[$k] = $trans($v);
		
		return $result;
	}
	
	// обновляет указанные поля значениями по умолчанию; такие значения хранятся в базе, а не на сервере
	public function updateFieldsWithDefaults($args, $fieldNames){ 
		if(count($fieldNames) === 0) return;
		
		$placeholderCount = 1;
		$where = dbEntity::generateWherePlaceholders($args, $placeholderCount);
		$set = '';
		foreach($fieldNames as $name){
			if(!isset($this->fields[$name])) throw new Exception('server_error'); // no such field
			if($set !== '') $set .= ', ';
			$set .= $name . ' = default ';
		}
		
		$params = array_values($args);
		$tableName = $this->tableName;
		$query = "update $tableName set $set $where";
		dbEntity::queryRows($query, $params);
	}
	public function updateBy($vals, $keys){
		dbEntity::rectifyRowSoft($vals, $this->fields);
		dbEntity::rectifyRowSoft($keys, $this->fields);
		$keyCount = count($keys);
		if($keyCount === 0) throw new Exception('server_error'); // must not update ALL the table!
		
		//$data = mergeTables($vals, $keys);
		$data = array_merge($vals, $keys);
		$dataForHandlers = array($data);
		foreach($this->beforeUpdate as $h)  $h($dataForHandlers);
		
		$oldData = $this->fetchSinglePlainBy($keys);
		$this->updateSecondaryEntities($data, $oldData);
		foreach($data as $col => $val){
			if(array_key_exists($col, $keys)) $keys[$col] = $val;
			else $vals[$col] = $val;
		}
		
		$vals = dbEntity::filterRowFields($vals, $this->notPkeys);
		
		$placeholderCount = 1;
		
		$where = dbEntity::generateWherePlaceholders($keys, $placeholderCount);
		$set = dbEntity::generateSetPlaceholders($vals, $placeholderCount);
		
		$keys = array_values($keys);
		$vals = array_values($vals);
		$params = array_merge($keys, $vals);
		$tableName = $this->tableName;
		
		$query = "update $tableName $set $where";
		
		dbEntity::queryRows($query, $params);
		$this->executePostponed();
		
		foreach($this->afterUpdate as $h)  $h($dataForHandlers);
	}
	public function update($data){ 
		dbEntity::rectifyRowSoft($data, $this->fields);
		$keys = dbEntity::filterRowFields($data, $this->pkeys);
		$vals = $data;
		foreach($keys as $fname => $fval) unset($vals[$fname]);
		ksort($vals);
		ksort($keys);
		
		$this->updateBy($vals, $keys);
	}
	
	public function deleteEntity($ent){ $this->deleteEntities(array($ent)); }
	public function deleteEntities($ents) {
		$len = count($ents);
		if($len === 0) return;
		
		$keys = null;
		$keycount = 0;
		$selectedKey = null;
		foreach($this->pkeys as $pkey){
			$keys = dbEntity::arrayColumn($ents, $pkey);
			$keycount = count($keys);
			if($len === $keycount) {
				$selectedKey = $pkey;
				break;
			}
		}
		if($selectedKey === null) throw new Exception('server_error'); // could not delete entities without keys
		
		$this->delete(array($selectedKey => $keys));
	}
	public function delete($args){ 
		if(count($args) === 0) throw new Exception('server_error'); // must not delete ALL the table!
	
		dbEntity::rectifyRowSoft($args, $this->fields);
		dbEntity::rectifyRowArrays($args, $this->fields);
		
		foreach($this->beforeDelete as $h)  $h($args);
		
		if(count($this->secondary) > 0) {
			$data = $this->fetchPlainPartByCols($args, $this->fieldNames);
			$this->deleteSecondaryEntities($data);
		}
		
		$placeholderCount = 1;
		$where = dbEntity::generateWherePlaceholders($args, $placeholderCount, false);
		$tableName = $this->tableName;
		
		$query = "delete from $tableName $where";
		$params = array_values($args);
		dbEntity::queryRows($query, $params);
		$this->executePostponed();
		
		foreach($this->afterDelete as $h)  $h($args);
	}
	
}

// first function is converter, second is parser
// converter is applied to value when it is writed to base, parser - when readed from base

// parsers and converters for these 4 basic types are NOT used every time: 
// this is exception for them as they are parsed/converted very fast
// ... and there is BIG overhead of function calling, so i just wrote them inline
dbEntity::defineDBtype('int',		
	function($v) { return $v === null? null: (int)$v; },
	function($v) { return $v === null? null: (int)$v; });
dbEntity::defineDBtype('float',		
	function($v) { return $v === null? null: (float)$v; },
	function($v) { return $v === null? null: (float)$v; });
dbEntity::defineDBtype('string',	
	function($v) { return $v === null? null: (string)$v; }, 
	function($v) { return $v === null? null: (string)$v; });
dbEntity::defineDBtype('boolean',		
	function($v) { return $v === null? null: $v? true: false; }, 
	function($v) { return $v === null? null: strtolower(substr((string)$v,0,1))==='t'; });