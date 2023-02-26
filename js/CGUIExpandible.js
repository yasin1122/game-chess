function CGUIExpandible(iX, iY, oSprite, oParentContainer){
    var _bExpanded;
    
    var _aButtons;
    var _aButtonsObj;
    
    var _oParent;
    var _oMenuBut;
    var _oGUIContainer;
    var _oBackContainer;
    var _oFrontContainer;
    var _oExpandedPos;
    
    var _pStartPos;
    
    this._init = function(iX, iY, oSprite, oParentContainer){
        
        _aButtons = new Array();
        _aButtonsObj = new Array();
        
        _pStartPos = {x: iX, y: iY};
        _oGUIContainer = new createjs.Container();
        _oGUIContainer.x = iX;
        _oGUIContainer.y = iY;
        oParentContainer.addChild(_oGUIContainer);
        
        _oBackContainer = new createjs.Container();
        _oGUIContainer.addChild(_oBackContainer);
        
        _oFrontContainer = new createjs.Container();
        _oGUIContainer.addChild(_oFrontContainer);
        
        _bExpanded = false;
        _oMenuBut = new CGfxButton(0,0,oSprite, _oFrontContainer);
        _oMenuBut.addEventListener(ON_MOUSE_UP, this._onMenu, this);
        
        var oStart = {x: 0, y: 120};
        _oExpandedPos = {start: oStart, offset: 120};
        
    };
    
    this.unload = function(){
        _oMenuBut.unload();
        oParentContainer.removeChild(_oGUIContainer);
    };
    
    this.refreshPos = function(iNewX, iNewY){
        ////REMOVE ALL BUTTONS FROM REFRESH FUNCTIONS IN INTERFACE OR IN OTHER MENUES
        
        _oGUIContainer.x = iX - iNewX;
        _oGUIContainer.y = iY + iNewY;
    };
    
    this.addButton = function(oObjClass){
        var oButton = oObjClass.getButtonImage();
        
        oButton.x = 0;
        oButton.y = 0;
        oButton.visible = 0;
        _oBackContainer.addChildAt(oButton, 0);
        
        
        
        _aButtons.push(oButton);
        _aButtonsObj.push(oObjClass);
        
    };
    
    this._onMenu = function(){
        _oParent.stopTrembleAnimation();
        
        _bExpanded = !_bExpanded;

        if(_bExpanded){
            _oParent._expand();
            //s_oGame.onPause();
            
        }else{
            _oParent._collapse();
            //s_oGame.onResume();
        }
        
    };
    
    this._expand = function(){
        var iTime = 300;
        for(var i=0; i<_aButtons.length; i++){
            _aButtons[i].visible = true;
            createjs.Tween.get(_aButtons[i], {override:true}).wait(i*iTime/2).to({y: _oExpandedPos.start.y + i*_oExpandedPos.offset}, iTime, createjs.Ease.cubicOut);
        };
    };
    
    this._collapse = function(){
        var iTime = 300;
        for(var i=0; i<_aButtons.length; i++){
            var oButton = _aButtons[_aButtons.length-1-i];
            createjs.Tween.get(oButton, {override:true}).wait(i*iTime/2).to({y: 0}, iTime, createjs.Ease.cubicOut).call(function(oButton){
                oButton.visible = false;
            }, [oButton]);
        };
    };
    
    this.trembleAnimation = function () {
        if(_bExpanded){
            _aButtonsObj[_aButtonsObj.length-1].trembleAnimation();
        }else{
            _oMenuBut.trembleAnimation();
        }
        
    };
    
    this.stopTrembleAnimation = function(){
        if(_bExpanded){
            _aButtonsObj[_aButtonsObj.length-1].stopAnimation();
        }else{
            _oMenuBut.stopAnimation();
        }
    };
    
    _oParent = this;
    this._init(iX, iY, oSprite, oParentContainer);
}


