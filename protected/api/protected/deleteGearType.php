<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $gearType;
	
	$gearType->delete($data);
}