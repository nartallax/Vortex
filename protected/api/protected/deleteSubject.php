<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $subject;
	
	$subject->delete($data);
}