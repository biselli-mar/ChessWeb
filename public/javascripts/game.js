/* eslint-disable no-undef */

"use strict"

const chessBoard = $('#chessboard');
const chessBoardOffset = chessBoard.offset();
const pieceOffset = chessBoard.width() / 12;  // Divide by a bit more than 8 so that piece is closer to mouse
const chessBoardOffsetLeft = chessBoardOffset.left + pieceOffset;
const chessBoardOffsetTop = chessBoardOffset.top + pieceOffset;
const root = document.documentElement;
const main = $('main');

const files = 'ABCDEFGH';

const pieces = $('.piece');

let trackMouse = false;

main.on('mousemove', (event) => {
    if (trackMouse) {
        root.style.setProperty('--chess-mouse-x', (event.clientX - chessBoardOffsetLeft) + 'px');
        root.style.setProperty('--chess-mouse-y', (event.clientY - chessBoardOffsetTop) + 'px');
    }
})

function hintDiv(destTile, srcTile) {
    const hint = document.createElement('div');
    hint.classList.add('hint');
    const squareNum = '' + (files.indexOf(destTile[0]) + 1) + destTile[1];
    if ($('.square-' + squareNum)[0]) {
        hint.classList.add('hint-capture');
    } else {
        hint.classList.add('hint-move');
    }
    hint.classList.add('square-' + squareNum);
    hint.addEventListener('click', () => {
        postMove(srcTile, destTile);
    });

    return hint;
}

function postMove(from, to) {
    const moveForm = $('#move-form');

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
            location.reload();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Encountered error while moving piece\nError code: " + textStatus + "\n" + errorThrown);
        }
    });
}


pieces.on('mousedown', (event) => {
    trackMouse = true;
    // Reset property since values of previous move could be different
    root.style.setProperty('--chess-mouse-x', (event.clientX - chessBoardOffsetLeft) + 'px');
    root.style.setProperty('--chess-mouse-y', (event.clientY - chessBoardOffsetTop) + 'px');
    event.target.classList.add('dragging');

    // Send post request to server to select that piece
    const selectForm = $('#select-form');

    $('.hint').remove();

    const piece = event.target;
    piece.classList.forEach((className) => {
        if (className.startsWith('square-')) {
            const tile = files[parseInt(className[7]) - 1] + className[8];

            const formData = {
                csrfToken: selectForm.children('input[name="csrfToken"]').val(),
                tile: tile
            }

            $.ajax({
                type:'POST',
                url: '/play/select',
                data: formData,
                dataType: 'json',
                success: function(data) {
                    for (const move of data) {
                        chessBoard.append(hintDiv(move, tile));
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("Encountered error while receiving legal moves\nError code: " + textStatus + "\n" + errorThrown);
                }
            });
            return;
        }
    });
})

pieces.on('mouseup', (event) => {
    trackMouse = false;
    event.target.classList.remove('dragging');
})
