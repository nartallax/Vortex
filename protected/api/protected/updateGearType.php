<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		id: isInt(),
		
		note?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $gearType;
	
	$gearType->update($data);
}