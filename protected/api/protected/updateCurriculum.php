<?php

function getApiDataTemplate(){
	return '{
		lab: isInt(),
		lec: isInt(),
		prk: isInt(),
		srs: isInt(),
		etc: isInt(),
		
		id: isInt(),
		
		note?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $curriculum;

	if(!isset($data['note'])) $data['note'] = null;
	
	$curriculum->update($data);
}