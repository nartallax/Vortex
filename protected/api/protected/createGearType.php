<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		note?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $gearType;

	if(!isset($data['note'])) $data['note'] = null;
	
	$result = $gearType->create($data);
	return $result['id'];
}