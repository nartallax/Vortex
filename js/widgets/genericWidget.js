// some common widget. contains very basic functions
widget.list.genericWidget = (function(){

	return {
		init: function(tag){
			this.widgetData = {};
		},
		className: "widget",
		methods: {
			hide: function(){
				if(this.style.display !== "none"){ 
					this.widgetData.displayBeforeHide = this.style.display;
					this.style.display = "none";
				}
				return this;
			},
			show: function(){
				if(this.style.display === "none"){
					this.style.display = this.widgetData.displayBeforeHide || "";
				}
				return this;
			}, 
			listen: function(eName, func){ addListener(eName, func, this); },
			unlisten: function(eName, func){ removeListener(eName, func, this); },
			fire: function(eName, eData){
				var eObj = createEvent(eName);
				eObj.data = eData || {};
				fireEvent(eOj, this);
			}
		}
	}
})();