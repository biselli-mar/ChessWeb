/* eslint-disable no-undef */

"use strict"

//=============== Constants ==================

const chessBoard = $('#chessboard');
const moveForm = $('#move-form');
const moveSound = $('#moveSound')[0];
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

//=============== DOM ==================
function playMoveSound() {
    moveSound.play();
}


function hintDiv(destTile, srcTile) {
    const hint = document.createElement('div');
    hint.classList.add('hint');
    const squareNum = getColRow(destTile);
    if ($('.square-' + squareNum)[0]) {
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
    playMoveSound();

    const colRowFrom = getColRow(from);
    const colRowTo = getColRow(to);
    const fromPiece = position[from];
        const fromPieceDiv = $('.square-' + colRowFrom);
    getPosition((newPosition) => {
        if (animate) {
            // animate piece from from to to
            
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
        $('.square-' + getColRow(to)).remove();
        const diff = getPositionDiff(newPosition);
        for (const [tile, piece] of Object.entries(diff)) {
            if (tile !== from && piece === undefined) {
                $('.square-' + getColRow(tile)).remove();
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
