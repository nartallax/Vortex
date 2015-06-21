<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $sessionData;
	unlink('./observations/lector' . $sessionData['id'] . '_' . $data['id']);
}