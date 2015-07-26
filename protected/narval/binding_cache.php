<?php
namespace Narval;

/*
	BindingCache - кеш, через который Reference может получить значение в процессе bind-а.
	Подразумевается, что выражение получает данные только через этот кеш.
	Нужен для того, чтобы:
		1. получать значения по идентификатору вида корень.ветка.лист
		2. кешировать значения, чтобы не получать большие значения во второй раз (это может быть затратно)
*/

class BindingCache{
	private $data;
	private $cache = array();
	
	private static function isNumericIndexArray($arr){
		if(!is_array($arr)) return false;
		foreach($arr as $k => $v) return is_int($k);
	}
	
	private static function isFlat(&$arrArr){
		foreach($arrArr as $arr)
			if(is_array($arr))
				return false;
		return true;
	}
	private static function flattenTo(&$arrArr, &$result){
		foreach($arrArr as $arr)
			if(is_array($arr)) BindingCache::flattenTo($arr, $result);
			else $result[] = $arr;
	}
	private static function flatten(&$arrArr){
		if(!is_array($arrArr) || BindingCache::isFlat($arrArr)) return $arrArr;
		$result = array();
		BindingCache::flattenTo($arrArr, $result);
		return $result;
	}
	
	private static function firstOf($arr){
		foreach($arr as $v) return $v;
	}
	
	private function valueByPath($path){
		$chain = explode('.', $path);
		$root = array($this->data);
		$asArray = false;
		foreach($chain as $part){
			$newRoot = array();
			foreach($root as $branch){
				if(BindingCache::isNumericIndexArray($branch)){
					$asArray = true;
					foreach($branch as $b)
						if(array_key_exists($part, $b))
							$newRoot[] = $b[$part];
				} else if(array_key_exists($part, $branch))
						$newRoot[] = $branch[$part];
			}
			if(count($newRoot) === 0) return null;
			$root = $newRoot;
		}
		$result = $asArray? $root: BindingCache::firstOf($root);
		return BindingCache::flatten($result);
	}
	
	public function __construct($data){ $this->data = $data; }
	
	public function resolve($path){
		if(!array_key_exists($path, $this->cache))
			$this->cache[$path] = $this->valueByPath($path);
		return $this->cache[$path];
	}
}