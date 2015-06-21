/* в этом файле - обертка вокруг анализатора расписания */
var analyser = (function(){

	var checks = []
	var registerCheck = function(check){ checks.push(check); }
	
	var checkAll = function(target){
		var result = [];
		for(var i in checks){
			var check = checks[i];
			var subResult = check.apply(target);
			for(var j in subResult)
				result.push(check.getMessage(subResult[j]));
		}
		return result;
	}

	var progressFunctions = [];
	var registerProgressFunction = function(handler){ progressFunctions.push(handler); }
	
	var analyser = function(){
	}
	
	analyser.checkAll = checkAll;
	analyser.registerCheck = registerCheck;
	analyser.registerProgressFunction = registerProgressFunction;
	
	return analyser;

})();