function CBoardStateController(){
    
    var _iTurnStallCount;
    
    this._init = function(){
        _iTurnStallCount = 0;
    };
   
    this.getOtherOpponent = function(szPlayer){
        if(szPlayer === WHITE){
            return BLACK;
        } else{
            return WHITE;
        }
    };
    
    this.moveCopiedPiece = function(aCopiedBoard, iStartRow, iStartCol, iDestRow, iDestCol){
        var oStartCopiedCell = aCopiedBoard[iStartRow][iStartCol];
        var oDestCopiedCell = aCopiedBoard[iDestRow][iDestCol];
        
        var iSpecialMove = this.getSpecialMoves(iStartRow, iStartCol, iDestRow, iDestCol, aCopiedBoard)
        switch( iSpecialMove ){
            case BOARD_SPECIAL_CASTLING_RIGHT:{
                    var oRookStartCell = aCopiedBoard[iStartRow][7];
                    var oRookDestCell = aCopiedBoard[iStartRow][5];
                    
                    oRookDestCell.setCell(oStartCopiedCell.getColor(), ROOK, iDestRow, iDestCol, oStartCopiedCell.getPieceHistory());
                    oRookStartCell.setCell(null, null, iStartRow, iStartCol, []);
                    break;
            }
            case BOARD_SPECIAL_CASTLING_LEFT:{
                    var oRookStartCell = aCopiedBoard[iStartRow][0];
                    var oRookDestCell = aCopiedBoard[iStartRow][3];
                    
                    oRookDestCell.setCell(oStartCopiedCell.getColor(), ROOK, iDestRow, iDestCol, oStartCopiedCell.getPieceHistory());
                    oRookStartCell.setCell(null, null, iStartRow, iStartCol, []);
                    break;
            }
            case BOARD_SPECIAL_ENPASSANT:{
                    var oPawnToPassCell = aCopiedBoard[iStartRow][iDestCol];
                    oPawnToPassCell.setCell(null, null, iStartRow, iDestCol, []);
                    
                    break;
            }
        }

        oDestCopiedCell.setCell(oStartCopiedCell.getColor(), oStartCopiedCell.getType(), iDestRow, iDestCol, oStartCopiedCell.getPieceHistory());
        oStartCopiedCell.setCell(null, null, iStartRow, iStartCol, []);
    };
   
    this.copyBoard = function(aBoard){
        var aCopiedBoard = new Array();
        for(var i=0; i<aBoard.length; i++){
            aCopiedBoard[i] = new Array();
            for(var j=0; j<aBoard[i].length; j++){
                aCopiedBoard[i][j] = new CCopiedCell(aBoard[i][j]);
            }
        }
        return aCopiedBoard;
    };
    
    this.getState = function(szCurPlayer, aBoard){
        /////////// STARTS ALL KIND OF VERIFICATIONS
        var aThreatList = this.findAllChecks(szCurPlayer, aBoard);

        if(aThreatList.length !== 0){
            /// FIND CHECKMATE
            var bCheckMate = this.findCheckMate(szCurPlayer, aBoard);
            if(bCheckMate){
                return BOARD_STATE_CHECKMATE;
            } else {
                return BOARD_STATE_CHECK;
            }
        }
        
        /// FIND STALEMATE
        var bStaleMate = this.findStaleMate(szCurPlayer, aBoard);
        if(bStaleMate){
            return BOARD_STATE_STALEMATE;
        }
    };
   
    this.findCheckMate = function(szCurPlayer, aBoard){
        /////ONE CAN AVOID CHECKMATE ONLY BY: a) MOVING THE KING AWAY; b)EAT THREATENING PIECE; c) SHIELDING THE KING; WE CAN FIND ALL THESE CONDITIONS SEPARATELY
        ////OR WE COULD BE CHECK ITERATIVELY ALL PLAYER MOVES AND FIND JUST 1 MOVE THAT SAVE THE KING
        var bCheckMate = false;
        
        var aCurPlayerPieces = new Array();
        for(var i=0; i<aBoard.length; i++){
            for(var j=0; j<aBoard[i].length; j++){
                if(aBoard[i][j].getColor() === szCurPlayer){
                    aCurPlayerPieces.push(aBoard[i][j]);
                }
            }
        }
        
        ///FIND ALLIN SOLUTION
        for(var i=0; i<aCurPlayerPieces.length; i++){
            var aCurPieceMoveList = s_oMovesController.getMovesList(aCurPlayerPieces[i].getLogicPos().row, aCurPlayerPieces[i].getLogicPos().col, aBoard);
            for(var j=0; j<aCurPieceMoveList.length; j++){
                var aTempBoard = this.copyBoard(aBoard);
                this.moveCopiedPiece(aTempBoard, aCurPlayerPieces[i].getLogicPos().row, aCurPlayerPieces[i].getLogicPos().col, aCurPieceMoveList[j].row, aCurPieceMoveList[j].col);

                var aList = this.findAllChecks(szCurPlayer, aTempBoard);
                
                if(aList.length === 0){
                    return bCheckMate;
                }
            }
        }
        
        bCheckMate = true;

        return bCheckMate;
    };
   
    this.findAllChecks = function(szPlayerColor, aBoard){
        var szOpponentColor = this.getOtherOpponent(szPlayerColor);
        /*
        var aOpponentPieces = new Array();
        for(var i=0; i<aBoard.length; i++){
            for(var j=0; j<aBoard[i].length; j++){
                if(aBoard[i][j].getColor() === szOpponentColor){
                    aOpponentPieces.push(aBoard[i][j]);
                }
            }
        }
        
        var aMoves = new Array();
        for(var i=0; i<aOpponentPieces.length; i++){
            var oLogicPos = aOpponentPieces[i].getLogicPos();
            aMoves[i] = {list: s_oMovesController.getMovesList(oLogicPos.row, oLogicPos.col, aBoard), piece: aOpponentPieces[i]};
        }
        */
        var aMoves = this._getAllMovesList(szOpponentColor, aBoard);
       
        var aCheckPieceList = new Array();
        for(var i=0; i<aMoves.length; i++){
            for(var j=0; j<aMoves[i].list.length; j++){
                var oLogicPos = aMoves[i].list[j];
                if(aBoard[oLogicPos.row][oLogicPos.col].getColor()===szPlayerColor && aBoard[oLogicPos.row][oLogicPos.col].getType() === KING){
                    aCheckPieceList.push(aMoves[i].piece);
                }
            };
        };
        
        return aCheckPieceList;
    };
   
    this.findStaleMate = function(szCurPlayer, aBoard){
        var bStaleMate = this.findCheckMate(szCurPlayer, aBoard);

        ////CHECK IF YOU HAVE ENOUGH PIECES TO CONTINUE THE GAME
        if(!bStaleMate){
            var aBlackPieces = new Array();
            var aWhitePieces = new Array();
            for(var i=0; i<aBoard.length; i++){
                for(var j=0; j<aBoard[i].length; j++){
                    if(aBoard[i][j].getColor() === WHITE){
                        aWhitePieces.push(aBoard[i][j].getType());
                    }
                    if(aBoard[i][j].getColor() === BLACK){
                        aBlackPieces.push(aBoard[i][j].getType());
                    }
                }
            }
            
            /// ONLY KINGS REMAINS
            if(aBlackPieces.length === 1 && aWhitePieces.length === 1){
                bStaleMate = true;
                return bStaleMate;
            }
            /// ONLY KING AND BISHOP VS KING //////// ONLY KING AND BISHOP VS KING
            if( (aBlackPieces.length === 1 && aWhitePieces.length === 2) || (aBlackPieces.length === 2 && aWhitePieces.length === 1) ){
                var iBishop = aWhitePieces.indexOf(BISHOP)&&aBlackPieces.indexOf(BISHOP);
                var iKnight = aWhitePieces.indexOf(KNIGHT)&&aBlackPieces.indexOf(KNIGHT);
                
                if(iBishop >= 0 || iKnight >= 0){
                    bStaleMate = true;
                    return bStaleMate;
                }
            }
            /// ONLY KING AND BISHOP VS KING AND BISHOP
            if( (aBlackPieces.length === 2 && aWhitePieces.length === 2) ){
                var iBishop = aWhitePieces.indexOf(BISHOP)||aBlackPieces.indexOf(BISHOP);
                if(iBishop >= 0){
                    var aBishopBoardColor = new Array;
                    for(var i=0; i<aBoard.length; i++){
                        for(var j=0; j<aBoard[i].length; j++){
                            if(aBoard[i][j].getType()===BISHOP){
                                var iBoardColor = (i+j)%2;
                                aBishopBoardColor.push(iBoardColor);
                            }
                        }
                    }
                    if(aBishopBoardColor[0] === aBishopBoardColor[1]){
                        bStaleMate = true;
                        return bStaleMate;
                    }
                }
            }
        }

        ///CHECK FIFTY MOVES RULE
        if(_iTurnStallCount === DRAW_COUNTER){
            bStaleMate = true;
        }
        
        return bStaleMate;
    };
    
    this.kingInCheck = function(szCurPlayerTurnColor, aBoard){
        /////JUST FIND FIRST PIECE THAT CHECK THE KING
        var szOpponentColor = this.getOtherOpponent(szCurPlayerTurnColor);
        var aOpponentPieces = new Array();
        for(var i=0; i<aBoard.length; i++){
            for(var j=0; j<aBoard[i].length; j++){
                if(aBoard[i][j].getColor() === szOpponentColor){
                    var oOpponentPieces = aBoard[i][j];
                    var oLogicPos = oOpponentPieces.getLogicPos();
                    var aMoves = s_oMovesController.getMovesList(oLogicPos.row, oLogicPos.col, aBoard);

                    for(var k=0; k<aMoves.length; k++){
                        var oNewLogicPos = aMoves[k];
                        if(aBoard[oNewLogicPos.row][oNewLogicPos.col].getColor()===szCurPlayerTurnColor && aBoard[oNewLogicPos.row][oNewLogicPos.col].getType() === KING){
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    };
   
    this.increaseStallCount = function(){
        _iTurnStallCount++;
    };
    
    this.resetStall = function(){
        _iTurnStallCount = 0;
    };
   
    this.checkPromotion = function(aBoard){
        var oPawnPos = null;
        
        for(var i=0; i<aBoard.length; i++){
            if(aBoard[0][i].getType() === PAWN){
                oPawnPos = {row:0,col:i};
            } else if(aBoard[7][i].getType() === PAWN){
                oPawnPos = {row:7,col:i};
            }
        };
        return oPawnPos;
    };
   
    this.getSpecialMoves = function(iSourceRow, iSourceCol, iDestRow, iDestCol, aBoard){
        var szPiece = aBoard[iSourceRow][iSourceCol].getType();

        if(szPiece === KING){
            var iDirection = iSourceCol - iDestCol;
            if(iDirection === -2){
                return BOARD_SPECIAL_CASTLING_RIGHT;
            } else if(iDirection === 2){
                return BOARD_SPECIAL_CASTLING_LEFT;
            }
        }else if(szPiece === PAWN) {
            if(iSourceCol !== iDestCol && aBoard[iDestRow][iDestCol].getType() === null){
                return BOARD_SPECIAL_ENPASSANT;
            }
        }
    };
   
    this._getAllMovesList = function(szPlayerColor, aBoard){
        var aPieces = new Array();
        for(var i=0; i<aBoard.length; i++){
            for(var j=0; j<aBoard[i].length; j++){
                if(aBoard[i][j].getColor() === szPlayerColor){
                    aPieces.push(aBoard[i][j]);
                }
            }
        }

        var aMoves = new Array();
        for(var i=0; i<aPieces.length; i++){
            var oLogicPos = aPieces[i].getLogicPos();
            //THE 4TH PARAM IS TRUE TO PREVENT CASTLING CHECK. IF 2 KINGS CAN CASTLING, THE CONTROL LOOPING
            aMoves[i] = {list: s_oMovesController.getMovesList(oLogicPos.row, oLogicPos.col, aBoard, true), piece: aPieces[i]};
        }
        
        return aMoves;
    };
   
    
    this._getPiecesThatMatchAList = function(aMoves, aListToMatch){
        var aCheckPieceList = new Array();
        for(var i=0; i<aMoves.length; i++){
            var bFound = false;
            for(var j=0; j<aMoves[i].list.length; j++){
                var oLogicPos = aMoves[i].list[j];

                for(var k=0; k<aListToMatch.length;k++){
                    if(oLogicPos.row === aListToMatch[k].row && oLogicPos.col === aListToMatch[k].col){
                        bFound = true;
                        continue;
                    }
                }
                if(bFound){
                    continue
                }
            };

            if(bFound){
                aCheckPieceList.push(aMoves[i].piece);
            }

        };

        return aCheckPieceList;
    };
    
   
    this.checkCastlingBlockFromOpponent = function(iSpecialMoveType, szCurPlayerTurnColor, aBoard){
        ///NO NEED TO CHECK KING DESTINATION BECAUSE IT WILL BE CHECKED FROM "CHECK" CONTROL
        var iRow = szCurPlayerTurnColor === BLACK ? 0 : 7;
        var szOpponentColor = this.getOtherOpponent(szCurPlayerTurnColor);
        var aMoves = this._getAllMovesList(szOpponentColor, aBoard);
        
        var aMatchList = new Array();
        
        switch(iSpecialMoveType){
            case BOARD_SPECIAL_CASTLING_RIGHT:{
                    var aForbiddenCellList = [
                        {row:iRow, col:5},
                    ];

                    
                    aMatchList = this._getPiecesThatMatchAList(aMoves, aForbiddenCellList);
                    
                    
                    break;
            }
            case BOARD_SPECIAL_CASTLING_LEFT:{
                    var aForbiddenCellList = [
                        {row:iRow, col:3},
                    ];
                    
                    aMatchList = this._getPiecesThatMatchAList(aMoves, aForbiddenCellList);
                    
                    break;
            }

        }
        
        return aMatchList;
    };
   
    this._init();
    s_oBoardStateController = this;
}

var s_oBoardStateController;