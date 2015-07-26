<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $lootingSession;
	
	$lootingSession->delete($data);
}