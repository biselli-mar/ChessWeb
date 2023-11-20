/* eslint-disable no-undef */

"use strict"

//=============== Constants ==================

const chessBoard = $('#chessboard');
const moveForm = $('#move-form');
const selectHighlight = $('#select-highlight');
const moveHighlightFrom = $('#move-highlight-from');
const moveHighlightTo = $('#move-highlight-to');
const moveSound = $('#moveSound')[0];
const captureSound = $('#captureSound')[0];
const fileChars = 'ABCDEFGH';   // used to convert file number to letter
let position = {};              // contains map of tiles to pieces
let legalMoves = {};            // contains map of tiles to tiles
const animationDuration = 500;  // milliseconds

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

function playMoveSound() {
    moveSound.play();
}

function removeSquareClass(div) {
    div[0].classList.forEach((className) => {
        if (className.startsWith('square-')) {
            div.removeClass(className);
        }
    });
}
function playCaptureSound() {
    captureSound.play();
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
        fillBoard(position);
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
    let fromPiece = position[from];
    selectHighlight.addClass('visually-hidden');
    removeSquareClass(selectHighlight);
    let fromPieceDiv = $('#' + fromPiece + '-' + colRowFrom);
    getPosition((newPosition) => {
        if (position[from] !== newPosition[to]) { // promotion
            fromPieceDiv.removeClass(position[from]);
            fromPieceDiv.addClass(newPosition[to]);
            fromPiece = newPosition[to];
            fromPieceDiv = $('#' + fromPiece + '-' + colRowFrom);
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
            playCaptureSound();
        }
        else{
            playMoveSound();
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

        position = newPosition;
        legalMoves = {};
        getLegalMoves((data) => {
            legalMoves = data;
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
    for (const [tile, piece] of Object.entries(newPosition)) {
        if (position[tile] !== piece) {
            diff[tile] = piece;
        }
    }
    for (const [tile, piece] of Object.entries(position)) {
        if (newPosition[tile] !== piece) {
            diff[tile] = newPosition[tile];
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