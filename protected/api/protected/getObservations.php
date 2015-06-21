<?php

function getApiDataTemplate(){
	return '{}';
}

function calledApiFunction($data){
	$list = utils::getDirFileList('./observations/');
	
	$result = array();
	foreach($list as $file){
		$lector = -1;
		if(preg_match('/^lector(\d+)_/', $file, $match) > 0)
			$lector = intval($match[1]);
		if(!array_key_exists($lector, $result))
			$result[$lector] = array();
		$file = fopen('./observations/' . $file, 'r');
		$result[$lector][] = fgets($file);
		fclose($file);
	}
	return $result;
}