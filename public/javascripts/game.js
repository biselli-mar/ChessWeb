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


pieces.on('mousedown', (event) => {
    trackMouse = true;
    // Reset property since values of previous move could be different
    root.style.setProperty('--chess-mouse-x', (event.clientX - chessBoardOffsetLeft) + 'px');
    root.style.setProperty('--chess-mouse-y', (event.clientY - chessBoardOffsetTop) + 'px');
    event.target.classList.add('dragging');

    // Send post request to server to select that piece
    const selectForm = $('#select-form');

    const piece = event.target;
    piece.classList.forEach((className) => {
        if (className.startsWith('square-')) {
            const file = files[parseInt(className[7]) - 1];
            const rank = className[8];

            const formData = {
                csrfToken: selectForm.children('input[name="csrfToken"]').val(),
                tile: file + rank
            }

            $.post('/play/select', formData, (response) => {
                if (response.success) {
                    console.log('Successfully selected piece');
                } else {
                    console.log('Failed to select piece');
                }
            });

            selectForm.submit();
            return;
        }
    });
})

pieces.on('mouseup', (event) => {
    trackMouse = false;
    event.target.classList.remove('dragging');
})
