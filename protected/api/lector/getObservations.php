<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	global $sessionData;
	
	$list = utils::getDirFileList('./observations/');
	$mask = 'lector' . $sessionData['id'] . '_';
	
	$result = array();
	foreach($list as $file)
		if(preg_match('/^' . $mask . '(\d+)/', $file, $match) > 0){
			$file = fopen('./observations/' . $file, 'r');
			$result[intval($match[1])] = fgets($file);
			fclose($file);
		}
	
	return $result;
}