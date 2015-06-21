<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $cohort;
	
	$cohort->delete(array('id' => $data['id']));
}