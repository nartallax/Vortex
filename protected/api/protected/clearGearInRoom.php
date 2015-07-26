<?php

function getApiDataTemplate(){
	return '{
		type: isInt(),
		room?: isInt() || isNull()
	}'; 
}

function calledApiFunction($data){
	if(!isset($data['room'])) $data['room'] = null;	
	
	db\clearGearInRoom($data['type'], $data['room']);
}