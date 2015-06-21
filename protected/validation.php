<?php

/* в этом файле собраны все функции валидации */
	
class validation{

	public static $regexps = array(
		'hash' => '[a-fA-F\d]{32}',
		'login' => '[a-zA-Z\d_\-\s]{3,31}',
		'api_func_name' => '[a-zA-Z_]+'
	);
	
	public static function validate($targetType, $data){
		return preg_match('/^' . validation::$regexps[$targetType] . '$/', $data) > 0;
	}
	
	public static function arrayIsDate($arr){
		return  is_array($arr) 						&&
				array_key_exists('year', $arr) 		&&	$arr['year'] >= 1970	&&
				array_key_exists('month', $arr)		&&	$arr['month'] >= 1 		&& $arr['month'] <= 12	&&
				array_key_exists('day', $arr)		&&	$arr['day'] >= 1		&& $arr['day'] <= cal_days_in_month(CAL_GREGORIAN, $arr['month'], $arr['year']) &&
				array_key_exists('hours', $arr)		&&	$arr['hours'] >= 0		&& $arr['hours'] <= 23	&&
				array_key_exists('minutes', $arr)	&&	$arr['minutes'] >= 0	&& $arr['minutes'] <= 59 &&
				array_key_exists('seconds', $arr)	&&	$arr['seconds'] >= 0	&& $arr['seconds'] <= 59;
	}
	
}