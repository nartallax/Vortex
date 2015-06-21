<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $changeset;
	
	$changeset->delete($data);
}