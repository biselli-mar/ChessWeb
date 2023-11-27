/* eslint-disable no-undef */

"use strict"

//=============== Constants ==================

const chessBoard = $('#chessboard');
const moveForm = $('#move-form');

const selectHighlight = $('#select-highlight');
const moveHighlightFrom = $('#move-highlight-from');
const moveHighlightTo = $('#move-highlight-to');
const checkHighlight = $('#check-highlight');

const playerTurn = $('#state-color-display');
const halfMoves = $('#state-half-moves-display');
const fullMoves = $('#state-full-moves-display');

const gameOverModal = $('#game-over-modal');
const gameOverModalIcon = $('#game-over-modal-icon');
const gameOverModalText = $('#game-over-modal-text');
const gameOverModalTitle = $('#game-over-modal-title');
const gameOverModalButton = $('#game-over-modal-button');
gameOverModalButton.on('click', () => {
    gameOverModal.modal('toggle');
});

const moveSound = $('#move-sound')[0];
moveSound.volume = 0.1;
const captureSound = $('#capture-sound')[0];
captureSound.volume = 0.1;
const checkSound = $('#check-sound')[0];
checkSound.volume = 0.1;

const fileChars = 'ABCDEFGH';   // used to convert file number to letter
let position = {};              // contains map of tiles to pieces
let legalMoves = {};            // contains map of tiles to tiles
const animationDuration = 350;  // milliseconds

//=============== Helper Functions ==================

function getColRow(tile) {
    return '' + (fileChars.indexOf(tile[0]) + 1) + tile[1];
}

function getTileTransformValues(tile, pieceWidth) {
    const colRow = getColRow(tile);
    
    if ($('.flipped')[0] === undefined) {
        return {
            x: (colRow[0] - 1) * pieceWidth,
            y: (8 - colRow[1]) * pieceWidth
        }
    } else {
        return {
            x: (8 - colRow[0]) * pieceWidth,
            y: (colRow[1] - 1) * pieceWidth
        }
    
    }
}

function removeSquareClass(div) {
    div[0].classList.forEach((className) => {
        if (className.startsWith('square-')) {
            div.removeClass(className);
        }
    });
}

//=============== Event Listeners ==================

document.addEventListener('DOMContentLoaded', () => {
    // Add pieces to board
    setPosition();
});

function pieceMousedownHandler(event) {
    $('.hint').remove();

    const piece = event.target;
    piece.classList.forEach((className) => {
        if (className.startsWith('square-')) {
            const tile = fileChars[parseInt(className[7]) - 1] + className[8];

            removeSquareClass(selectHighlight);
            selectHighlight.addClass(className);
            selectHighlight.removeClass('visually-hidden');

            const moves = legalMoves[tile];
            if (moves === undefined) return;
            for (const move of moves) {
                chessBoard.append(hintDiv(move, tile));
            }
            return;
        }
    });
}

function pieceDragstartHandler(event) {
    const piece = event.target;
    piece.classList.add('visually-hidden');

    const pieceImageSrc = window.getComputedStyle(piece).backgroundImage;
    const pieceWidth = piece.offsetWidth;

    const dragImage = document.createElement('img');
    dragImage.src = pieceImageSrc.substring(5, pieceImageSrc.length - 2); // remove `url("` and `")`
    dragImage.width = pieceWidth;

    event.dataTransfer.setDragImage(dragImage, pieceWidth, pieceWidth);
    event.dataTransfer.setData('text/plain', piece.id); // Send the piece id
}

function addHintEventListeners(hint, srcTile, destTile) {
    hint.addEventListener('click', () => {
        postMove(srcTile, destTile, true);
    });

    hint.addEventListener('dragover', (event) => {
        hint.classList.add('hint-drop');
        event.preventDefault();
    });

    hint.addEventListener('dragleave', (event) => {
        hint.classList.remove('hint-drop');
        event.preventDefault();
    });

    hint.addEventListener('drop', (event) => {
        event.preventDefault();
        postMove(srcTile, destTile);
    });
}

//=============== DOM ==================

function hintDiv(destTile, srcTile) {
    const hint = document.createElement('div');
    hint.classList.add('hint');
    const squareNum = getColRow(destTile);
    if ($('.piece.square-' + squareNum)[0]) {
        hint.classList.add('hint-capture');
    } else {
        hint.classList.add('hint-move');
    }
    hint.classList.add('square-' + squareNum);
    
    addHintEventListeners(hint, srcTile, destTile);

    return hint;
}

function pieceDiv(piece, tile) {
    const pieceDiv = document.createElement('div');
    tile = getColRow(tile);
    pieceDiv.classList.add('piece');
    pieceDiv.classList.add(piece);
    pieceDiv.classList.add('square-' + tile);
    pieceDiv.id = piece + '-' + tile;
    pieceDiv.draggable = true;
    return pieceDiv;
}

function setPosition() {
    getPosition((data) => {
        position = data;
        fillBoard(position["pieces"]);
        getLegalMoves((data) => {
            legalMoves = data;
            chessBoard.removeClass('visually-hidden');
        });
    });
}

function fillBoard(position) {
    for (const [tile, piece] of Object.entries(position)) {
        chessBoard.append(pieceDiv(piece, tile));
    }

    const pieces = $('.piece');

    pieces.on('mousedown', pieceMousedownHandler);

    pieces.each((index, piece) => {
        piece.addEventListener('dragstart', pieceDragstartHandler);
        piece.addEventListener('dragend', () => {
            piece.classList.remove('visually-hidden');

        });
    });
}

function processMove(from, to, animate) {
    $('.hint').remove();
    
    const colRowFrom = getColRow(from);
    const colRowTo = getColRow(to);
    let fromPiece = position["pieces"][from];
    selectHighlight.addClass('visually-hidden');
    removeSquareClass(selectHighlight);
    let fromPieceDiv = $('#' + fromPiece + '-' + colRowFrom);
    getPosition((newPosition) => {
        if (position["pieces"][from] !== newPosition["pieces"][to]) { // promotion
            fromPieceDiv.removeClass(position["pieces"][from]);
            fromPieceDiv.addClass(newPosition["pieces"][to]);
            fromPiece = newPosition["pieces"][to];
        }
        if (animate) {
            const pieceWidth = fromPieceDiv.width();
            const fromTransform = getTileTransformValues(from, pieceWidth);
            const toTransform = getTileTransformValues(to, pieceWidth);
            const toTransformDiff = {
                x: toTransform['x'] - fromTransform['x'],
                y: toTransform['y'] - fromTransform['y']
            }

            fromPieceDiv.animate(
            {
                left: '+=' + toTransformDiff['x'],
                top: '+=' + toTransformDiff['y']
            },
            {
                duration: animationDuration,
                start: () => {
                    fromPieceDiv.css('z-index', 100);
                },
                done: () => {
                    fromPieceDiv.addClass('square-' + colRowTo);
                    fromPieceDiv.removeClass('square-' + colRowFrom);
                    fromPieceDiv.attr('style', '');
                    fromPieceDiv.attr('id', fromPiece + '-' + colRowTo);
                }
            });
        }
        if($('.piece.square-' + getColRow(to))[0] !== undefined){
            captureSound.play();
        }
        else{
            moveSound.play();
        }     
        $('.piece.square-' + getColRow(to)).remove();
        const diff = getPositionDiff(newPosition);
        for (const [tile, piece] of Object.entries(diff)) {
            if (tile !== from && piece === undefined) {
                $('.square-' + getColRow(tile)).remove('.piece');
            } else if (tile !== to && piece !== undefined) {
                chessBoard.append(pieceDiv(piece, tile));
            } else if (tile === to && !animate) {
                fromPieceDiv.removeClass('square-' + colRowFrom);
                fromPieceDiv.addClass('square-' + colRowTo);
                fromPieceDiv.attr('id', fromPiece + '-' + colRowTo);
            }
        }

        const turnColor = newPosition["state"]["color"];
        const kingDiv = $('.piece.'+turnColor+'k')[0];

        kingDiv.classList.forEach((className) => {
            if (className.startsWith('square-')) {
                if (newPosition["check"]) {
                    checkSound.play();
                    removeSquareClass(checkHighlight);
                    checkHighlight.removeClass('visually-hidden');
                    checkHighlight.addClass(className);
                } else {
                    checkHighlight.addClass('visually-hidden');
                }
            }
        });

        if (newPosition["game-state"] == 'CHECKMATE') {
            gameOverModalTitle.text('Checkmate');
            const whiteWon = turnColor == 'b';
            gameOverModalIcon.addClass(whiteWon ? 'wk' : 'bk');
            gameOverModalText.text((whiteWon ? 'White' : 'Black') + ' wins!');
            gameOverModal.modal('toggle');
        } else if (newPosition["game-state"] == 'DRAW') {
            gameOverModalTitle.text('Draw');
            gameOverModalText.text('The game ended in a draw');
            gameOverModal.modal('toggle');
        }

        
        playerTurn.text(turnColor == 'w' ? 'White' : 'Black');
        halfMoves.text(newPosition["state"]["halfMoves"]);
        fullMoves.text(newPosition["state"]["fullMoves"]);

        position = newPosition;
        legalMoves = {};
        getLegalMoves((newLegalMoves) => {
            legalMoves = newLegalMoves;
        });

        removeSquareClass(moveHighlightFrom);
        moveHighlightFrom.removeClass('visually-hidden');
        moveHighlightFrom.addClass('square-' + colRowFrom);
        removeSquareClass(moveHighlightTo);
        moveHighlightTo.removeClass('visually-hidden');
        moveHighlightTo.addClass('square-' + colRowTo);
    });
}

/*
 * Returns a map of tiles to pieces that have changed
 * If an entry is undefined, that means the piece has moved or was taken
 */
function getPositionDiff(newPosition) {
    const diff = {};
    for (const [tile, piece] of Object.entries(newPosition["pieces"])) {
        if (position["pieces"][tile] !== piece) {
            diff[tile] = piece;
        }
    }
    for (const [tile, piece] of Object.entries(position["pieces"])) {
        if (newPosition["pieces"][tile] !== piece) {
            diff[tile] = newPosition["pieces"][tile];
        }
    }
    return diff;
}

//=============== Ajax ==================

function postMove(from, to, animate = false) {
    const formData = {
        csrfToken: moveForm.children('input[name="csrfToken"]').val(),
        from: from,
        to: to
    }

    $.ajax({
        type:'POST',
        url: '/play/move',
        data: formData,
        success: function() {
            processMove(from, to, animate);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Encountered error while moving piece\nError code: " + textStatus + "\n" + errorThrown);
            return [];
        }
    });
}

function getPosition(successFunc) {
    $.ajax({
        type:'GET',
        url: '/api/position',
        dataType: 'json',
        success: function(data) {
            successFunc(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Encountered error while receiving piece positions\nError code: " + textStatus + "\n" + errorThrown);
        }
    });

}

function getLegalMoves(successFunc) {
    $.ajax({
        type:'GET',
        url: '/api/moves',
        dataType: 'json',
        success: function(data) {
            successFunc(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Encountered error while receiving legal moves\nError code: " + textStatus + "\n" + errorThrown);
        }
    });

}