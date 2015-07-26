<?php

function getApiDataTemplate(){
	return '{}';
}
	
function calledApiFunction($data){ 
	return db\getTruncatedCommonData();
}