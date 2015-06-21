<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	global $sessionData;
	global $preference;
	
	return $preference->fetchByCols(array('lector' => $sessionData['id']), array('schedule', 'type', 'item_a', 'item_b', 'item_c', 'item_d'));
}