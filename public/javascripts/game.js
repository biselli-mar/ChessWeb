/* eslint-disable no-undef */

"use strict"

const chessBoard = $('#chessboard');
const pieces = $('.piece');
const fileChars = 'ABCDEFGH';

function getColRow(tile) {
    return '' + (fileChars.indexOf(tile[0]) + 1) + tile[1];
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
    
    hint.addEventListener('click', () => {
        postMove(srcTile, destTile);
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
            alert("Encountered error while moving piece\nError code: " + textStatus + "\n" + errorThrown);
        }
    });
}

pieces.on('mousedown', (event) => {

    // Send post request to server to select that piece
    const selectForm = $('#select-form');

    $('.hint').remove();

    const piece = event.target;
    piece.classList.forEach((className) => {
        if (className.startsWith('square-')) {
            const tile = fileChars[parseInt(className[7]) - 1] + className[8];

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
});

pieces.each((index, piece) => {
    piece.addEventListener('dragstart', (event) => {
        piece.classList.add('visually-hidden');

        const pieceImageSrc = window.getComputedStyle(piece).backgroundImage;
        const pieceWidth = piece.offsetWidth;

        const dragImage = document.createElement('img');
        dragImage.src = pieceImageSrc.substring(5, pieceImageSrc.length - 2); // remove `url("` and `")`
        dragImage.width = pieceWidth;

        event.dataTransfer.setDragImage(dragImage, pieceWidth, pieceWidth);
        event.dataTransfer.setData('text/plain', piece.id); // Send the piece id
    });
    piece.addEventListener('dragend', () => {
        piece.classList.remove('visually-hidden');
    });
});